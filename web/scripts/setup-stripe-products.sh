#!/bin/bash
# ============================================================
# JustOneLastDrink — Stripe Product Setup Script
# Run this once to create all Products & Prices in your Stripe account.
# Requires: stripe CLI logged in (`stripe login`)
# ============================================================

set -euo pipefail

APP="justonelastdrink"
echo "🍺 Setting up Stripe products for JustOneLastDrink..."
echo ""

# -----------------------------------------------------------
# 1. Pro Subscription — $3/mo
# -----------------------------------------------------------
echo "Creating: JustOneLastDrink Pro (\$3/mo subscription)..."
PRO_PRODUCT=$(stripe products create \
  --name="JustOneLastDrink Pro" \
  --description="100 credits/month, share to storyboard, full history, priority processing" \
  -d "metadata[app]=$APP" \
  --format=json | grep -o '"id": "prod_[^"]*"' | head -1 | cut -d'"' -f4)

PRO_PRICE=$(stripe prices create \
  --product="$PRO_PRODUCT" \
  --unit-amount=300 \
  --currency=usd \
  -d "recurring[interval]=month" \
  -d "metadata[app]=$APP" \
  -d "metadata[plan]=paid" \
  --format=json | grep -o '"id": "price_[^"]*"' | head -1 | cut -d'"' -f4)

echo "  ✅ Product: $PRO_PRODUCT"
echo "  ✅ Price:   $PRO_PRICE"
echo ""

# -----------------------------------------------------------
# 2. Top-Up: 40 credits — $1
# -----------------------------------------------------------
echo "Creating: Top-Up 40 credits (\$1)..."
TOPUP_40_PRODUCT=$(stripe products create \
  --name="JustOneLastDrink Top-Up: 40 credits" \
  --description="40 credits that never expire" \
  -d "metadata[app]=$APP" \
  -d "metadata[type]=topup" \
  -d "metadata[credits]=40" \
  --format=json | grep -o '"id": "prod_[^"]*"' | head -1 | cut -d'"' -f4)

TOPUP_40_PRICE=$(stripe prices create \
  --product="$TOPUP_40_PRODUCT" \
  --unit-amount=100 \
  --currency=usd \
  -d "metadata[app]=$APP" \
  -d "metadata[credits]=40" \
  --format=json | grep -o '"id": "price_[^"]*"' | head -1 | cut -d'"' -f4)

echo "  ✅ Product: $TOPUP_40_PRODUCT"
echo "  ✅ Price:   $TOPUP_40_PRICE"
echo ""

# -----------------------------------------------------------
# 3. Top-Up: 100 credits — $2
# -----------------------------------------------------------
echo "Creating: Top-Up 100 credits (\$2)..."
TOPUP_100_PRODUCT=$(stripe products create \
  --name="JustOneLastDrink Top-Up: 100 credits" \
  --description="100 credits that never expire" \
  -d "metadata[app]=$APP" \
  -d "metadata[type]=topup" \
  -d "metadata[credits]=100" \
  --format=json | grep -o '"id": "prod_[^"]*"' | head -1 | cut -d'"' -f4)

TOPUP_100_PRICE=$(stripe prices create \
  --product="$TOPUP_100_PRODUCT" \
  --unit-amount=200 \
  --currency=usd \
  -d "metadata[app]=$APP" \
  -d "metadata[credits]=100" \
  --format=json | grep -o '"id": "price_[^"]*"' | head -1 | cut -d'"' -f4)

echo "  ✅ Product: $TOPUP_100_PRODUCT"
echo "  ✅ Price:   $TOPUP_100_PRICE"
echo ""

# -----------------------------------------------------------
# 4. Top-Up: 250 credits — $4
# -----------------------------------------------------------
echo "Creating: Top-Up 250 credits (\$4)..."
TOPUP_250_PRODUCT=$(stripe products create \
  --name="JustOneLastDrink Top-Up: 250 credits" \
  --description="250 credits that never expire" \
  -d "metadata[app]=$APP" \
  -d "metadata[type]=topup" \
  -d "metadata[credits]=250" \
  --format=json | grep -o '"id": "prod_[^"]*"' | head -1 | cut -d'"' -f4)

TOPUP_250_PRICE=$(stripe prices create \
  --product="$TOPUP_250_PRODUCT" \
  --unit-amount=400 \
  --currency=usd \
  -d "metadata[app]=$APP" \
  -d "metadata[credits]=250" \
  --format=json | grep -o '"id": "price_[^"]*"' | head -1 | cut -d'"' -f4)

echo "  ✅ Product: $TOPUP_250_PRODUCT"
echo "  ✅ Price:   $TOPUP_250_PRICE"
echo ""

# -----------------------------------------------------------
# Summary
# -----------------------------------------------------------
echo "============================================================"
echo "🎉 All products created! Add these to your Convex env:"
echo "============================================================"
echo ""
echo "npx convex env set STRIPE_PRICE_PRO $PRO_PRICE"
echo "npx convex env set STRIPE_PRICE_TOPUP_40 $TOPUP_40_PRICE"
echo "npx convex env set STRIPE_PRICE_TOPUP_100 $TOPUP_100_PRICE"
echo "npx convex env set STRIPE_PRICE_TOPUP_250 $TOPUP_250_PRICE"
echo ""
echo "Don't forget to also set:"
echo "  npx convex env set STRIPE_SECRET_KEY rk_live_xxxxx"
echo "  npx convex env set STRIPE_WEBHOOK_SECRET whsec_xxxxx"
echo "  npx convex env set SITE_URL https://your-production-url.com"
echo ""
