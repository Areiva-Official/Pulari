#!/usr/bin/env bash
# =============================================================================
# Pulari Restaurant — Week 1 AWS Security Hardening
# Run from repo root: bash scripts/week1-aws-hardening.sh
# AWS account: 550357520654  |  region: eu-west-1
# =============================================================================
set -euo pipefail

REGION="eu-west-1"
USER_POOL_ID="eu-west-1_OaOEegHaY"
CF_DIST_ID="E26CSNGKOODB0A"
S3_BUCKET="pulari-restaurant"
ACCOUNT_ID="550357520654"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }

echo ""
echo "======================================================"
echo " Pulari — Week 1 AWS Hardening"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================"
echo ""

# ------------------------------------------------------------------------------
# STEP 1: COGNITO — Password policy + TOTP MFA + email verification
# ------------------------------------------------------------------------------
echo "── STEP 1: Cognito hardening ──────────────────────────────"

aws cognito-idp update-user-pool \
  --user-pool-id "$USER_POOL_ID" \
  --region "$REGION" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 12,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true,
      "TemporaryPasswordValidityDays": 1
    }
  }' \
  --mfa-configuration "OPTIONAL" \
  --auto-verified-attributes "email"

log "Cognito: password policy (min 12, complexity), TOTP MFA optional, email verification enforced"

# Enforce admins group to REQUIRED MFA — requires CLI workaround via admin-set-user-mfa-preference
# (Group-level MFA enforcement is done via pre-token Lambda — added to Week 2 Lambda build)
warn "Note: group-level MFA enforcement for 'admins' will be wired in Week 2 pre-token Lambda"

# ------------------------------------------------------------------------------
# STEP 2: GUARDDUTY — Enable detector
# ------------------------------------------------------------------------------
echo ""
echo "── STEP 2: GuardDuty ──────────────────────────────────────"

EXISTING_DETECTOR=$(aws guardduty list-detectors --region "$REGION" --query 'DetectorIds[0]' --output text 2>/dev/null || echo "None")

if [ "$EXISTING_DETECTOR" != "None" ] && [ -n "$EXISTING_DETECTOR" ]; then
  warn "GuardDuty detector already exists: $EXISTING_DETECTOR — ensuring it's enabled"
  aws guardduty update-detector \
    --detector-id "$EXISTING_DETECTOR" \
    --enable \
    --finding-publishing-frequency FIFTEEN_MINUTES \
    --region "$REGION"
  DETECTOR_ID="$EXISTING_DETECTOR"
else
  DETECTOR_ID=$(aws guardduty create-detector \
    --enable \
    --finding-publishing-frequency FIFTEEN_MINUTES \
    --region "$REGION" \
    --query 'DetectorId' \
    --output text)
fi

log "GuardDuty detector: $DETECTOR_ID"

# ------------------------------------------------------------------------------
# STEP 3: CLOUDTRAIL — Create dedicated S3 bucket + trail
# ------------------------------------------------------------------------------
echo ""
echo "── STEP 3: CloudTrail ─────────────────────────────────────"

CT_BUCKET="pulari-cloudtrail-logs-${ACCOUNT_ID}"

# Create dedicated CloudTrail bucket (separate from website bucket)
BUCKET_EXISTS=$(aws s3api head-bucket --bucket "$CT_BUCKET" --region "$REGION" 2>&1 || true)
if echo "$BUCKET_EXISTS" | grep -q "404\|NoSuchBucket\|Not Found"; then
  aws s3api create-bucket \
    --bucket "$CT_BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
  log "CloudTrail S3 bucket created: $CT_BUCKET"
else
  warn "CloudTrail S3 bucket already exists: $CT_BUCKET"
fi

# Block public access on trail bucket
aws s3api put-public-access-block \
  --bucket "$CT_BUCKET" \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --region "$REGION"

# Apply required bucket policy for CloudTrail
CT_BUCKET_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AWSCloudTrailAclCheck",
      "Effect": "Allow",
      "Principal": {"Service": "cloudtrail.amazonaws.com"},
      "Action": "s3:GetBucketAcl",
      "Resource": "arn:aws:s3:::${CT_BUCKET}"
    },
    {
      "Sid": "AWSCloudTrailWrite",
      "Effect": "Allow",
      "Principal": {"Service": "cloudtrail.amazonaws.com"},
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::${CT_BUCKET}/AWSLogs/${ACCOUNT_ID}/*",
      "Condition": {
        "StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}
      }
    }
  ]
}
EOF
)
echo "$CT_BUCKET_POLICY" | aws s3api put-bucket-policy \
  --bucket "$CT_BUCKET" \
  --policy file:///dev/stdin \
  --region "$REGION"

# Enable SSE on trail bucket
aws s3api put-bucket-encryption \
  --bucket "$CT_BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
    }]
  }' \
  --region "$REGION"

# Create or update trail
TRAIL_EXISTS=$(aws cloudtrail describe-trails --region "$REGION" \
  --query "trailList[?Name=='pulari-audit-trail'].Name" --output text 2>/dev/null || echo "")

if [ -z "$TRAIL_EXISTS" ]; then
  aws cloudtrail create-trail \
    --name "pulari-audit-trail" \
    --s3-bucket-name "$CT_BUCKET" \
    --include-global-service-events \
    --is-multi-region-trail \
    --enable-log-file-validation \
    --region "$REGION"
  log "CloudTrail trail created: pulari-audit-trail"
else
  warn "Trail pulari-audit-trail already exists — updating"
  aws cloudtrail update-trail \
    --name "pulari-audit-trail" \
    --s3-bucket-name "$CT_BUCKET" \
    --include-global-service-events \
    --is-multi-region-trail \
    --enable-log-file-validation \
    --region "$REGION"
fi

aws cloudtrail start-logging --name "pulari-audit-trail" --region "$REGION"
log "CloudTrail logging started"

# ------------------------------------------------------------------------------
# STEP 4: CLOUDFRONT — Security response headers policy
# ------------------------------------------------------------------------------
echo ""
echo "── STEP 4: CloudFront security headers ────────────────────"

# Check if policy already exists
EXISTING_POLICY_ID=$(aws cloudfront list-response-headers-policies \
  --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='pulari-security-headers'].ResponseHeadersPolicy.Id" \
  --output text 2>/dev/null || echo "")

HEADERS_POLICY_CONFIG=$(cat <<'POLICY_EOF'
{
  "Name": "pulari-security-headers",
  "Comment": "Pulari security headers — CSP HSTS XFO XCTO",
  "SecurityHeadersConfig": {
    "XSSProtection": {
      "Override": true,
      "Protection": true,
      "ModeBlock": true
    },
    "FrameOptions": {
      "Override": true,
      "FrameOption": "DENY"
    },
    "ReferrerPolicy": {
      "Override": true,
      "ReferrerPolicy": "strict-origin-when-cross-origin"
    },
    "ContentTypeOptions": {
      "Override": true
    },
    "StrictTransportSecurity": {
      "Override": true,
      "AccessControlMaxAgeSec": 31536000,
      "IncludeSubdomains": true,
      "Preload": true
    },
    "ContentSecurityPolicy": {
      "Override": true,
      "ContentSecurityPolicy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.amazonaws.com https://*.s3.eu-west-1.amazonaws.com https://api.stripe.com https://cognito-idp.eu-west-1.amazonaws.com; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'"
    }
  },
  "CustomHeadersConfig": {
    "Quantity": 1,
    "Items": [
      {
        "Header": "Permissions-Policy",
        "Value": "camera=(), microphone=(), geolocation=(), payment=(self https://js.stripe.com)",
        "Override": true
      }
    ]
  },
  "RemoveHeadersConfig": {
    "Quantity": 1,
    "Items": [{"Header": "X-Powered-By"}]
  },
  "ServerTimingHeadersConfig": {
    "Enabled": false,
    "SamplingRate": 0
  }
}
POLICY_EOF
)

if [ -z "$EXISTING_POLICY_ID" ] || [ "$EXISTING_POLICY_ID" = "None" ]; then
  POLICY_ID=$(echo "$HEADERS_POLICY_CONFIG" | aws cloudfront create-response-headers-policy \
    --response-headers-policy-config file:///dev/stdin \
    --query 'ResponseHeadersPolicy.Id' \
    --output text)
  log "Response headers policy created: $POLICY_ID"
else
  POLICY_ID="$EXISTING_POLICY_ID"
  warn "Response headers policy already exists: $POLICY_ID — skipping create"
fi

# Attach policy to CloudFront distribution default cache behavior
echo "Fetching CloudFront distribution config..."
CF_CONFIG=$(aws cloudfront get-distribution-config --id "$CF_DIST_ID")
CF_ETAG=$(echo "$CF_CONFIG" | python3 -c "import sys,json; print(json.load(sys.stdin)['ETag'])")
CF_DIST_CONFIG=$(echo "$CF_CONFIG" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['DistributionConfig']))")

# Inject ResponseHeadersPolicyId into DefaultCacheBehavior
CF_UPDATED=$(echo "$CF_DIST_CONFIG" | python3 -c "
import sys, json
cfg = json.load(sys.stdin)
cfg['DefaultCacheBehavior']['ResponseHeadersPolicyId'] = '$POLICY_ID'
for b in cfg.get('CacheBehaviors', {}).get('Items', []):
    b['ResponseHeadersPolicyId'] = '$POLICY_ID'
print(json.dumps(cfg))
")

echo "$CF_UPDATED" | aws cloudfront update-distribution \
  --id "$CF_DIST_ID" \
  --if-match "$CF_ETAG" \
  --distribution-config file:///dev/stdin \
  --query 'Distribution.DomainName' \
  --output text

log "CloudFront distribution $CF_DIST_ID updated with security headers policy"
warn "CloudFront deploy takes ~5 min — headers will be live shortly"

# ------------------------------------------------------------------------------
# STEP 5: S3 — Block public access + create OAC + update CloudFront origin
# ------------------------------------------------------------------------------
echo ""
echo "── STEP 5: S3 hardening + OAC ─────────────────────────────"

# Block all public access
aws s3api put-public-access-block \
  --bucket "$S3_BUCKET" \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --region "$REGION"
log "S3 public access blocked on $S3_BUCKET"

# Enable SSE on website bucket
aws s3api put-bucket-encryption \
  --bucket "$S3_BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"},
      "BucketKeyEnabled": true
    }]
  }' \
  --region "$REGION"
log "S3 SSE-S3 enabled on $S3_BUCKET"

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket "$S3_BUCKET" \
  --versioning-configuration Status=Enabled \
  --region "$REGION"
log "S3 versioning enabled on $S3_BUCKET"

# Disable S3 website hosting (OAC requires REST API endpoint, not website endpoint)
aws s3api delete-bucket-website \
  --bucket "$S3_BUCKET" \
  --region "$REGION" 2>/dev/null || true
log "S3 website hosting disabled (switching to REST API endpoint for OAC)"

# Create Origin Access Control
EXISTING_OAC=$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='pulari-oac'].Id" \
  --output text 2>/dev/null || echo "")

if [ -z "$EXISTING_OAC" ] || [ "$EXISTING_OAC" = "None" ]; then
  OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config '{
      "Name": "pulari-oac",
      "Description": "OAC for pulari-restaurant S3 bucket",
      "SigningProtocol": "sigv4",
      "SigningBehavior": "always",
      "OriginAccessControlOriginType": "s3"
    }' \
    --query 'OriginAccessControl.Id' \
    --output text)
  log "OAC created: $OAC_ID"
else
  OAC_ID="$EXISTING_OAC"
  warn "OAC already exists: $OAC_ID"
fi

# Get fresh config after headers policy update
sleep 3
CF_CONFIG2=$(aws cloudfront get-distribution-config --id "$CF_DIST_ID")
CF_ETAG2=$(echo "$CF_CONFIG2" | python3 -c "import sys,json; print(json.load(sys.stdin)['ETag'])")
CF_DIST_CONFIG2=$(echo "$CF_CONFIG2" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['DistributionConfig']))")

# Inject OAC into origin — convert from website endpoint to REST API endpoint
CF_UPDATED2=$(echo "$CF_DIST_CONFIG2" | python3 -c "
import sys, json
cfg = json.load(sys.stdin)
for origin in cfg.get('Origins', {}).get('Items', []):
    if '$S3_BUCKET' in origin.get('DomainName', ''):
        # Convert S3 website endpoint to REST API endpoint for OAC
        origin['DomainName'] = '$S3_BUCKET.s3.$REGION.amazonaws.com'
        origin['OriginAccessControlId'] = '$OAC_ID'
        # Remove CustomOriginConfig (website endpoint)
        origin.pop('CustomOriginConfig', None)
        # Add S3OriginConfig (REST API endpoint)
        origin['S3OriginConfig'] = {'OriginAccessIdentity': ''}
print(json.dumps(cfg))
")

echo "$CF_UPDATED2" | aws cloudfront update-distribution \
  --id "$CF_DIST_ID" \
  --if-match "$CF_ETAG2" \
  --distribution-config file:///dev/stdin \
  --query 'Distribution.Id' \
  --output text

log "CloudFront origin updated with OAC"

# Update S3 bucket policy — allow only CloudFront OAC
OAC_BUCKET_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {"Service": "cloudfront.amazonaws.com"},
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${S3_BUCKET}/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${CF_DIST_ID}"
        }
      }
    }
  ]
}
EOF
)
echo "$OAC_BUCKET_POLICY" | aws s3api put-bucket-policy \
  --bucket "$S3_BUCKET" \
  --policy file:///dev/stdin \
  --region "$REGION"
log "S3 bucket policy: CloudFront OAC only — direct S3 URLs blocked"

# ------------------------------------------------------------------------------
# STEP 6: WAF — WebACL with managed rules + attach to CloudFront
# ------------------------------------------------------------------------------
echo ""
echo "── STEP 6: WAF v2 ─────────────────────────────────────────"
# WAF for CloudFront must be in us-east-1
WAF_REGION="us-east-1"

EXISTING_WACL=$(aws wafv2 list-web-acls \
  --scope CLOUDFRONT \
  --region "$WAF_REGION" \
  --query "WebACLs[?Name=='pulari-waf'].Id" \
  --output text 2>/dev/null || echo "")

if [ -z "$EXISTING_WACL" ] || [ "$EXISTING_WACL" = "None" ]; then
  WAF_RESULT=$(aws wafv2 create-web-acl \
    --name "pulari-waf" \
    --scope CLOUDFRONT \
    --region "$WAF_REGION" \
    --default-action '{"Allow": {}}' \
    --description "Pulari Restaurant WAF - managed rules and rate limit" \
    --rules '[
      {
        "Name": "AWSManagedRulesCommonRuleSet",
        "Priority": 10,
        "OverrideAction": {"None": {}},
        "Statement": {
          "ManagedRuleGroupStatement": {
            "VendorName": "AWS",
            "Name": "AWSManagedRulesCommonRuleSet"
          }
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "CommonRuleSet"
        }
      },
      {
        "Name": "AWSManagedRulesKnownBadInputsRuleSet",
        "Priority": 20,
        "OverrideAction": {"None": {}},
        "Statement": {
          "ManagedRuleGroupStatement": {
            "VendorName": "AWS",
            "Name": "AWSManagedRulesKnownBadInputsRuleSet"
          }
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "KnownBadInputs"
        }
      },
      {
        "Name": "AWSManagedRulesAmazonIpReputationList",
        "Priority": 30,
        "OverrideAction": {"None": {}},
        "Statement": {
          "ManagedRuleGroupStatement": {
            "VendorName": "AWS",
            "Name": "AWSManagedRulesAmazonIpReputationList"
          }
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "IPReputation"
        }
      },
      {
        "Name": "PulariRateLimit",
        "Priority": 40,
        "Action": {"Block": {}},
        "Statement": {
          "RateBasedStatement": {
            "Limit": 2000,
            "AggregateKeyType": "IP"
          }
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "RateLimit"
        }
      }
    ]' \
    --visibility-config '{
      "SampledRequestsEnabled": true,
      "CloudWatchMetricsEnabled": true,
      "MetricName": "pulari-waf"
    }')

  WAF_ID=$(echo "$WAF_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['Summary']['Id'])")
  WAF_ARN=$(echo "$WAF_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['Summary']['ARN'])")
  log "WAF WebACL created: $WAF_ID"
else
  WAF_ID="$EXISTING_WACL"
  WAF_ARN="arn:aws:wafv2:us-east-1:${ACCOUNT_ID}:global/webacl/pulari-waf/${WAF_ID}"
  warn "WAF WebACL already exists: $WAF_ID"
fi

# Associate WAF with CloudFront via distribution config update
echo "Attaching WAF to CloudFront..."
CF_CONFIG3=$(aws cloudfront get-distribution-config --id "$CF_DIST_ID")
CF_ETAG3=$(echo "$CF_CONFIG3" | python3 -c "import sys,json; print(json.load(sys.stdin)['ETag'])")
CF_DIST_CONFIG3=$(echo "$CF_CONFIG3" | python3 -c "import sys,json; c=json.load(sys.stdin)['DistributionConfig']; c['WebACLId']='$WAF_ARN'; print(json.dumps(c))")

echo "$CF_DIST_CONFIG3" | aws cloudfront update-distribution \
  --id "$CF_DIST_ID" \
  --if-match "$CF_ETAG3" \
  --distribution-config file:///dev/stdin \
  --query 'Distribution.Id' \
  --output text

log "WAF associated with CloudFront distribution $CF_DIST_ID"

# ------------------------------------------------------------------------------
# DONE
# ------------------------------------------------------------------------------
echo ""
echo "======================================================"
echo " Week 1 Hardening Complete!"
echo "======================================================"
echo ""
echo "  Cognito   ✓  Password policy + TOTP MFA + email verify"
echo "  GuardDuty ✓  Detector $DETECTOR_ID"
echo "  CloudTrail✓  pulari-audit-trail → s3://$CT_BUCKET"
echo "  CF Headers✓  CSP + HSTS + XFO + XCTO + Referrer"
echo "  S3 OAC    ✓  Direct S3 access blocked — CF OAC only"
echo "  WAF       ✓  CommonRuleSet + BadInputs + IPReputation + RateLimit"
echo ""
echo "  Next: Week 2 — Lambda backend + DynamoDB tables"
echo "         bash scripts/week2-lambda-backend.sh"
echo "======================================================"
