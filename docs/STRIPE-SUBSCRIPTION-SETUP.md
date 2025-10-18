# Stripe Subscription Setup Guide

**Phase 2 Week 10 - Billing Integration**
**Date:** 2025-10-12

---

## 🎯 Overview

This guide walks you through setting up subscription products and prices in your Stripe account for the multi-tenant SaaS billing system.

---

## 📋 Prerequisites

- Stripe account (use Test Mode for development)
- Admin access to Stripe Dashboard
- Webhook endpoint URL: `https://stores.stepperslife.com/api/webhooks/stripe/subscriptions`

---

## 🛠️ Step 1: Create Subscription Products

Login to Stripe Dashboard → Products → Create Product

### **Product 1: Starter Plan**

**Product Name:** `SteppersLife Stores - Starter Plan`
**Description:** `Perfect for solo entrepreneurs getting started`

**Pricing:**
- **Price:** $29.00 USD
- **Billing:** Monthly
- **Price ID:** (Copy this after creation) → Add to `.env` as `STRIPE_PRICE_STARTER`

**Metadata:**
```
plan: STARTER
maxProducts: 50
maxOrders: 100
maxStorageGB: 1
platformFeePercent: 5.0
```

---

### **Product 2: Pro Plan**

**Product Name:** `SteppersLife Stores - Pro Plan`
**Description:** `For growing businesses with higher volume`

**Pricing:**
- **Price:** $79.00 USD
- **Billing:** Monthly
- **Price ID:** (Copy this after creation) → Add to `.env` as `STRIPE_PRICE_PRO`

**Metadata:**
```
plan: PRO
maxProducts: 500
maxOrders: 1000
maxStorageGB: 10
platformFeePercent: 3.0
```

---

### **Product 3: Enterprise Plan**

**Product Name:** `SteppersLife Stores - Enterprise Plan`
**Description:** `Unlimited resources for large businesses`

**Pricing:**
- **Price:** $299.00 USD
- **Billing:** Monthly
- **Price ID:** (Copy this after creation) → Add to `.env` as `STRIPE_PRICE_ENTERPRISE`

**Metadata:**
```
plan: ENTERPRISE
maxProducts: 999999
maxOrders: 999999
maxStorageGB: 100
platformFeePercent: 2.0
```

---

## 🔧 Step 2: Configure Webhook Endpoint

Navigate to: **Developers** → **Webhooks** → **Add Endpoint**

**Endpoint URL:** `https://stores.stepperslife.com/api/webhooks/stripe/subscriptions`

**Events to Listen For:**
```
✓ customer.subscription.created
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ customer.subscription.trial_will_end
✓ invoice.payment_succeeded
✓ invoice.payment_failed
✓ invoice.upcoming
```

**After Creating:**
- Copy the **Webhook Signing Secret** (starts with `whsec_...`)
- Add to `.env` as `STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS`

---

## 📝 Step 3: Update Environment Variables

Add these to `/root/websites/stores-stepperslife/.env`:

```bash
# Stripe Subscription Products (copy Price IDs from Stripe Dashboard)
STRIPE_PRICE_STARTER="price_xxxxxxxxxxxxx"
STRIPE_PRICE_PRO="price_xxxxxxxxxxxxx"
STRIPE_PRICE_ENTERPRISE="price_xxxxxxxxxxxxx"

# Subscription Webhook Secret (separate from payment webhook)
STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS="whsec_xxxxxxxxxxxxx"
```

---

## ✅ Step 4: Test Mode Configuration

**For Development:**
1. Use Stripe Test Mode (toggle in Dashboard)
2. All price IDs should start with `price_` (test mode)
3. Use test card: `4242 4242 4242 4242` (Visa)
4. Exp: Any future date
5. CVC: Any 3 digits
6. ZIP: Any 5 digits

**Test Scenarios:**
- ✓ Successful subscription creation
- ✓ Payment failure (use card `4000 0000 0000 0341`)
- ✓ Subscription upgrade
- ✓ Subscription cancellation
- ✓ Webhook delivery

---

## 🚀 Step 5: Production Configuration

**Before Going Live:**
1. Toggle Stripe to **Live Mode**
2. Re-create all 3 products in Live Mode
3. Update `.env` with Live Mode price IDs
4. Update webhook endpoint (same URL, but in Live Mode)
5. Update webhook secret in `.env`
6. Test with real card (small amount)

---

## 📊 Price ID Reference

After setup, your `.env` should have these exact values:

### Test Mode (Current):
```bash
STRIPE_PRICE_STARTER="price_1QYcVHDfQWmUlE6Y9XZaBcDe"  # Example
STRIPE_PRICE_PRO="price_1QYcVIDfQWmUlE6Y9XZaBcDf"      # Example
STRIPE_PRICE_ENTERPRISE="price_1QYcVJDfQWmUlE6Y9XZaBcDg"  # Example
```

### Live Mode (Production):
```bash
# TODO: Add live mode price IDs when ready
```

---

## 🔍 Verification Checklist

- [ ] 3 products created in Stripe Dashboard
- [ ] All price IDs copied to `.env`
- [ ] Webhook endpoint added with correct events
- [ ] Webhook secret added to `.env`
- [ ] Test Mode toggle confirmed
- [ ] Metadata added to all products
- [ ] `.env` file saved and application restarted

---

## 🆘 Troubleshooting

### Issue: Webhook not receiving events
**Solution:**
- Check webhook URL is HTTPS
- Verify events are selected
- Check Stripe Dashboard → Webhooks → View Details → Events

### Issue: Price ID not working
**Solution:**
- Ensure using correct mode (Test vs Live)
- Copy full price ID including `price_` prefix
- Restart application after updating `.env`

### Issue: Metadata not showing
**Solution:**
- Add metadata in Stripe Dashboard → Product → Edit → Metadata section
- Exact field names matter (case-sensitive)

---

## 📞 Support

**Stripe Documentation:**
- Products: https://stripe.com/docs/products-prices
- Subscriptions: https://stripe.com/docs/billing/subscriptions
- Webhooks: https://stripe.com/docs/webhooks

**Stripe Support:**
- Test Mode Dashboard: https://dashboard.stripe.com/test
- Live Mode Dashboard: https://dashboard.stripe.com

---

**Status:** ✅ Ready for configuration
**Next Step:** Configure Stripe products, then proceed with API implementation (Task 2)
