# Quick Verification Checklist

Run through this checklist to verify the onboarding fix is working correctly.

## 1. Verify Files Exist

```bash
# Check all modified/created files exist
ls -la app/(vendor)/create-store/page.tsx
ls -la app/(vendor)/store-created/page.tsx
ls -la app/(vendor)/dashboard/page.tsx
ls -la app/(storefront)/account/page.tsx
ls -la components/navigation.tsx
ls -la lib/auth.ts
```

## 2. Check Create Store Page

**What to verify:**
- [ ] Step 3 title says "Payment Setup (Optional)"
- [ ] Two buttons visible: Green "Skip for Now" and Indigo "Setup Payments"
- [ ] Blue info box explains optional setup
- [ ] Green box shows "What happens next?"

**How to test:**
```
1. Go to /create-store
2. Fill out Step 1 and Step 2
3. Check Step 3 for the above elements
```

## 3. Check Success Page Renders

**What to verify:**
- [ ] Page exists at `/store-created`
- [ ] Shows congratulations message
- [ ] Displays store URL
- [ ] Shows "What's Next?" section
- [ ] Has action buttons

**How to test:**
```
1. Navigate to /store-created (manually or after creating store)
2. Check for success checkmark icon
3. Verify action cards are visible
```

## 4. Check Dashboard Banners

**What to verify:**
- [ ] Welcome banner shows for new vendors (0 products, no Stripe)
- [ ] Product reminder shows (has Stripe, 0 products)
- [ ] Stripe banner shows (has products, no Stripe)
- [ ] No banner shows (all complete)

**How to test:**
```
1. Create new store, skip Stripe
2. Go to /dashboard
3. Verify large gradient welcome banner appears
```

## 5. Check Navigation Links

**What to verify:**
- [ ] Desktop dropdown shows "Vendor" badge
- [ ] "Vendor Dashboard" link appears for vendors
- [ ] "My Products" and "My Orders" links present
- [ ] Mobile menu shows "Vendor Dashboard"

**How to test:**
```
Desktop:
1. Create store as user
2. Hover over user avatar (top-right)
3. Check dropdown for vendor links

Mobile:
1. Resize browser to mobile
2. Click hamburger menu
3. Check for "Vendor Dashboard" link
```

## 6. Check Account Page

**What to verify:**
- [ ] Green success banner appears for vendors
- [ ] "Go to Vendor Dashboard" button works
- [ ] Sidebar shows vendor dashboard link

**How to test:**
```
1. Go to /account as vendor
2. Check for green gradient banner at top
3. Click "Go to Vendor Dashboard" button
4. Verify sidebar has vendor link
```

## 7. Verify Session Updates

**What to verify:**
- [ ] User role becomes "STORE_OWNER" after creation
- [ ] vendorStore object appears in session
- [ ] Navigation updates to show vendor links
- [ ] Can access /dashboard without error

**How to test:**
```
1. Open browser DevTools
2. Create new store
3. After creation, check session in Application > Storage
4. Look for user object with role: "STORE_OWNER"
5. Verify vendorStore object exists with id, slug, name
```

## 8. Test Complete Flow (Skip Stripe)

**Steps:**
1. Login as regular user
2. Go to /create-store
3. Complete Step 1 (Store Details)
4. Complete Step 2 (Contact & Shipping)
5. Click "Skip for Now - Add Products First"
6. Verify redirect to /store-created?setup=skipped
7. Check blue banner says "Payment setup skipped"
8. Click "Add Product Now"
9. Verify redirect to /dashboard/products/new
10. Return to /dashboard
11. Check welcome banner appears
12. Hover over avatar, check vendor links appear

**Expected result:** ✅ All steps complete without errors

## 9. Test Complete Flow (Setup Stripe)

**Steps:**
1. Login as regular user
2. Go to /create-store
3. Complete Step 1 and Step 2
4. Click "Create Store & Setup Payments Now"
5. Verify redirect to Stripe (if configured)
6. OR verify redirect to /store-created if Stripe not configured
7. Check success messaging
8. Verify can access dashboard

**Expected result:** ✅ Flow completes appropriately

## 10. Test Error Handling

**Test Cases:**
- [ ] Try creating second store (should show error)
- [ ] Try accessing /dashboard without store (should redirect)
- [ ] Try incomplete form submission (should validate)
- [ ] Test with invalid slug format (should reject)

## Quick Smoke Test Commands

```bash
# 1. Check if build succeeds
cd /root/websites/stores-stepperslife
npm run build

# 2. Start dev server
npm run dev

# 3. In another terminal, check if pages are accessible
curl -I http://localhost:3001/create-store
curl -I http://localhost:3001/store-created
curl -I http://localhost:3001/dashboard
curl -I http://localhost:3001/account

# All should return 200 or 307 (redirect)
```

## Console Log Verification

After creating a store, check browser console for:
```
✅ User [userId] upgraded to STORE_OWNER role
Store created: [slug] by user [userId]
Welcome email sent to [email]
```

## Database Verification

```bash
# Check if store was created
npx prisma studio

# Look for:
# 1. User record with role: "STORE_OWNER"
# 2. VendorStore record with userId matching user
# 3. Store record in registry
```

## Common Issues & Solutions

### Issue: Navigation doesn't show vendor links
**Solution:**
- Check session contains vendorStore object
- Try refreshing page (hard refresh: Cmd+Shift+R)
- Verify auth.ts was updated correctly

### Issue: Can't access dashboard
**Solution:**
- Check user role is STORE_OWNER
- Verify store record exists in database
- Check for console errors

### Issue: Success page shows "Store not found"
**Solution:**
- Check API endpoint /api/vendor/stores returns data
- Verify session is valid
- Check database for store record

### Issue: Skip button doesn't work
**Solution:**
- Check browser console for errors
- Verify handleFinalSubmit function accepts skipStripe parameter
- Check API response

## Final Verification

After completing all checks, confirm:
- ✅ Can create store successfully
- ✅ Can skip Stripe setup
- ✅ Success page displays correctly
- ✅ Can access dashboard multiple ways
- ✅ Navigation shows vendor links
- ✅ Dashboard guides next steps
- ✅ No console errors
- ✅ Mobile responsive

## Success Criteria

**The fix is working if:**
1. User creates store without confusion
2. Finds dashboard easily after creation
3. Understands next steps clearly
4. Can skip Stripe and add products first
5. All vendor UI elements appear correctly

## Report Issues

If any check fails:
1. Note which step failed
2. Capture error messages
3. Check browser console
4. Verify database state
5. Review relevant code file

## Quick Fix Commands

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Restart dev server
pkill -f "next dev"
npm run dev

# Check for TypeScript errors in our files only
npx tsc --noEmit app/(vendor)/create-store/page.tsx
npx tsc --noEmit app/(vendor)/store-created/page.tsx
npx tsc --noEmit components/navigation.tsx
```

---

**Last Updated:** 2025-10-13
**Fix Version:** 1.0.0
**Status:** Ready for Testing
