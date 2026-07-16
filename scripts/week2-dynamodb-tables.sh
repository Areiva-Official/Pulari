#!/usr/bin/env bash
# =============================================================================
# Pulari Restaurant — Week 2 DynamoDB Tables
# Run from repo root: bash scripts/week2-dynamodb-tables.sh
# =============================================================================
set -euo pipefail

REGION="eu-west-1"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }

echo ""
echo "======================================================"
echo " Pulari — DynamoDB Tables Creation"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================"
echo ""

# ------------------------------------------------------------------------------
# TABLE 1: Menu
# PK: id (string) — menuItemId
# GSI: categoryIndex — category (string) + sortOrder (number)
# ------------------------------------------------------------------------------
echo "── Creating Menu table ────────────────────────────────"
aws dynamodb create-table \
  --table-name pulari-menu \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=category,AttributeType=S \
    AttributeName=sortOrder,AttributeType=N \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes '[{
    "IndexName": "categoryIndex",
    "KeySchema": [
      {"AttributeName": "category", "KeyType": "HASH"},
      {"AttributeName": "sortOrder", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  }]' \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --tags Key=Project,Value=Pulari Key=Environment,Value=Production \
  2>/dev/null && log "Menu table created" || warn "Menu table already exists"

# ------------------------------------------------------------------------------
# TABLE 2: Orders
# PK: id (string) — orderId
# GSI: userEmailIndex — userEmail (string) + createdAt (string)
# GSI: statusIndex — status (string) + createdAt (string)
# ------------------------------------------------------------------------------
echo "── Creating Orders table ──────────────────────────────"
aws dynamodb create-table \
  --table-name pulari-orders \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userEmail,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "userEmailIndex",
      "KeySchema": [
        {"AttributeName": "userEmail", "KeyType": "HASH"},
        {"AttributeName": "createdAt", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "statusIndex",
      "KeySchema": [
        {"AttributeName": "status", "KeyType": "HASH"},
        {"AttributeName": "createdAt", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --tags Key=Project,Value=Pulari Key=Environment,Value=Production \
  2>/dev/null && log "Orders table created" || warn "Orders table already exists"

# ------------------------------------------------------------------------------
# TABLE 3: Reservations
# PK: id (string) — reservationId
# GSI: userEmailIndex — userEmail (string) + reservationDate (string)
# GSI: dateIndex — reservationDate (string) + reservationTime (string)
# ------------------------------------------------------------------------------
echo "── Creating Reservations table ────────────────────────"
aws dynamodb create-table \
  --table-name pulari-reservations \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userEmail,AttributeType=S \
    AttributeName=reservationDate,AttributeType=S \
    AttributeName=reservationTime,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "userEmailIndex",
      "KeySchema": [
        {"AttributeName": "userEmail", "KeyType": "HASH"},
        {"AttributeName": "reservationDate", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "dateIndex",
      "KeySchema": [
        {"AttributeName": "reservationDate", "KeyType": "HASH"},
        {"AttributeName": "reservationTime", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --tags Key=Project,Value=Pulari Key=Environment,Value=Production \
  2>/dev/null && log "Reservations table created" || warn "Reservations table already exists"

# ------------------------------------------------------------------------------
# TABLE 4: Reviews
# PK: id (string) — reviewId
# GSI: menuItemIndex — menuItemId (string) + createdAt (string)
# GSI: statusIndex — status (string) + createdAt (string)
# ------------------------------------------------------------------------------
echo "── Creating Reviews table ─────────────────────────────"
aws dynamodb create-table \
  --table-name pulari-reviews \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=menuItemId,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "menuItemIndex",
      "KeySchema": [
        {"AttributeName": "menuItemId", "KeyType": "HASH"},
        {"AttributeName": "createdAt", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "statusIndex",
      "KeySchema": [
        {"AttributeName": "status", "KeyType": "HASH"},
        {"AttributeName": "createdAt", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --tags Key=Project,Value=Pulari Key=Environment,Value=Production \
  2>/dev/null && log "Reviews table created" || warn "Reviews table already exists"

# ------------------------------------------------------------------------------
# TABLE 5: Coupons
# PK: code (string) — coupon code (case-insensitive, uppercase in DB)
# No GSI needed — query by PK only
# ------------------------------------------------------------------------------
echo "── Creating Coupons table ─────────────────────────────"
aws dynamodb create-table \
  --table-name pulari-coupons \
  --attribute-definitions AttributeName=code,AttributeType=S \
  --key-schema AttributeName=code,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --tags Key=Project,Value=Pulari Key=Environment,Value=Production \
  2>/dev/null && log "Coupons table created" || warn "Coupons table already exists"

# ------------------------------------------------------------------------------
# TABLE 6: Settings
# PK: key (string) — setting key (e.g., 'restaurant', 'hours', 'pinpointAppId')
# No GSI needed — query by PK only
# ------------------------------------------------------------------------------
echo "── Creating Settings table ────────────────────────"
aws dynamodb create-table \
  --table-name pulari-settings \
  --attribute-definitions AttributeName=key,AttributeType=S \
  --key-schema AttributeName=key,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --tags Key=Project,Value=Pulari Key=Environment,Value=Production \
  2>/dev/null && log "Settings table created" || warn "Settings table already exists"

# ------------------------------------------------------------------------------
# TABLE 7: Blog
# PK: id (string) — blog post id
# No GSI needed — low-volume content, list/slug lookups Scan + filter in-memory
# ------------------------------------------------------------------------------
echo "── Creating Blog table ───────────────────────────"
aws dynamodb create-table \
  --table-name pulari-blog \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --tags Key=Project,Value=Pulari Key=Environment,Value=Production \
  2>/dev/null && log "Blog table created" || warn "Blog table already exists"

# ------------------------------------------------------------------------------
# Wait for all tables to become ACTIVE
# ------------------------------------------------------------------------------
echo ""
echo "Waiting for all tables to become ACTIVE..."
for TABLE in pulari-menu pulari-orders pulari-reservations pulari-reviews pulari-coupons pulari-settings pulari-blog; do
  aws dynamodb wait table-exists --table-name "$TABLE" --region "$REGION"
  log "$TABLE is ACTIVE"
done

echo ""
echo "======================================================"
echo " DynamoDB Tables Ready!"
echo "======================================================"
echo ""
echo "  pulari-menu          ✓  PK: id, GSI: categoryIndex"
echo "  pulari-orders        ✓  PK: id, GSI: userEmailIndex + statusIndex"
echo "  pulari-reservations  ✓  PK: id, GSI: userEmailIndex + dateIndex"
echo "  pulari-reviews       ✓  PK: id, GSI: menuItemIndex + statusIndex"
echo "  pulari-coupons       ✓  PK: code"
echo "  pulari-settings      ✓  PK: key"
echo "  pulari-blog          ✓  PK: id"
echo ""
echo "  Next: Lambda backend build"
echo "======================================================"
