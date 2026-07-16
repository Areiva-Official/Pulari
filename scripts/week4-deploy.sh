#!/usr/bin/env bash
# =============================================================================
# Pulari Restaurant — Week 4: Production Deploy
# Run from repo root: bash scripts/week4-deploy.sh
#
# What it does:
#   1. Verifies prerequisites (AWS CLI, git clean enough, .env.production)
#   2. Builds the React SPA  (Vite)
#   3. Builds all Lambda bundles  (esbuild)
#   4. Deploys Lambda code + config updates  (re-runs week2 deploy)
#   5. Syncs dist/ → S3 bucket  (--delete removes stale files)
#   6. Invalidates CloudFront cache  /*
#   7. Creates a git tag  vX.Y.Z  (auto-increments patch by default)
#   8. Prints next steps (manual dev → main merge + GitHub push)
#
# Required env vars (can also be in .env.production, not read automatically):
#   AWS_PROFILE or AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
#   STRIPE_SECRET_KEY        (optional — keeps existing value if blank)
#   STRIPE_WEBHOOK_SECRET    (optional — keeps existing value if blank)
#
# =============================================================================
set -euo pipefail

REGION="eu-west-1"
S3_BUCKET="pulari-restaurant"
CLOUDFRONT_ID="E26CSNGKOODB0A"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
info() { echo -e "${BLUE}[i]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }

echo ""
echo "======================================================"
echo " Pulari — Production Deploy"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================"
echo ""

cd "$REPO_ROOT"

# ─── 1. PRE-FLIGHT ───────────────────────────────────────────────────────────
echo "── STEP 1: Pre-flight checks ───────────────────────────────"

command -v aws  >/dev/null || die "aws CLI not found"
command -v node >/dev/null || die "node not found"
command -v npm  >/dev/null || die "npm not found"
command -v git  >/dev/null || die "git not found"

[ -f ".env.production" ] || die ".env.production not found"
[ -f "lambda/package.json" ] || die "lambda/package.json not found"

# Warn (but don't abort) if there are uncommitted changes
if ! git diff --quiet HEAD 2>/dev/null; then
  warn "You have uncommitted changes. Consider committing before deploying."
fi

# Confirm current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
info "Deploying from branch: $CURRENT_BRANCH"
if [ "$CURRENT_BRANCH" = "main" ]; then
  warn "Deploying directly from main — make sure this is intentional."
fi

# Verify AWS credentials work
aws sts get-caller-identity --region "$REGION" >/dev/null \
  || die "AWS credentials invalid or expired — run: aws configure"
log "AWS credentials OK"

# ─── 2. BUILD REACT SPA ──────────────────────────────────────────────────────
echo ""
echo "── STEP 2: Build frontend (Vite) ──────────────────────────"

npm ci --silent 2>/dev/null || npm install --silent
npm run build
log "Frontend build complete → dist/"

# ─── 3. BUILD LAMBDA BUNDLES ─────────────────────────────────────────────────
echo ""
echo "── STEP 3: Build Lambda bundles (esbuild) ─────────────────"

(cd lambda && npm ci --silent 2>/dev/null || npm install --silent && npm run build)
log "Lambda build complete → lambda/dist/"

# ─── 4. DEPLOY LAMBDA FUNCTIONS ──────────────────────────────────────────────
echo ""
echo "── STEP 4: Deploy Lambda functions ────────────────────────"

bash scripts/week2-lambda-deploy.sh
log "Lambda functions deployed"

# ─── 5. SYNC DIST → S3 ───────────────────────────────────────────────────────
echo ""
echo "── STEP 5: Sync dist/ → s3://${S3_BUCKET} ─────────────────"

# HTML files: no-cache (always revalidated)
aws s3 sync dist/ "s3://${S3_BUCKET}" \
  --region "$REGION" \
  --delete \
  --cache-control "no-cache, no-store, must-revalidate" \
  --exclude "*" \
  --include "*.html" \
  --include "robots.txt" \
  --include "sitemap.xml" \
  --quiet

# Hashed assets: immutable long-term cache
aws s3 sync dist/ "s3://${S3_BUCKET}" \
  --region "$REGION" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "robots.txt" \
  --exclude "sitemap.xml" \
  --quiet

log "S3 sync complete"

# ─── 6. CLOUDFRONT INVALIDATION ──────────────────────────────────────────────
echo ""
echo "── STEP 6: CloudFront invalidation /* ─────────────────────"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)
log "Invalidation created: $INVALIDATION_ID"

info "Waiting for invalidation to complete (usually 30-60 s)..."
aws cloudfront wait invalidation-completed \
  --distribution-id "$CLOUDFRONT_ID" \
  --id "$INVALIDATION_ID"
log "CloudFront cache cleared"

# ─── 7. GIT TAG ──────────────────────────────────────────────────────────────
echo ""
echo "── STEP 7: Git tag ─────────────────────────────────────────"

# Auto-increment the patch version from the latest tag
LATEST_TAG=$(git tag --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1 || echo "v0.0.0")
IFS='.' read -r MAJOR_RAW MINOR_RAW PATCH_RAW <<< "${LATEST_TAG#v}"
MAJOR="${MAJOR_RAW:-0}"; MINOR="${MINOR_RAW:-0}"; PATCH="${PATCH_RAW:-0}"
NEW_PATCH=$((PATCH + 1))
NEW_TAG="v${MAJOR}.${MINOR}.${NEW_PATCH}"

git tag -a "$NEW_TAG" -m "Production deploy $(date '+%Y-%m-%d %H:%M:%S')"
log "Git tag created: $NEW_TAG"

# ─── DONE ────────────────────────────────────────────────────────────────────
echo ""
echo "======================================================"
echo " Production Deploy Complete!"
echo "======================================================"
echo ""
echo "  Live URL:   https://www.pulari.ie"
echo "  Git tag:    $NEW_TAG"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Verify the live site:"
echo "       open https://www.pulari.ie"
echo ""
echo "  2. Push the tag to GitHub:"
echo "       git push origin $NEW_TAG"
echo ""
echo "  3. Merge dev → main and push:"
echo "       git checkout main"
echo "       git merge dev --no-ff -m \"Release $NEW_TAG\""
echo "       git push origin main"
echo "       git checkout dev"
echo ""
echo "  4. (First deploy only) Add Stripe keys:"
echo "       STRIPE_SECRET_KEY=sk_live_xxx \\"
echo "       STRIPE_WEBHOOK_SECRET=whsec_xxx \\"
echo "       bash scripts/week3-stripe-keys.sh"
echo ""
