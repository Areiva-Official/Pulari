#!/usr/bin/env bash
# =============================================================================
# Pulari Restaurant — Week 5: SES Email Setup
# Run from repo root: bash scripts/week5-ses-setup.sh
#
# What it does:
#   1. Verifies the SES email identity for the FROM address
#   2. Verifies the domain (pularirestaurant.ie) for DKIM signing
#   3. Creates a SES configuration set for tracking bounces & complaints
#   4. Prints the DNS records you need to add for domain verification
#
# Prerequisites:
#   • AWS CLI configured with credentials that have SES permissions
#   • SES must be in the same region as Lambda (eu-west-1)
#   • Your AWS account must be out of the SES sandbox for production use
#     (request production access via: https://console.aws.amazon.com/ses/home#account)
#
# After running this script:
#   1. Add the DKIM DNS records to your domain registrar (usually Cloudflare)
#   2. Wait for domain verification (up to 72 hours, usually <5 min for DKIM)
#   3. Re-run the Lambda deploy to push SES_FROM_ADDRESS to Lambda env vars:
#        SES_FROM_ADDRESS=orders@pularirestaurant.ie bash scripts/week2-lambda-deploy.sh
# =============================================================================
set -euo pipefail

REGION="eu-west-1"
DOMAIN="pularirestaurant.ie"
FROM_ADDRESS="orders@pularirestaurant.ie"
CONFIG_SET="pulari-transactional"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
info() { echo -e "${BLUE}[i]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }

echo ""
echo "======================================================"
echo " Pulari — Week 5: SES Email Setup"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================"
echo ""

command -v aws >/dev/null || die "aws CLI not found"
aws sts get-caller-identity --region "$REGION" >/dev/null \
  || die "AWS credentials invalid — run: aws configure"

# ─── 1. DOMAIN IDENTITY (DKIM + MAIL FROM) ───────────────────────────────────
echo "── STEP 1: Domain identity ($DOMAIN) ──────────────────────"

DOMAIN_STATUS=$(aws sesv2 get-email-identity \
  --email-identity "$DOMAIN" \
  --region "$REGION" \
  --query 'VerificationStatus' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$DOMAIN_STATUS" = "NOT_FOUND" ]; then
  aws sesv2 create-email-identity \
    --email-identity "$DOMAIN" \
    --dkim-signing-attributes 'SigningAttributesOrigin=AWS_SES' \
    --region "$REGION" >/dev/null
  log "Created domain identity: $DOMAIN"
  DOMAIN_STATUS="PENDING"
else
  warn "Domain identity already exists (status: $DOMAIN_STATUS)"
fi

# ─── 2. EMAIL ADDRESS IDENTITY (fallback) ─────────────────────────────────────
echo ""
echo "── STEP 2: Email address identity ($FROM_ADDRESS) ─────────"

EMAIL_STATUS=$(aws sesv2 get-email-identity \
  --email-identity "$FROM_ADDRESS" \
  --region "$REGION" \
  --query 'VerificationStatus' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$EMAIL_STATUS" = "NOT_FOUND" ]; then
  aws sesv2 create-email-identity \
    --email-identity "$FROM_ADDRESS" \
    --region "$REGION" >/dev/null
  log "Verification email sent to: $FROM_ADDRESS — click the link to confirm it."
else
  warn "Email identity already exists (status: $EMAIL_STATUS)"
fi

# ─── 3. CONFIGURATION SET ─────────────────────────────────────────────────────
echo ""
echo "── STEP 3: SES configuration set ──────────────────────────"

CS_EXISTS=$(aws sesv2 get-configuration-set \
  --configuration-set-name "$CONFIG_SET" \
  --region "$REGION" \
  --query 'ConfigurationSetName' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$CS_EXISTS" = "NOT_FOUND" ]; then
  aws sesv2 create-configuration-set \
    --configuration-set-name "$CONFIG_SET" \
    --sending-options 'SendingEnabled=true' \
    --suppression-options 'SuppressedReasons=BOUNCE,COMPLAINT' \
    --region "$REGION" >/dev/null
  log "Created configuration set: $CONFIG_SET"
else
  warn "Configuration set already exists: $CONFIG_SET"
fi

# ─── 4. DKIM DNS RECORDS ──────────────────────────────────────────────────────
echo ""
echo "── STEP 4: DNS records to add ─────────────────────────────"

DKIM_TOKENS=$(aws sesv2 get-email-identity \
  --email-identity "$DOMAIN" \
  --region "$REGION" \
  --query 'DkimAttributes.Tokens' \
  --output text 2>/dev/null || echo "")

if [ -n "$DKIM_TOKENS" ]; then
  echo ""
  info "Add the following CNAME records to your DNS (Cloudflare / registrar):"
  echo ""
  for token in $DKIM_TOKENS; do
    printf "  CNAME  %-45s  %s\n" \
      "${token}._domainkey.${DOMAIN}" \
      "${token}.dkim.amazonses.com"
  done
  echo ""
  info "Also add a MAIL FROM / SPF TXT record:"
  echo "  TXT    $DOMAIN    \"v=spf1 include:amazonses.com ~all\""
else
  warn "Could not retrieve DKIM tokens — check identity status in the console."
fi

# ─── 5. SANDBOX CHECK ─────────────────────────────────────────────────────────
echo ""
echo "── STEP 5: SES account status ─────────────────────────────"

SENDING_ENABLED=$(aws sesv2 get-account \
  --region "$REGION" \
  --query 'SendingEnabled' \
  --output text 2>/dev/null || echo "false")

PRODUCTION_ACCESS=$(aws sesv2 get-account \
  --region "$REGION" \
  --query 'ProductionAccessEnabled' \
  --output text 2>/dev/null || echo "false")

if [ "$PRODUCTION_ACCESS" = "True" ]; then
  log "Account is in SES production mode — can send to any address."
else
  warn "Account is in the SES SANDBOX — can only send to verified addresses."
  warn "Request production access at:"
  warn "  https://eu-west-1.console.aws.amazon.com/ses/home?region=eu-west-1#account"
fi

# ─── DONE ────────────────────────────────────────────────────────────────────
echo ""
echo "======================================================"
echo " SES Setup Complete!"
echo "======================================================"
echo ""
echo "  Domain:        $DOMAIN  (status: $DOMAIN_STATUS)"
echo "  From address:  $FROM_ADDRESS"
echo "  Config set:    $CONFIG_SET"
echo ""
echo "  Next steps:"
echo "  1. Add the DKIM CNAME records above to Cloudflare"
echo "  2. Verify the FROM address email (check your inbox)"
echo "  3. Request SES production access if still in sandbox"
echo "  4. Deploy Lambda with SES_FROM_ADDRESS:"
echo "       SES_FROM_ADDRESS=$FROM_ADDRESS bash scripts/week2-lambda-deploy.sh"
echo ""
