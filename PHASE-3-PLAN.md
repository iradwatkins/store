# Phase 3 Implementation Plan

## Status: Feature 1 Complete, Remaining 4 Features Planned

---

## ✅ COMPLETED: Feature 1 - Abandoned Cart Dashboard

**Files Created:**
- `app/(vendor)/dashboard/abandoned-carts/page.tsx` - Full dashboard UI
- Updated: `app/api/dashboard/abandoned-carts/route.ts` - Added filtering support

**Features:**
- View all abandoned carts with filters (all/pending/recovered)
- Stats cards showing total, with email, recovered, recovery rate, recovered value
- Send reminder emails manually
- Copy recovery links to clipboard
- Beautiful table view with customer info, cart details, status badges

**Next Step:** Add navigation link to vendor dashboard

---

## 📋 REMAINING FEATURES (Quick Implementation Guide)

### Feature 2: Auto-Discount Codes for Cart Recovery ⏳

**Implementation Plan:**
1. Update `abandoned_carts` schema - add `discountCode` field
2. Create discount code generation function in `lib/discount-codes.ts`
3. Update `app/api/cart/track-abandoned/route.ts` - generate code on cart save
4. Update `emails/AbandonedCartRecovery.tsx` - display discount code
5. Update `app/api/cart/apply-coupon/route.ts` - validate recovery discount codes

**Code Structure:**
```typescript
// lib/discount-codes.ts
export function generateRecoveryCode() {
  return `RECOVER${Math.random().toString(36).substr(2, 8).toUpperCase()}`
}

export async function createRecoveryDiscount(cartId: string) {
  const code = generateRecoveryCode()
  // Create in database with 10% off, 7-day expiry, one-time use
  return code
}
```

**Estimated Time:** 30 minutes

---

### Feature 3: Multiple Reminder Emails (24h/48h) ⏳

**Implementation Plan:**
1. Update `abandoned_carts` schema - add `secondReminderSentAt`, `thirdReminderSentAt`
2. Update `app/api/cron/send-abandoned-cart-emails/route.ts` - check for 24h/48h reminders
3. Create `emails/AbandonedCartReminder2.tsx` and `AbandonedCartReminder3.tsx`
4. Add urgency messaging (increasing with each reminder)

**Email Strategy:**
- **1st Email (1 hour):** Friendly reminder "You left items in your cart"
- **2nd Email (24 hours):** Add urgency + discount code "Don't miss out! 10% off"
- **3rd Email (48 hours):** Final chance "Last chance! Items may sell out"

**Cron Logic:**
```typescript
// Find carts for 2nd reminder (24-25 hours old)
const for2ndReminder = await prisma.abandoned_carts.findMany({
  where: {
    createdAt: { gte: twentyFiveHoursAgo, lte: twentyFourHoursAgo },
    reminderSentAt: { not: null },
    secondReminderSentAt: null,
    isRecovered: false
  }
})

// Similar for 3rd reminder at 48-49 hours
```

**Estimated Time:** 45 minutes

---

###Feature 4: Wishlist System ⏳

**Implementation Plan:**
1. Create `wishlists` table via Prisma migration
2. Create API endpoints:
   - `POST /api/wishlist/add` - Add product to wishlist
   - `DELETE /api/wishlist/remove/[id]` - Remove from wishlist
   - `GET /api/wishlist` - Get user's wishlist
3. Create `app/(storefront)/wishlist/page.tsx` - Wishlist page
4. Add wishlist button to product cards and product detail pages
5. Add wishlist icon to navigation with count badge

**Database Schema:**
```prisma
model wishlists {
  id          String   @id @default(cuid())
  userId      String
  productId   String
  createdAt   DateTime @default(now())

  user     user     @relation(fields: [userId], references: [id], onDelete: Cascade)
  products products @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@index([userId])
  @@map("wishlists")
}
```

**UI Components:**
- Heart icon button (outline when not in wishlist, filled when in wishlist)
- Wishlist page showing all saved products
- "Move to cart" and "Remove" actions
- Share wishlist functionality

**Estimated Time:** 1.5 hours

---

### Feature 5: Product Compare Feature ⏳

**Implementation Plan:**
1. Create client-side compare state (localStorage or context)
2. Create `app/(storefront)/compare/page.tsx` - Comparison table
3. Add "Compare" checkbox to product cards
4. Create compare floating bar (shows selected products)
5. Build comparison table showing specs side-by-side

**Features:**
- Compare up to 4 products at once
- Side-by-side comparison table
- Compare: Price, Variants, Description, Ratings, Stock
- Add to cart from comparison page
- Clear all / Remove individual products

**UI Structure:**
```
┌─────────────────────────────────────────────┐
│ Compare Products (3/4)                      │
├─────────┬─────────┬─────────┬─────────┐
│ Product │ Product │ Product │  Empty  │
│   #1    │   #2    │   #3    │  Slot   │
├─────────┼─────────┼─────────┼─────────┤
│ Price   │ $29.99  │ $39.99  │ $24.99  │
│ Rating  │ 4.5⭐   │ 4.8⭐   │ 4.2⭐   │
│ Stock   │ In Stock│ Low     │ In Stock│
│ Variants│ 3       │ 5       │ 2       │
└─────────┴─────────┴─────────┴─────────┘
```

**Estimated Time:** 2 hours

---

## 🎯 Implementation Priority

**Session 1 (Current):**
- ✅ Feature 1: Abandoned Cart Dashboard (DONE)

**Session 2 (Next - Quick Wins):**
- Feature 2: Auto-Discount Codes (~30 min)
- Feature 3: Multiple Reminder Emails (~45 min)

**Session 3 (Customer Features):**
- Feature 4: Wishlist System (~1.5 hours)
- Feature 5: Product Compare (~2 hours)

---

## 📊 Expected Business Impact

### Revenue Impact:
- **Abandoned Cart Dashboard:** Better vendor visibility → 5-10% more manual recoveries
- **Auto-Discount Codes:** 10-15% increase in cart recovery rate
- **Multiple Reminders:** Additional 5-10% recovery from follow-ups
- **Wishlist:** 20-30% of wishlist items convert to purchases
- **Product Compare:** 5-10% increase in conversion (buyers make informed decisions)

### Customer Experience:
- Discount codes reduce friction for abandoned cart recovery
- Wishlist allows purchase planning
- Compare helps decision-making for similar products
- Multiple reminders catch customers at right time

---

## 🔧 Technical Requirements

### New Database Tables Needed:
```prisma
// For Wishlist
model wishlists {
  id          String   @id @default(cuid())
  userId      String
  productId   String
  createdAt   DateTime @default(now())
  @@unique([userId, productId])
}

// For Discount Codes (if not using existing coupons table)
model recovery_discounts {
  id               String   @id @default(cuid())
  code             String   @unique
  abandonedCartId  String   @unique
  discountPercent  Int      @default(10)
  expiresAt        DateTime
  used             Boolean  @default(false)
  usedAt           DateTime?
  createdAt        DateTime @default(now())
}
```

### Schema Updates:
```prisma
model abandoned_carts {
  // ... existing fields
  discountCode          String?
  secondReminderSentAt  DateTime?
  thirdReminderSentAt   DateTime?
}
```

### Environment Variables:
No new environment variables needed - using existing email and database setup.

---

## 📝 Testing Checklist

### Feature 1 (Dashboard) - To Test:
- [ ] Visit `/dashboard/abandoned-carts` as vendor
- [ ] Verify stats cards show correct data
- [ ] Test filter buttons (all/pending/recovered)
- [ ] Send manual reminder email
- [ ] Copy recovery link and verify it works
- [ ] Check responsive design on mobile

### Feature 2 (Discount Codes) - To Test:
- [ ] Abandon cart with email
- [ ] Receive email with discount code
- [ ] Use discount code at checkout
- [ ] Verify code is single-use
- [ ] Verify code expires after 7 days

### Feature 3 (Multiple Reminders) - To Test:
- [ ] Abandon cart and wait 1 hour (1st email)
- [ ] Wait 24 hours (2nd email with urgency)
- [ ] Wait 48 hours (3rd email with final chance)
- [ ] Verify emails have different messaging
- [ ] Verify no 4th email sent

### Feature 4 (Wishlist) - To Test:
- [ ] Add product to wishlist (heart icon)
- [ ] View wishlist page
- [ ] Move item from wishlist to cart
- [ ] Remove item from wishlist
- [ ] Verify wishlist persists across sessions
- [ ] Test wishlist icon badge count

### Feature 5 (Compare) - To Test:
- [ ] Select 2-4 products to compare
- [ ] View comparison page
- [ ] Verify specs shown side-by-side
- [ ] Add product to cart from comparison
- [ ] Remove product from comparison
- [ ] Clear all comparisons

---

## 🚀 Deployment Strategy

### Immediate (Feature 1 Dashboard):
1. Add navigation link to vendor dashboard layout
2. Restart application
3. Test in production

### Phase 3a (Discount + Reminders):
1. Run Prisma migration for schema updates
2. Deploy discount code and reminder features
3. Update cron job with new reminder logic
4. Monitor email delivery

### Phase 3b (Wishlist + Compare):
1. Run Prisma migration for wishlists table
2. Deploy wishlist and compare features
3. Add navigation links
4. Monitor usage analytics

---

## 💡 Future Enhancements (Phase 4)

1. **Wishlist Sharing** - Share wishlist via link
2. **Price Drop Alerts** - Notify when wishlist item goes on sale
3. **Wishlist to Registry** - Convert wishlist to gift registry
4. **Advanced Compare** - Compare reviews, shipping times, seller ratings
5. **Compare History** - Save previous comparisons
6. **Export Comparison** - PDF export of comparison table
7. **Smart Recommendations** - AI suggests products to add to comparison
8. **Wishlist Analytics** - Track most wishlisted products for vendors

---

## 📚 Documentation to Create

1. **Vendor Guide:** How to use abandoned cart dashboard
2. **Customer Guide:** How to use wishlist and compare
3. **API Documentation:** New endpoints reference
4. **Email Templates Guide:** Customizing recovery emails

---

## Current Status: **READY TO CONTINUE**

- Feature 1 complete and ready for testing
- Remaining 4 features have clear implementation plans
- Estimated total time: ~5 hours for all features
- All features are production-ready designs

**Next Command:** Implement Features 2 & 3 (discount codes + multiple reminders)

