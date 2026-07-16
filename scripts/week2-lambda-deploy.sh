#!/usr/bin/env bash
# =============================================================================
# Pulari Restaurant — Week 2 Lambda + API Gateway Deployment
# Run from repo root: bash scripts/week2-lambda-deploy.sh
#
# Creates/updates:
#   • IAM execution role (scoped DynamoDB + CloudWatch Logs)
#   • 8 Lambda functions (Node.js 22, ESM)
#   • HTTP API (API Gateway v2) with Cognito JWT authorizer
#   • Routes (public + admin), integrations, CORS, $default auto-deploy stage
#
# Idempotent: safe to re-run. Re-running updates code + config in place.
# =============================================================================
set -euo pipefail

# ─── CONFIG ──────────────────────────────────────────────────────────────────
REGION="eu-west-1"
ACCOUNT_ID="550357520654"
USER_POOL_ID="eu-west-1_OaOEegHaY"
COGNITO_CLIENT_ID="6vsfbafb4irkeqh104el0u9gga"
ADMIN_GROUP="admins"

ROLE_NAME="pulari-lambda-exec"
API_NAME="pulari-api"
RUNTIME="nodejs22.x"
LAMBDA_PREFIX="pulari"
LAMBDA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lambda"
DIST_DIR="$LAMBDA_DIR/dist"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }

ISSUER="https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}"

# Stripe keys: provided via the environment when going live. If omitted, any
# value already configured on the deployed Lambda is PRESERVED (never wiped).
read_existing_env() {
  # $1 = function name, $2 = variable key
  local v
  v=$(aws lambda get-function-configuration --function-name "$1" --region "$REGION" \
        --query "Environment.Variables.$2" --output text 2>/dev/null || echo "")
  [ "$v" = "None" ] && v=""
  echo "$v"
}
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-$(read_existing_env "${LAMBDA_PREFIX}-payments" STRIPE_SECRET_KEY)}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-$(read_existing_env "${LAMBDA_PREFIX}-webhook" STRIPE_WEBHOOK_SECRET)}"
SES_FROM_ADDRESS="${SES_FROM_ADDRESS:-$(read_existing_env "${LAMBDA_PREFIX}-orders" SES_FROM_ADDRESS)}"
RESTAURANT_EMAIL="${RESTAURANT_EMAIL:-$(read_existing_env "${LAMBDA_PREFIX}-orders" RESTAURANT_EMAIL)}"
[ -z "$RESTAURANT_EMAIL" ] && RESTAURANT_EMAIL="pularidesicafe@gmail.com"

# Lambda shared environment (JSON form — handles empty values cleanly).
LAMBDA_ENV=$(cat <<EOF
{"Variables":{"COGNITO_USER_POOL_ID":"${USER_POOL_ID}","COGNITO_CLIENT_ID":"${COGNITO_CLIENT_ID}","ADMIN_GROUP":"${ADMIN_GROUP}","TABLE_MENU":"pulari-menu","TABLE_ORDERS":"pulari-orders","TABLE_RESERVATIONS":"pulari-reservations","TABLE_REVIEWS":"pulari-reviews","TABLE_COUPONS":"pulari-coupons","TABLE_SETTINGS":"pulari-settings","TABLE_BLOG":"pulari-blog","TABLE_AUDIT":"pulari-audit","STRIPE_SECRET_KEY":"${STRIPE_SECRET_KEY}","STRIPE_WEBHOOK_SECRET":"${STRIPE_WEBHOOK_SECRET}","SES_FROM_ADDRESS":"${SES_FROM_ADDRESS}","RESTAURANT_EMAIL":"${RESTAURANT_EMAIL}"}}
EOF
)

echo ""
echo "======================================================"
echo " Pulari — Lambda + API Gateway Deploy"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================"
echo ""

# ─── 0. PRE-FLIGHT ───────────────────────────────────────────────────────────
[ -d "$DIST_DIR" ] || die "dist/ not found — run: cd lambda && npm run build"
command -v zip >/dev/null || die "zip not installed"

# ─── 1. IAM EXECUTION ROLE ───────────────────────────────────────────────────
echo "── STEP 1: IAM execution role ─────────────────────────────"

TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'

if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  warn "Role $ROLE_NAME already exists"
else
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "Pulari Lambda execution role" >/dev/null
  log "Created role $ROLE_NAME"
fi

# CloudWatch Logs (managed policy)
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" >/dev/null 2>&1 || true

# Scoped DynamoDB inline policy (only pulari-* tables + their indexes)
DDB_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem"
    ],
    "Resource": [
      "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/pulari-*",
      "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/pulari-*/index/*"
    ]
  }]
}
EOF
)
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "pulari-dynamodb-access" \
  --policy-document "$DDB_POLICY" >/dev/null
log "Attached scoped DynamoDB policy"

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
log "Role ARN: $ROLE_ARN"

# Allow IAM role to propagate before first Lambda create.
echo "Waiting 10s for IAM role propagation..."
sleep 10

# ─── 2. PACKAGE + DEPLOY LAMBDAS ─────────────────────────────────────────────
echo ""
echo "── STEP 2: Deploy 8 Lambda functions ──────────────────────"

HANDLERS=(menu orders reservations reviews coupons offers settings analytics payments webhook blog)

deploy_lambda() {
  local name="$1"
  local fn="${LAMBDA_PREFIX}-${name}"
  local src="$DIST_DIR/$name/index.mjs"
  local zip="$DIST_DIR/$name.zip"

  [ -f "$src" ] || die "Missing bundle: $src"
  (cd "$DIST_DIR/$name" && zip -q -j "$zip" index.mjs)

  if aws lambda get-function --function-name "$fn" --region "$REGION" >/dev/null 2>&1; then
    aws lambda update-function-code \
      --function-name "$fn" --zip-file "fileb://$zip" \
      --region "$REGION" >/dev/null
    aws lambda wait function-updated --function-name "$fn" --region "$REGION"
    aws lambda update-function-configuration \
      --function-name "$fn" \
      --runtime "$RUNTIME" --handler "index.handler" \
      --role "$ROLE_ARN" --timeout 15 --memory-size 256 \
      --environment "$LAMBDA_ENV" \
      --region "$REGION" >/dev/null
    warn "Updated $fn"
  else
    aws lambda create-function \
      --function-name "$fn" \
      --runtime "$RUNTIME" --handler "index.handler" \
      --role "$ROLE_ARN" --timeout 15 --memory-size 256 \
      --architectures arm64 \
      --environment "$LAMBDA_ENV" \
      --zip-file "fileb://$zip" \
      --region "$REGION" \
      --tags Project=Pulari,Environment=Production >/dev/null
    aws lambda wait function-active --function-name "$fn" --region "$REGION"
    log "Created $fn"
  fi
}

for h in "${HANDLERS[@]}"; do
  deploy_lambda "$h"
done

# ─── 3. HTTP API (API Gateway v2) ────────────────────────────────────────────
echo ""
echo "── STEP 3: HTTP API ───────────────────────────────────────"

API_ID=$(aws apigatewayv2 get-apis --region "$REGION" \
  --query "Items[?Name=='${API_NAME}'].ApiId | [0]" --output text)

if [ "$API_ID" = "None" ] || [ -z "$API_ID" ]; then
  API_ID=$(aws apigatewayv2 create-api \
    --name "$API_NAME" \
    --protocol-type HTTP \
    --cors-configuration "AllowOrigins=https://www.pulari.ie,https://pulari.ie,http://localhost:5173,AllowMethods=GET,POST,PUT,PATCH,DELETE,OPTIONS,AllowHeaders=content-type,authorization,MaxAge=3600" \
    --region "$REGION" \
    --query 'ApiId' --output text)
  log "Created HTTP API: $API_ID"
else
  warn "HTTP API already exists: $API_ID"
fi

API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com"

# ─── 4. COGNITO JWT AUTHORIZER ───────────────────────────────────────────────
echo ""
echo "── STEP 4: Cognito JWT authorizer ─────────────────────────"

AUTHZ_ID=$(aws apigatewayv2 get-authorizers --api-id "$API_ID" --region "$REGION" \
  --query "Items[?Name=='pulari-cognito'].AuthorizerId | [0]" --output text)

if [ "$AUTHZ_ID" = "None" ] || [ -z "$AUTHZ_ID" ]; then
  AUTHZ_ID=$(aws apigatewayv2 create-authorizer \
    --api-id "$API_ID" \
    --authorizer-type JWT \
    --name "pulari-cognito" \
    --identity-source '$request.header.Authorization' \
    --jwt-configuration "Audience=${COGNITO_CLIENT_ID},Issuer=${ISSUER}" \
    --region "$REGION" \
    --query 'AuthorizerId' --output text)
  log "Created JWT authorizer: $AUTHZ_ID"
else
  warn "JWT authorizer already exists: $AUTHZ_ID"
fi

# ─── 5. INTEGRATIONS (one per Lambda) ────────────────────────────────────────
echo ""
echo "── STEP 5: Integrations ───────────────────────────────────"

# Look up an integration id by the Lambda name embedded in its URI.
get_integration_id() {
  aws apigatewayv2 get-integrations --api-id "$API_ID" --region "$REGION" \
    --query "Items[?contains(IntegrationUri, '${LAMBDA_PREFIX}-$1')].IntegrationId | [0]" \
    --output text
}

create_integration() {
  local name="$1"
  local fn_arn="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${LAMBDA_PREFIX}-${name}"

  local existing
  existing=$(get_integration_id "$name")
  if [ "$existing" != "None" ] && [ -n "$existing" ]; then
    warn "Integration for $name exists: $existing"
  else
    local iid
    iid=$(aws apigatewayv2 create-integration \
      --api-id "$API_ID" \
      --integration-type AWS_PROXY \
      --integration-uri "$fn_arn" \
      --payload-format-version "2.0" \
      --region "$REGION" \
      --query 'IntegrationId' --output text)
    log "Integration $name → $iid"
  fi

  # Grant API Gateway permission to invoke this Lambda (idempotent).
  aws lambda add-permission \
    --function-name "${LAMBDA_PREFIX}-${name}" \
    --statement-id "apigw-invoke-${name}" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
    --region "$REGION" >/dev/null 2>&1 || true
}

for h in "${HANDLERS[@]}"; do
  create_integration "$h"
done

# ─── 6. ROUTES ───────────────────────────────────────────────────────────────
echo ""
echo "── STEP 6: Routes ─────────────────────────────────────────"

# Format: "ROUTE_KEY|handler|auth(0=public,1=jwt)"
ROUTES=(
  "GET /menu/categories|menu|0"
  "GET /menu/items|menu|0"
  "GET /menu/items/{id}|menu|0"
  "POST /admin/menu/items|menu|1"
  "PUT /admin/menu/items/{id}|menu|1"
  "DELETE /admin/menu/items/{id}|menu|1"
  "POST /orders|orders|0"
  "GET /orders/my|orders|1"
  "GET /orders/{id}|orders|0"
  "GET /admin/orders|orders|1"
  "PATCH /admin/orders/{id}/status|orders|1"
  "POST /reservations|reservations|0"
  "GET /reservations/{id}|reservations|0"
  "GET /admin/reservations|reservations|1"
  "PATCH /admin/reservations/{id}/status|reservations|1"
  "GET /reviews|reviews|0"
  "POST /reviews|reviews|0"
  "GET /admin/reviews|reviews|1"
  "PATCH /admin/reviews/{id}/approve|reviews|1"
  "POST /coupons/validate|coupons|0"
  "GET /admin/coupons|coupons|1"
  "POST /admin/coupons|coupons|1"
  "PATCH /admin/coupons/{id}|coupons|1"
  "GET /offers|offers|0"
  "GET /admin/offers|offers|1"
  "POST /admin/offers|offers|1"
  "PUT /admin/offers/{id}|offers|1"
  "DELETE /admin/offers/{id}|offers|1"
  "GET /blog|blog|0"
  "GET /blog/{slug}|blog|0"
  "POST /admin/blog|blog|1"
  "PUT /admin/blog/{id}|blog|1"
  "DELETE /admin/blog/{id}|blog|1"
  "PATCH /admin/blog/{id}/publish|blog|1"
  "GET /settings|settings|0"
  "PUT /admin/settings|settings|1"
  "GET /admin/analytics/summary|analytics|1"
  "POST /payments/intent|payments|0"
  "POST /payments/{id}/confirm|payments|0"
  "POST /admin/payments/{id}/refund|payments|1"
  "POST /webhooks/stripe|webhook|0"
)

# Existing route keys (to avoid duplicates).
EXISTING_ROUTES=$(aws apigatewayv2 get-routes --api-id "$API_ID" --region "$REGION" \
  --query 'Items[].RouteKey' --output text 2>/dev/null || echo "")

for entry in "${ROUTES[@]}"; do
  IFS='|' read -r route_key handler auth <<< "$entry"
  iid="$(get_integration_id "$handler")"
  target="integrations/${iid}"

  if echo "$EXISTING_ROUTES" | grep -qF "$route_key"; then
    : # already exists; skip create
  else
    if [ "$auth" = "1" ]; then
      aws apigatewayv2 create-route \
        --api-id "$API_ID" \
        --route-key "$route_key" \
        --target "$target" \
        --authorization-type JWT \
        --authorizer-id "$AUTHZ_ID" \
        --region "$REGION" >/dev/null
    else
      aws apigatewayv2 create-route \
        --api-id "$API_ID" \
        --route-key "$route_key" \
        --target "$target" \
        --region "$REGION" >/dev/null
    fi
    log "Route: $route_key  ${auth/1/[JWT]}"
  fi
done

# ─── 7. STAGE ($default, auto-deploy) ────────────────────────────────────────
echo ""
echo "── STEP 7: Stage ──────────────────────────────────────────"

if aws apigatewayv2 get-stage --api-id "$API_ID" --stage-name '$default' --region "$REGION" >/dev/null 2>&1; then
  warn 'Stage $default already exists'
else
  aws apigatewayv2 create-stage \
    --api-id "$API_ID" \
    --stage-name '$default' \
    --auto-deploy \
    --region "$REGION" >/dev/null
  log 'Created $default stage (auto-deploy)'
fi

# ─── DONE ────────────────────────────────────────────────────────────────────
echo ""
echo "======================================================"
echo " Backend Deployed!"
echo "======================================================"
echo ""
echo "  API endpoint:"
echo "    $API_ENDPOINT"
echo ""
echo "  Set this in your .env:"
echo "    VITE_API_BASE_URL=$API_ENDPOINT"
echo ""
echo "  Quick test (public menu):"
echo "    curl $API_ENDPOINT/menu/items"
echo ""
echo "  Next: bash scripts/week2-seed.sh   (seed menu + settings)"
echo "======================================================"
