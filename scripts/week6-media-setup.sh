#!/usr/bin/env bash
# =============================================================================
# Pulari Restaurant — Media / Image Upload Infrastructure
# Run once (idempotent): bash scripts/week6-media-setup.sh
#
# Creates:
#   • S3 bucket  pulari-media  (eu-west-1)  — stores admin-uploaded images
#   • Public-read bucket policy (GET for anyone, PUT via pre-signed URL only)
#   • CORS config so browsers can PUT directly from pulari.ie / localhost
#   • IAM inline policy patch: Lambda role gains s3:PutObject on pulari-media
#   • Adds MEDIA_BUCKET + MEDIA_CDN_BASE env vars to all Lambda functions
#   • Registers the uploads Lambda + API route (if not already present)
# =============================================================================
set -euo pipefail

REGION="eu-west-1"
ACCOUNT_ID="550357520654"
BUCKET="pulari-media"
LAMBDA_ROLE="pulari-lambda-exec"
LAMBDA_PREFIX="pulari"
API_NAME="pulari-api"
CDN_BASE="https://${BUCKET}.s3.${REGION}.amazonaws.com"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }

echo ""
echo "======================================================"
echo " Pulari — Media Upload Infrastructure"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================"
echo ""

command -v aws >/dev/null || die "aws CLI not found"
aws sts get-caller-identity --region "$REGION" >/dev/null || die "AWS credentials invalid"

# ─── 1. CREATE S3 BUCKET ─────────────────────────────────────────────────────
echo "── STEP 1: S3 bucket $BUCKET ────────────────────────────"

if aws s3api head-bucket --bucket "$BUCKET" --region "$REGION" 2>/dev/null; then
  warn "Bucket $BUCKET already exists"
else
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" >/dev/null
  log "Created bucket $BUCKET"
fi

# ─── 2. DISABLE BLOCK PUBLIC ACCESS (needed for public-read policy) ──────────
echo ""
echo "── STEP 2: Public access settings ──────────────────────"

aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
  --region "$REGION" >/dev/null
log "Block public access disabled"

# ─── 3. BUCKET POLICY — public read for all objects ──────────────────────────
echo ""
echo "── STEP 3: Bucket policy ────────────────────────────────"

BUCKET_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET}/*"
    }
  ]
}
EOF
)

aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy "$BUCKET_POLICY" \
  --region "$REGION" >/dev/null
log "Bucket policy set (public-read)"

# ─── 4. CORS — allow browser PUT from pulari.ie + localhost ──────────────────
echo ""
echo "── STEP 4: CORS configuration ───────────────────────────"

CORS_CONFIG=$(cat <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://www.pulari.ie",
        "https://pulari.ie",
        "http://localhost:5173",
        "http://localhost:4173"
      ],
      "AllowedMethods": ["GET", "PUT", "HEAD", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF
)

aws s3api put-bucket-cors \
  --bucket "$BUCKET" \
  --cors-configuration "$CORS_CONFIG" \
  --region "$REGION" >/dev/null
log "CORS configured"

# ─── 5. IAM — patch Lambda role to allow s3:PutObject on media bucket ────────
echo ""
echo "── STEP 5: IAM role patch ───────────────────────────────"

S3_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::${BUCKET}/*"
    }
  ]
}
EOF
)

aws iam put-role-policy \
  --role-name "$LAMBDA_ROLE" \
  --policy-name "pulari-s3-media-access" \
  --policy-document "$S3_POLICY" >/dev/null
log "IAM policy pulari-s3-media-access attached to $LAMBDA_ROLE"

# ─── 6. DEPLOY uploads Lambda ────────────────────────────────────────────────
echo ""
echo "── STEP 6: Deploy pulari-uploads Lambda ─────────────────"

LAMBDA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lambda"
DIST_DIR="$LAMBDA_DIR/dist"

[ -d "$DIST_DIR/uploads" ] || die "dist/uploads not found — run: cd lambda && npm run build"

ROLE_ARN=$(aws iam get-role --role-name "$LAMBDA_ROLE" --query 'Role.Arn' --output text)
FN="${LAMBDA_PREFIX}-uploads"
ZIP="$DIST_DIR/uploads.zip"
(cd "$DIST_DIR/uploads" && zip -q -j "$ZIP" index.mjs)

LAMBDA_ENV_JSON=$(node -e "
const e = JSON.parse(process.argv[1]);
e.Variables.MEDIA_BUCKET = '${BUCKET}';
e.Variables.MEDIA_CDN_BASE = '${CDN_BASE}';
console.log(JSON.stringify(e));
" "$(aws lambda get-function-configuration --function-name "${LAMBDA_PREFIX}-menu" --region "$REGION" --query 'Environment' --output json 2>/dev/null || echo '{"Variables":{}}')" 2>/dev/null || echo '{"Variables":{"MEDIA_BUCKET":"'$BUCKET'","MEDIA_CDN_BASE":"'$CDN_BASE'"}}')

if aws lambda get-function --function-name "$FN" --region "$REGION" >/dev/null 2>&1; then
  aws lambda update-function-code \
    --function-name "$FN" --zip-file "fileb://$ZIP" \
    --region "$REGION" >/dev/null
  aws lambda wait function-updated --function-name "$FN" --region "$REGION"
  aws lambda update-function-configuration \
    --function-name "$FN" \
    --runtime nodejs22.x --handler index.handler \
    --role "$ROLE_ARN" --timeout 15 --memory-size 256 \
    --environment "{\"Variables\":{\"MEDIA_BUCKET\":\"${BUCKET}\",\"MEDIA_CDN_BASE\":\"${CDN_BASE}\",\"COGNITO_USER_POOL_ID\":\"eu-west-1_OaOEegHaY\",\"COGNITO_CLIENT_ID\":\"6vsfbafb4irkeqh104el0u9gga\",\"ADMIN_GROUP\":\"admins\"}}" \
    --region "$REGION" >/dev/null
  warn "Updated $FN"
else
  aws lambda create-function \
    --function-name "$FN" \
    --runtime nodejs22.x --handler index.handler \
    --role "$ROLE_ARN" --timeout 15 --memory-size 256 \
    --architectures arm64 \
    --environment "{\"Variables\":{\"MEDIA_BUCKET\":\"${BUCKET}\",\"MEDIA_CDN_BASE\":\"${CDN_BASE}\",\"COGNITO_USER_POOL_ID\":\"eu-west-1_OaOEegHaY\",\"COGNITO_CLIENT_ID\":\"6vsfbafb4irkeqh104el0u9gga\",\"ADMIN_GROUP\":\"admins\"}}" \
    --zip-file "fileb://$ZIP" \
    --region "$REGION" \
    --tags Project=Pulari,Environment=Production >/dev/null
  aws lambda wait function-active --function-name "$FN" --region "$REGION"
  log "Created $FN"
fi

# ─── 7. API GATEWAY — add route POST /admin/uploads/presign ──────────────────
echo ""
echo "── STEP 7: API Gateway route ────────────────────────────"

API_ID=$(aws apigatewayv2 get-apis --region "$REGION" \
  --query "Items[?Name=='${API_NAME}'].ApiId | [0]" --output text)
[ -z "$API_ID" ] || [ "$API_ID" = "None" ] && die "API '$API_NAME' not found — run week2-lambda-deploy.sh first"

# Add Lambda invoke permission
aws lambda add-permission \
  --function-name "$FN" \
  --statement-id "apigw-invoke-uploads" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
  --region "$REGION" >/dev/null 2>&1 || true

# Create integration
FN_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FN}"
EXISTING_INT=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --region "$REGION" \
  --query "Items[?contains(IntegrationUri, '${FN}')].IntegrationId | [0]" --output text)

if [ -z "$EXISTING_INT" ] || [ "$EXISTING_INT" = "None" ]; then
  IID=$(aws apigatewayv2 create-integration \
    --api-id "$API_ID" \
    --integration-type AWS_PROXY \
    --integration-uri "$FN_ARN" \
    --payload-format-version "2.0" \
    --region "$REGION" \
    --query 'IntegrationId' --output text)
  log "Integration created: $IID"
else
  IID="$EXISTING_INT"
  warn "Integration already exists: $IID"
fi

# Get JWT authorizer id
AUTHZ_ID=$(aws apigatewayv2 get-authorizers --api-id "$API_ID" --region "$REGION" \
  --query "Items[?Name=='pulari-cognito'].AuthorizerId | [0]" --output text)

# Create route (idempotent)
EXISTING_ROUTE=$(aws apigatewayv2 get-routes --api-id "$API_ID" --region "$REGION" \
  --query "Items[?RouteKey=='POST /admin/uploads/presign'].RouteId | [0]" --output text)

if [ -z "$EXISTING_ROUTE" ] || [ "$EXISTING_ROUTE" = "None" ]; then
  aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "POST /admin/uploads/presign" \
    --target "integrations/${IID}" \
    --authorization-type JWT \
    --authorizer-id "$AUTHZ_ID" \
    --region "$REGION" >/dev/null
  log "Route POST /admin/uploads/presign created [JWT]"
else
  warn "Route POST /admin/uploads/presign already exists"
fi

# ─── DONE ────────────────────────────────────────────────────────────────────
echo ""
echo "======================================================"
echo " Media Infrastructure Ready!"
echo "======================================================"
echo "  Bucket:   s3://${BUCKET}"
echo "  CDN base: ${CDN_BASE}"
echo "  Endpoint: POST /admin/uploads/presign"
echo "======================================================"
echo ""
