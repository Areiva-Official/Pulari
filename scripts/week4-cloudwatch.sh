#!/usr/bin/env bash
# =============================================================================
# Pulari Restaurant — Week 4: CloudWatch Alarms + Audit Log Table
# Run from repo root: bash scripts/week4-cloudwatch.sh
#
# Creates:
#   • SNS topic  pulari-alerts  (subscribe your email once after running)
#   • Lambda error alarms       (all 10 handlers — 1+ errors in 5 min)
#   • Lambda throttle alarms    (any throttles in 5 min)
#   • Lambda P99 duration alarm (payments handler >10 s)
#   • API Gateway 5xx alarm     (5+ errors in 5 min)
#   • DynamoDB throttle alarms  (all 6 tables)
#   • pulari-audit DynamoDB table (write-once audit log)
#
# Idempotent: safe to re-run. Alarm names are stable so re-running updates
# thresholds/actions without creating duplicates.
# =============================================================================
set -euo pipefail

REGION="eu-west-1"
ACCOUNT_ID="550357520654"
API_ID="b17vxcc00b"          # HTTP API from week2 deploy
ALERT_EMAIL="${PULARI_ALERT_EMAIL:-}"  # set env var or edit here
LAMBDA_PREFIX="pulari"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }

echo ""
echo "======================================================"
echo " Pulari — Week 4: CloudWatch Alarms + Audit Table"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================"
echo ""

# ─── 1. SNS TOPIC ─────────────────────────────────────────────────────────────
echo "── STEP 1: SNS alert topic ─────────────────────────────────"

TOPIC_ARN=$(aws sns list-topics --region "$REGION" \
  --query "Topics[?ends_with(TopicArn, ':pulari-alerts')].TopicArn | [0]" \
  --output text 2>/dev/null || echo "None")

if [ "$TOPIC_ARN" = "None" ] || [ -z "$TOPIC_ARN" ]; then
  TOPIC_ARN=$(aws sns create-topic \
    --name pulari-alerts \
    --region "$REGION" \
    --query 'TopicArn' --output text)
  log "Created SNS topic: $TOPIC_ARN"
else
  warn "SNS topic already exists: $TOPIC_ARN"
fi

# Subscribe email if provided
if [ -n "$ALERT_EMAIL" ]; then
  aws sns subscribe \
    --topic-arn "$TOPIC_ARN" \
    --protocol email \
    --notification-endpoint "$ALERT_EMAIL" \
    --region "$REGION" >/dev/null 2>&1 || true
  warn "Email subscription pending confirmation for: $ALERT_EMAIL"
else
  warn "No PULARI_ALERT_EMAIL set — subscribe manually:"
  warn "  aws sns subscribe --topic-arn $TOPIC_ARN --protocol email --notification-endpoint you@example.com --region $REGION"
fi

# Helper: create or update a CloudWatch alarm
put_alarm() {
  local name="$1"
  shift
  aws cloudwatch put-metric-alarm \
    --alarm-name "$name" \
    --alarm-actions "$TOPIC_ARN" \
    --ok-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --region "$REGION" \
    "$@" >/dev/null
  log "Alarm: $name"
}

# ─── 2. LAMBDA ERROR ALARMS ──────────────────────────────────────────────────
echo ""
echo "── STEP 2: Lambda error alarms (all 10 handlers) ──────────"

HANDLERS=(menu orders reservations reviews coupons offers settings analytics payments webhook)

for h in "${HANDLERS[@]}"; do
  fn="${LAMBDA_PREFIX}-${h}"
  put_alarm "pulari-lambda-${h}-errors" \
    --namespace AWS/Lambda \
    --metric-name Errors \
    --dimensions "Name=FunctionName,Value=${fn}" \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --alarm-description "Lambda errors in ${fn} (5 min window)"

  put_alarm "pulari-lambda-${h}-throttles" \
    --namespace AWS/Lambda \
    --metric-name Throttles \
    --dimensions "Name=FunctionName,Value=${fn}" \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --alarm-description "Lambda throttles in ${fn} (5 min window)"
done

# ─── 3. LAMBDA DURATION ALARMS (critical paths only) ─────────────────────────
echo ""
echo "── STEP 3: Lambda duration alarms ─────────────────────────"

# Payments / webhook must respond fast — alert at P99 > 10 s
for h in payments webhook orders; do
  fn="${LAMBDA_PREFIX}-${h}"
  put_alarm "pulari-lambda-${h}-duration-p99" \
    --namespace AWS/Lambda \
    --metric-name Duration \
    --dimensions "Name=FunctionName,Value=${fn}" \
    --extended-statistic p99 \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 10000 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --alarm-description "P99 duration >= 10 s for ${fn}"
done

# ─── 4. API GATEWAY 5XX ALARM ────────────────────────────────────────────────
echo ""
echo "── STEP 4: API Gateway 5xx alarm ──────────────────────────"

put_alarm "pulari-apigw-5xx" \
  --namespace AWS/ApiGateway \
  --metric-name 5XXError \
  --dimensions "Name=ApiId,Value=${API_ID}" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-description "API Gateway HTTP API 5xx errors >= 5 in 5 min"

put_alarm "pulari-apigw-4xx-spike" \
  --namespace AWS/ApiGateway \
  --metric-name 4XXError \
  --dimensions "Name=ApiId,Value=${API_ID}" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-description "API Gateway 4xx spike >= 50 in 5 min (potential scan/abuse)"

# ─── 5. DYNAMODB THROTTLE ALARMS ─────────────────────────────────────────────
echo ""
echo "── STEP 5: DynamoDB throttle alarms (all 6 tables) ────────"

TABLES=(pulari-menu pulari-orders pulari-reservations pulari-reviews pulari-coupons pulari-settings pulari-audit)

for table in "${TABLES[@]}"; do
  put_alarm "pulari-ddb-${table}-read-throttles" \
    --namespace AWS/DynamoDB \
    --metric-name ReadThrottleEvents \
    --dimensions "Name=TableName,Value=${table}" \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --alarm-description "DynamoDB read throttles on ${table}"

  put_alarm "pulari-ddb-${table}-write-throttles" \
    --namespace AWS/DynamoDB \
    --metric-name WriteThrottleEvents \
    --dimensions "Name=TableName,Value=${table}" \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --alarm-description "DynamoDB write throttles on ${table}"
done

# ─── 6. AUDIT LOG DYNAMODB TABLE ─────────────────────────────────────────────
echo ""
echo "── STEP 6: pulari-audit DynamoDB table ─────────────────────"

AUDIT_TABLE="pulari-audit"

if aws dynamodb describe-table --table-name "$AUDIT_TABLE" --region "$REGION" >/dev/null 2>&1; then
  warn "Table $AUDIT_TABLE already exists"
else
  aws dynamodb create-table \
    --table-name "$AUDIT_TABLE" \
    --attribute-definitions \
      AttributeName=id,AttributeType=S \
      AttributeName=createdAt,AttributeType=S \
    --key-schema \
      AttributeName=id,KeyType=HASH \
      AttributeName=createdAt,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION" \
    --tags Key=Project,Value=Pulari Key=Environment,Value=Production >/dev/null
  aws dynamodb wait table-exists --table-name "$AUDIT_TABLE" --region "$REGION"
  log "Created table: $AUDIT_TABLE"
fi

# Add pulari-audit to the Lambda IAM policy (extends the existing scoped policy)
ROLE_NAME="pulari-lambda-exec"
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
log "IAM role policy refreshed (covers pulari-audit)"

# ─── DONE ────────────────────────────────────────────────────────────────────
echo ""
echo "======================================================"
echo " Week 4 Observability — Done!"
echo "======================================================"
echo ""
echo "  SNS topic:   $TOPIC_ARN"
echo "  Alarms created/updated:"
echo "    • Lambda errors + throttles  ×10 handlers  (20 alarms)"
echo "    • Lambda P99 duration        ×3 handlers   ( 3 alarms)"
echo "    • API Gateway 5xx + 4xx spike              ( 2 alarms)"
echo "    • DynamoDB read + write throttles ×7 tables (14 alarms)"
echo ""
echo "  Next steps:"
if [ -z "$ALERT_EMAIL" ]; then
echo "    1. Subscribe your email:"
echo "       export PULARI_ALERT_EMAIL=you@example.com"
echo "       bash scripts/week4-cloudwatch.sh"
fi
echo "    2. View alarms in the Console:"
echo "       https://eu-west-1.console.aws.amazon.com/cloudwatch/home?region=eu-west-1#alarmsV2:"
echo ""
