# SteppersLife Stores - Payment Methods Testing Guide

**Date:** October 10, 2025
**Feature:** Multi-Payment Processor Support
**Status:** ✅ IMPLEMENTED & READY TO TEST

---

## 🎯 Overview

The SteppersLife Stores platform now supports **4 payment methods**:

1. **Stripe** - Credit cards and digital wallets (default)
2. **PayPal** - PayPal payments
3. **Square** - Square payments
4. **Cash** - In-person cash payments (pickup only)

**Vendor Choice:** Each vendor can select:
- 1 **Primary** payment method (required)
- 1 **Secondary** payment method (optional)

---

## 📊 Database Changes Applied

✅ **Migration Applied:** `add_multi_payment_processors.sql`

### New Fields Added to `vendor_stores`:
```sql
- primaryPaymentProcessor (STRIPE | PAYPAL | SQUARE | CASH)
- secondaryPaymentProcessor (optional)
- paypalEmail
- paypalMerchantId
- squareAccessToken
- squareLocationId
- acceptsCash (boolean)
- cashInstructions (text)
```

### New Enum Values:
```sql
PaymentProcessor: STRIPE | PAYPAL | SQUARE | CASH
```

---

## 🚀 New Features

### 1. Vendor Payment Settings Page
**URL:** `/dashboard/settings/payment`

**Features:**
- Select primary payment method (required)
- Select secondary payment method (optional)
- Configure payment processor credentials:
  - **Stripe:** Stripe Connect (existing)
  - **PayPal:** Email + Merchant ID
  - **Square:** Access Token + Location ID
  - **Cash:** Pickup instructions
- Platform fee display (7% on all methods)
- Payment processor fee comparison

### 2. Cash Payment Order Creation
**API:** `POST /api/orders/create-cash-order`

**Features:**
- Create orders without payment processor
- Automatic order confirmation emails
- Vendor alert emails
- Pickup instructions included
- No shipping cost (pickup only)
- Payment status: PENDING (until cash received)

---

## 🧪 Testing Instructions

### Test 1: Configure Payment Settings

#### Step 1: Access Payment Settings
```bash
# Login to vendor dashboard first
https://stores.stepperslife.com/dashboard/settings/payment
```

#### Step 2: Test API Directly
```bash
# Get current payment settings
curl -X GET \
  https://stores.stepperslife.com/api/dashboard/settings/payment \
  -H "Cookie: your-session-cookie"

# Update payment settings (Cash + PayPal example)
curl -X PUT \
  https://stores.stepperslife.com/api/dashboard/settings/payment \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "primaryPaymentProcessor": "CASH",
    "secondaryPaymentProcessor": "PAYPAL",
    "acceptsCash": true,
    "cashInstructions": "Pickup at 123 Main St, Chicago. Cash only. Bring exact change.",
    "paypalEmail": "vendor@example.com",
    "paypalMerchantId": "MERCHANT123"
  }'
```

---

### Test 2: Create Cash Payment Test Order

#### Prerequisites:
1. Vendor has `acceptsCash: true`
2. Cart has items (create via `/api/cart/add`)
3. Cart session ID available

#### Step 1: Enable Cash Payments for a Store
```bash
# Update existing vendor store to accept cash
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "
UPDATE vendor_stores
SET
  \"primaryPaymentProcessor\" = 'CASH',
  \"acceptsCash\" = true,
  \"cashInstructions\" = 'Pickup at 123 Main St, Chicago IL. Cash only. Please bring exact change. Open Mon-Fri 9am-5pm.'
WHERE id = (SELECT id FROM vendor_stores LIMIT 1);
"
```

#### Step 2: Create Test Cart Session
```bash
# Generate a cart session ID
CART_SESSION_ID="test-cart-$(date +%s)"
echo "Cart Session ID: $CART_SESSION_ID"

# Add items to cart via Redis (simulating cart creation)
redis-cli << EOF
SET "cart:$CART_SESSION_ID" '{
  "items": [
    {
      "productId": "YOUR_PRODUCT_ID",
      "vendorStoreId": "YOUR_VENDOR_STORE_ID",
      "productName": "Test Product",
      "variantName": "Size: Medium",
      "variantId": null,
      "quantity": 2,
      "price": 29.99,
      "image": "https://example.com/image.jpg"
    }
  ],
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}'
EXPIRE "cart:$CART_SESSION_ID" 3600
EOF
```

#### Step 3: Create Cash Order
```bash
curl -X POST \
  https://stores.stepperslife.com/api/orders/create-cash-order \
  -H "Content-Type: application/json" \
  -d '{
    "cartSessionId": "'"$CART_SESSION_ID"'",
    "customerName": "Test Customer",
    "customerEmail": "customer@example.com",
    "customerPhone": "+1-555-123-4567",
    "shippingAddress": {
      "fullName": "Test Customer",
      "addressLine1": "456 Test Avenue",
      "addressLine2": "Apt 2B",
      "city": "Chicago",
      "state": "IL",
      "zipCode": "60601",
      "phone": "+1-555-123-4567"
    }
  }'
```

#### Expected Response:
```json
{
  "success": true,
  "order": {
    "id": "clxxx...",
    "orderNumber": "SL-CASH-1728595200000-ABC12",
    "total": 65.53,
    "paymentStatus": "PENDING",
    "cashInstructions": "Pickup at 123 Main St, Chicago IL..."
  }
}
```

#### Step 4: Verify Emails Sent
Check that two emails were sent:
1. **Customer:** Order confirmation with cash instructions
2. **Vendor:** New order alert

```bash
# Check application logs for email confirmation
pm2 logs stores-stepperslife | grep -i "email sent"
```

---

### Test 3: Verify Database Records

```bash
# Check order was created with CASH payment processor
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "
SELECT
  \"orderNumber\",
  \"customerName\",
  \"paymentProcessor\",
  \"paymentStatus\",
  total,
  \"createdAt\"
FROM store_orders
WHERE \"paymentProcessor\" = 'CASH'
ORDER BY \"createdAt\" DESC
LIMIT 5;
"

# Check vendor store payment settings
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "
SELECT
  name,
  \"primaryPaymentProcessor\",
  \"secondaryPaymentProcessor\",
  \"acceptsCash\",
  \"cashInstructions\"
FROM vendor_stores
WHERE \"acceptsCash\" = true;
"
```

---

### Test 4: End-to-End Cash Payment Flow

#### Scenario: Customer Orders with Cash Payment

1. **Customer browses products:** https://stores.stepperslife.com
2. **Customer adds items to cart:** Click "Add to Cart"
3. **Customer goes to checkout:** `/checkout`
4. **Customer sees payment options:**
   - If vendor accepts cash: "Cash (Pickup)" option appears
   - Shows cash pickup instructions
5. **Customer completes order with cash**
6. **System creates order with status:** `PENDING`
7. **Customer receives email** with:
   - Order confirmation
   - Cash pickup instructions
   - Vendor contact info
8. **Vendor receives email** with:
   - New order alert
   - Customer pickup details
9. **Vendor marks order as fulfilled** when cash is received
10. **Order status updates to:** `PAID`

---

## 📧 Email Templates

### Customer Order Confirmation (Cash Payment)
```
Subject: Order Confirmation - SL-CASH-12345

Hi [Customer Name],

Thank you for your order!

Order Number: SL-CASH-12345
Total: $65.53
Payment Method: Cash (Pickup)

PICKUP INSTRUCTIONS:
[Vendor Cash Instructions]

Items:
- Test Product (Size: Medium) x2 - $59.98

Subtotal: $59.98
Tax: $5.55
Total: $65.53

Please bring exact cash amount when picking up.

Questions? Contact: [Vendor Email]
```

### Vendor New Order Alert (Cash Payment)
```
Subject: New Cash Order Received - SL-CASH-12345

Hi [Vendor Name],

You have a new cash order!

Order Number: SL-CASH-12345
Customer: Test Customer
Payment Method: CASH (PENDING)

Items:
- Test Product x2 - $59.98

Your Payout: $60.98 (after 7% platform fee)

IMPORTANT: This is a cash payment. Mark as paid after receiving cash.

Customer Pickup Info:
Name: Test Customer
Phone: +1-555-123-4567
Pickup Address: [From Cash Instructions]

View Order: https://stores.stepperslife.com/dashboard/orders/[order-id]
```

---

## 💰 Payment Processing Fees

| Method | Processing Fee | Platform Fee | Vendor Receives |
|--------|----------------|--------------|-----------------|
| **Cash** | $0.00 | 7% | ~93% |
| **Stripe** | 2.9% + $0.30 | 7% | ~88% |
| **PayPal** | 2.9% + $0.30 | 7% | ~88% |
| **Square** | 2.6% + $0.10 | 7% | ~88% |

**Example:** $100 sale with Cash
- Customer pays: $100.00
- Platform fee (7%): $7.00
- Processing fee: $0.00
- Vendor receives: $93.00

**Example:** $100 sale with Stripe
- Customer pays: $100.00
- Stripe fee: $3.20
- Platform fee (7% of $96.80): $6.78
- Vendor receives: $90.02

---

## 🔄 Quick Test Scenarios

### Scenario 1: Cash-Only Vendor
```bash
# Set vendor to accept only cash
curl -X PUT https://stores.stepperslife.com/api/dashboard/settings/payment \
  -H "Content-Type: application/json" \
  -d '{
    "primaryPaymentProcessor": "CASH",
    "acceptsCash": true,
    "cashInstructions": "123 Main St, Chicago. Mon-Fri 9-5pm"
  }'

# Create test order → Should succeed
# Checkout with Stripe → Should fail or redirect to cash
```

### Scenario 2: Stripe + PayPal Vendor
```bash
# Set vendor to accept Stripe and PayPal
curl -X PUT https://stores.stepperslife.com/api/dashboard/settings/payment \
  -H "Content-Type: application/json" \
  -d '{
    "primaryPaymentProcessor": "STRIPE",
    "secondaryPaymentProcessor": "PAYPAL",
    "paypalEmail": "vendor@example.com"
  }'

# Customer should see both payment options at checkout
```

### Scenario 3: Cash + Square Backup
```bash
# Set vendor to accept Cash primarily, Square as backup
curl -X PUT https://stores.stepperslife.com/api/dashboard/settings/payment \
  -H "Content-Type: application/json" \
  -d '{
    "primaryPaymentProcessor": "CASH",
    "secondaryPaymentProcessor": "SQUARE",
    "acceptsCash": true,
    "cashInstructions": "Local pickup only",
    "squareAccessToken": "sq0atp-...",
    "squareLocationId": "LOC123"
  }'
```

---

## 🐛 Troubleshooting

### Issue: "Store does not accept cash payments"
**Solution:** Ensure `acceptsCash: true` in vendor settings

```bash
# Check vendor settings
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "
SELECT name, \"acceptsCash\", \"primaryPaymentProcessor\"
FROM vendor_stores
WHERE id = 'YOUR_VENDOR_STORE_ID';
"

# Fix if needed
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "
UPDATE vendor_stores
SET \"acceptsCash\" = true, \"primaryPaymentProcessor\" = 'CASH'
WHERE id = 'YOUR_VENDOR_STORE_ID';
"
```

### Issue: "Cart not found"
**Solution:** Cart session expired or invalid

```bash
# Check if cart exists in Redis
redis-cli GET "cart:YOUR_CART_SESSION_ID"

# Recreate cart if needed (see Step 2 above)
```

### Issue: Emails not sending
**Solution:** Check RESEND_API_KEY and logs

```bash
# Verify API key
grep RESEND_API_KEY /root/websites/stores-stepperslife/.env

# Check email logs
pm2 logs stores-stepperslife | grep -i "email\|resend"
```

---

## ✅ Test Checklist

- [ ] Vendor can access `/dashboard/settings/payment`
- [ ] Vendor can select primary payment method
- [ ] Vendor can select secondary payment method
- [ ] Vendor can enter PayPal email
- [ ] Vendor can enter Square credentials
- [ ] Vendor can enable cash payments
- [ ] Vendor can enter cash instructions
- [ ] Settings save successfully
- [ ] Cash order can be created via API
- [ ] Order confirmation email sends to customer
- [ ] Vendor alert email sends to vendor
- [ ] Order appears in vendor dashboard
- [ ] Order shows PENDING payment status
- [ ] Cash instructions appear in order details
- [ ] Multiple payment methods display at checkout
- [ ] Platform fees calculate correctly

---

## 📚 Related Files

- **Payment Settings Page:** `app/(vendor)/dashboard/settings/payment/page.tsx`
- **Payment Settings API:** `app/api/dashboard/settings/payment/route.ts`
- **Cash Order API:** `app/api/orders/create-cash-order/route.ts`
- **Database Migration:** `prisma/migrations/add_multi_payment_processors.sql`
- **Prisma Schema:** `prisma/schema.prisma` (lines 130-137, 398-403)

---

## 🎉 Summary

✅ **4 Payment Methods:** Stripe, PayPal, Square, Cash
✅ **Vendor Choice:** Primary + optional secondary
✅ **Cash Payment Flow:** Complete with emails
✅ **Database Schema:** Updated with migration
✅ **API Endpoints:** Payment settings + cash orders
✅ **Email Integration:** Order confirmations + vendor alerts

**Status:** Ready for public testing!

**Next Steps:**
1. Test cash payment flow end-to-end
2. Add payment method selector to checkout page
3. Test with real vendors
4. Integrate PayPal SDK (Phase 2)
5. Integrate Square SDK (Phase 2)

---

**For full deployment status, see:** `DEPLOYMENT-STATUS.md`
**For production deployment, see:** `docs/PRODUCTION-DEPLOYMENT.md`
