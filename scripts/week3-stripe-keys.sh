#!/usr/bin/env bash
# =============================================================================
# Pulari Restaurant — Week 3 Stripe Go-Live
# Injects Stripe keys into the live backend WITHOUT a full redeploy.
#
#   • STRIPE_SECRET_KEY      → pulari-payments + pulari-webhook Lambda env
#   • STRIPE_WEBHOOK_SECRET  → pulari-webhook (+ payments) Lambda env
#   • STRIPE_PUBLISHABLE_KEY → restaurant settings in DynamoDB (frontend reads it)
#
# Existing Lambda env vars are MERGED, never wiped.
#
# Usage:
#   export STRIPE_SECRET_KEY=sk_live_xxx
#   export STRIPE_WEBHOOK_SECRET=whsec_xxx
#   export STRIPE_PUBLISHABLE_KEY=pk_live_xxx
#   bash scripts/week3-stripe-keys.sh
# =============================================================================
set -euo pipefail

REGION="eu-west-1"
API="https://b17vxcc00b.execute-api.eu-west-1.amazonaws.com"
LAMBDA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lambda"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }

: "${STRIPE_SECRET_KEY:?Set it first:  export STRIPE_SECRET_KEY=sk_live_...}"
: "${STRIPE_WEBHOOK_SECRET:?Set it first:  export STRIPE_WEBHOOK_SECRET=whsec_...}"
PUBLISHABLE="${STRIPE_PUBLISHABLE_KEY:-}"

echo ""
echo "======================================================"
echo " Pulari — Stripe Go-Live"
echo "======================================================"
echo ""

# ── 1. Merge secret + webhook secret into the two payment Lambdas ─────────────
merge_lambda_env() {
  local fn="$1"
  local current merged
  current=$(aws lambda get-function-configuration \
    --function-name "$fn" --region "$REGION" \
    --query 'Environment.Variables' --output json)

  merged=$(STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
           STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
           python3 -c "import json,os,sys
v=json.load(sys.stdin) or {}
v['STRIPE_SECRET_KEY']=os.environ['STRIPE_SECRET_KEY']
v['STRIPE_WEBHOOK_SECRET']=os.environ['STRIPE_WEBHOOK_SECRET']
print(json.dumps({'Variables':v}))" <<< "$current")

  aws lambda update-function-configuration \
    --function-name "$fn" --region "$REGION" \
    --environment "$merged" >/dev/null
  aws lambda wait function-updated --function-name "$fn" --region "$REGION"
  log "Stripe keys set on $fn (other env vars preserved)"
}

merge_lambda_env pulari-payments
merge_lambda_env pulari-webhook

# ── 2. Write publishable key into restaurant settings (DynamoDB) ─────────────
if [ -n "$PUBLISHABLE" ]; then
  cd "$LAMBDA_DIR"
  AWS_REGION="$REGION" PUB="$PUBLISHABLE" node --input-type=module -e "
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
const r = await ddb.send(new GetCommand({ TableName: 'pulari-settings', Key: { key: 'restaurant' } }));
const value = r.Item?.value ?? {};
value.stripePublishableKey = process.env.PUB;
await ddb.send(new PutCommand({ TableName: 'pulari-settings', Item: { key: 'restaurant', value, updatedAt: new Date().toISOString() } }));
console.log('  settings.stripePublishableKey updated');
"
  log "Publishable key stored in settings (frontend reads it at runtime)"
else
  warn "STRIPE_PUBLISHABLE_KEY not provided — set it in admin Settings instead"
fi

# ── 3. Verify payments now initialise ────────────────────────────────────────
echo ""
echo "── Verifying ──────────────────────────────────────────────"
OID=$(curl -s -X POST "$API/orders" -H "Content-Type: application/json" \
  -d '{"customerName":"Go Live","customerEmail":"golive@pulari.ie","customerPhone":"0871234567","type":"collection","items":[{"menuItemId":"8","quantity":1}]}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/payments/intent" \
  -H "Content-Type: application/json" -d "{\"orderId\":\"$OID\"}")
if [ "$CODE" = "200" ]; then
  log "payments/intent now returns 200 — Stripe is live"
else
  warn "payments/intent returned $CODE — double-check STRIPE_SECRET_KEY"
fi
# clean the verification order
AWS_REGION="$REGION" node --input-type=module -e "
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
await ddb.send(new DeleteCommand({ TableName: 'pulari-orders', Key: { id: '$OID' } }));
" 2>/dev/null || true

echo ""
echo "======================================================"
echo " Stripe go-live complete"
echo "======================================================"
echo ""
echo "  FINAL STEP — register the webhook in the Stripe Dashboard:"
echo "    Developers → Webhooks → Add endpoint"
echo "    URL:    $API/webhooks/stripe"
echo "    Events: payment_intent.succeeded"
echo "            payment_intent.payment_failed"
echo "            charge.refunded"
echo ""
echo "  The signing secret Stripe shows (whsec_...) must match the"
echo "  STRIPE_WEBHOOK_SECRET you just set. If it differs, re-run this script."
echo "======================================================"
