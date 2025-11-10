# Quick Start Guide - Phase 2 Features

This guide shows you how to use all the new Phase 2 features that were just implemented.

---

## 🎯 For Vendors

### 1. Create Order Bump Promotions

**Location:** `/dashboard/promotions/new`

**Steps:**
1. Click "Create Promotion" button
2. Enter title (e.g., "Add matching accessories")
3. Add description (optional)
4. Select product to promote
5. Choose discount type (Percentage or Fixed)
6. Enter discount value
7. Set conditions (optional):
   - Minimum cart amount
   - Must have specific product in cart
8. Set priority (higher numbers show first)
9. Enable promotion

**Tips:**
- Use compelling titles like "Complete Your Look"
- Test different discount amounts
- Monitor analytics to see what works

### 2. Monitor Low Stock Products

**Location:** `/dashboard` (main dashboard)

**Features:**
- Yellow alert banner appears when products are low
- Shows up to 5 products with images
- Displays available vs. on-hold quantities
- Click "Restock" to edit product

**Tips:**
- Set appropriate lowStockThreshold for each product
- Check dashboard daily
- Restock before reaching zero

### 3. View Abandoned Carts

**API Endpoint:** `/api/dashboard/abandoned-carts`

**Response includes:**
- List of all non-recovered carts
- Customer email and name
- Cart total and item count
- Time created and expiration
- Recovery tokens

**To send manual reminder:**
```bash
POST /api/dashboard/abandoned-carts/[cartId]/send-reminder
```

**Automated emails:**
- Sent automatically 1 hour after abandonment
- Only to carts with email addresses
- Includes full cart preview and recovery link

---

## 🛍️ For Customers

### 1. See Order Bumps at Checkout

**Location:** Checkout page, step 2 (after shipping info)

**Features:**
- Shows recommended products
- Displays savings amount
- Free shipping indicator if applicable
- One-click add to cart
- Updates cart total immediately

### 2. Calculate Shipping in Cart

**Location:** Cart drawer (click cart icon in navigation)

**Steps:**
1. Add items to cart
2. Open cart drawer
3. Click "Calculate shipping"
4. Enter ZIP code
5. Click "Calculate"
6. See all available shipping options

**Options shown:**
- Free Standard Shipping ($50+ orders)
- Standard Shipping (5-7 days)
- Express Shipping (2-3 days)
- Priority Overnight (1 day, $25+ orders)
- Local Pickup (Free)

### 3. Recover Abandoned Cart

**Email sent:** 1 hour after leaving cart

**Email includes:**
- Full cart preview with images
- Total amount
- "Complete Your Purchase" button
- Expiration notice (7 days)

**To recover:**
1. Click link in email
2. Cart automatically restored
3. Complete checkout

---

## 🔧 For Developers

### Environment Variables

Add to `.env`:
```env
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM="Store Name <noreply@yourdomain.com>"

# Cron Security
CRON_SECRET=random_secret_string_here

# Application
NEXT_PUBLIC_APP_URL=https://stores.stepperslife.com
DATABASE_URL=postgresql://...
```

### Cron Job Setup

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/send-abandoned-cart-emails",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Manual Cron** (crontab):
```bash
0 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://stores.stepperslife.com/api/cron/send-abandoned-cart-emails
```

### Database Migrations

Already applied:
```bash
20251109204050_add_order_promotions
20251109205052_add_advanced_stock_management
20251109210448_add_abandoned_carts
```

To rollback if needed:
```bash
npx prisma migrate resolve --rolled-back 20251109210448_add_abandoned_carts
```

### API Endpoints Reference

**Order Bumps:**
- `GET /api/checkout/order-bumps` - Get eligible promotions
- `GET /api/vendor/promotions` - List vendor promotions
- `POST /api/vendor/promotions` - Create promotion
- `PATCH /api/vendor/promotions/[id]` - Update promotion
- `DELETE /api/vendor/promotions/[id]` - Delete promotion
- `POST /api/vendor/promotions/[id]/track` - Track analytics

**Stock Management:**
- Uses `lib/stock-management.ts` functions
- Integrated into order creation/fulfillment/cancellation
- `GET /api/dashboard/inventory/low-stock` - Get low stock items

**Shipping Calculator:**
- `POST /api/shipping/calculate` - Calculate rates by ZIP

**Abandoned Carts:**
- `POST /api/cart/track-abandoned` - Save cart snapshot
- `GET /api/cart/recover?token=xxx` - Restore cart
- `GET /api/dashboard/abandoned-carts` - List carts
- `POST /api/dashboard/abandoned-carts/[id]/send-reminder` - Send email
- `GET /api/cron/send-abandoned-cart-emails` - Automated emails

### Key Functions

**Stock Management** (`lib/stock-management.ts`):
```typescript
import {
  reserveStock,        // Call on order creation
  commitStock,         // Call on fulfillment
  releaseStock,        // Call on cancellation
  checkStockAvailability, // Call before adding to cart
  adjustTotalStock,    // Call when updating inventory
  getLowStockProducts  // Call for alerts
} from '@/lib/stock-management'
```

**Email Sending** (`lib/email.ts`):
```typescript
import { sendAbandonedCartRecovery } from '@/lib/email'

await sendAbandonedCartRecovery({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  storeName: 'My Store',
  cartItems: [...],
  cartTotal: 99.99,
  recoveryUrl: 'https://...',
  expiresIn: '7 days'
})
```

---

## 📊 Analytics & Monitoring

### Order Bump Performance

Check at `/api/vendor/promotions`:
- `displayCount` - Times shown to customers
- `acceptedCount` - Times added to cart
- `revenueAdded` - Total revenue generated
- Conversion rate = acceptedCount / displayCount

### Stock Accuracy

Monitor these fields:
- `quantity` - Total physical inventory
- `quantityAvailable` - Sellable inventory
- `quantityOnHold` - Reserved in pending orders
- `quantityCommitted` - Fulfilled/shipped

Formula: `quantityAvailable = quantity - quantityOnHold - quantityCommitted`

### Cart Recovery Rate

Track at `/api/dashboard/abandoned-carts`:
- Total abandoned carts
- Carts with email vs. without
- Recovery rate = recovered / total
- Revenue recovered

Industry average: 5-15% recovery rate

---

## 🐛 Troubleshooting

### Order Bump Not Showing
- Check promotion status is ACTIVE
- Verify conditions are met (minimum cart amount, products)
- Check priority (higher shows first)
- Ensure product is ACTIVE and in stock

### Stock Not Updating
- Check trackInventory is enabled on product
- Verify order status transitions (PENDING → PAID → SHIPPED)
- Check logs for errors in stock-management functions
- Ensure quantityAvailable is initialized

### Abandoned Cart Emails Not Sending
- Verify RESEND_API_KEY is set
- Check cron job is running hourly
- Verify cart has customer email
- Check reminderSentAt is null (not already sent)
- Look for errors in cron logs

### Shipping Calculator Not Working
- Verify ZIP code format (5 digits or 5+4)
- Check API returns rates successfully
- Test with different ZIP codes (different zones)
- Verify cart has items

---

## 🚀 Performance Tips

### Database Optimization
Indexes are already created for:
- `abandoned_carts`: vendorStoreId, customerEmail, expiresAt
- `order_promotions`: vendorStoreId + status, priority
- `products`: quantityAvailable (for stock checks)

### Caching Strategies
Consider caching:
- Shipping rates by ZIP code (24 hours)
- Order bump rules (5 minutes)
- Low stock products (15 minutes)

### Rate Limiting
Already implemented on:
- `/api/cart/add` - 60 requests/minute
- Other public endpoints follow same pattern

---

## 📚 Additional Resources

- **Full Documentation:** `/PHASE-2-COMPLETE-SUMMARY.md`
- **Validation Checklist:** `/PHASE-2-VALIDATION.md`
- **Stock Management Code:** `/lib/stock-management.ts`
- **Email Template:** `/emails/AbandonedCartRecovery.tsx`

---

## 🎉 Success Metrics

Track these KPIs:
- **Average Order Value (AOV)** - Should increase 10-20% from order bumps
- **Cart Recovery Rate** - Target 5-15% of abandoned carts
- **Stockout Rate** - Should decrease to near 0% with alerts
- **Customer Satisfaction** - Improve with accurate shipping estimates

---

## 💡 Pro Tips

1. **Test promotions** with different discounts to find sweet spot
2. **Set realistic stock thresholds** based on sales velocity
3. **Personalize emails** with customer names for higher recovery
4. **Monitor analytics weekly** and adjust strategies
5. **A/B test promotion titles** to maximize conversion
6. **Use urgency** in abandoned cart emails (expires in X days)
7. **Combine features** - order bumps + free shipping threshold
8. **Keep stock updated** - prevent customer disappointment
9. **Respond to recovered carts** - send thank you or special offer
10. **Track what works** - double down on successful promotions

---

**Need Help?** Check the logs at `/var/log/stores-stepperslife/` or Vercel logs for detailed error messages.

**Want More Features?** See Phase 3 ideas in `/PHASE-2-COMPLETE-SUMMARY.md`
