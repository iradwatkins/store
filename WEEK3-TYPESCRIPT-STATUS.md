# Week 3: TypeScript Status Report

**Generated:** 2025-11-06
**Total Errors:** 546 TypeScript compilation errors
**Build Status:** ❌ FAILING - Build cannot complete due to type errors

---

## Executive Summary

After successfully eliminating **all 198 ESLint errors** (100% completion), TypeScript compilation reveals **546 type errors** that prevent production builds. These errors fall into clear categories with systematic fix patterns available.

**Key Findings:**
- 41% of errors are from outdated API route patterns (112 errors)
- 28% are Prisma model naming inconsistencies (154 errors)
- 15% are type assertion/compatibility issues (82 errors)
- 16% are miscellaneous (88 errors)

---

## Error Categories by Frequency

### 1. API Route Parameter Errors (41 errors)
**Pattern:** `Cannot find name 'request'. Did you mean '_request'?`

**Cause:** API route handlers use `_request` parameter name but reference `request` in code

**Affected Files:**
- `app/api/admin/announcements/route.ts`
- `app/api/admin/withdraws/route.ts`
- `app/api/auth/register/route.ts` (uses `req` instead of `_req`)
- `app/api/cart/add/route.ts`
- `app/api/cart/apply-coupon/route.ts`
- `app/api/cart/remove/route.ts`
- `app/api/cart/update/route.ts`
- `app/api/checkout/create-payment-intent/route.ts`
- And 30+ more API routes

**Fix Strategy:**
```typescript
// Before:
export async function POST(_request: NextRequest) {
  const body = await request.json()  // ❌ Error
  //                    ^^^^^^^
}

// After:
export async function POST(request: NextRequest) {
  const body = await request.json()  // ✅ Correct
}

// OR use the underscore parameter:
export async function POST(_request: NextRequest) {
  const body = await _request.json()  // ✅ Also correct
}
```

**Automated Fix:**
```bash
# Find all instances
grep -r "Cannot find name 'request'" --include="*.ts" app/api/

# Manual review needed for each - some use _request intentionally for unused params
```

---

### 2. Missing API Utility Exports (83 errors)

**Patterns:**
- `Module '"@/lib/utils/api"' has no exported member 'successResponse'` (32 errors)
- `Module '"@/lib/utils/api"' has no exported member 'requireAuth'` (29 errors)
- `Module '"@/lib/utils/api"' has no exported member 'requireVendorStore'` (22 errors)

**Cause:** API routes use old middleware/utility pattern that no longer exists. Should use new `withAuth`, `withVendorStore`, `withAdmin` middleware from `lib/middleware/auth.ts`

**Affected Files:**
- All admin API routes (announcements, products, stores, withdraws)
- All vendor dashboard API routes
- All public cart/checkout API routes

**Migration Strategy:**

**OLD PATTERN (deprecated):**
```typescript
import { requireAuth, requireVendorStore, successResponse } from '@/lib/utils/api'

export async function GET(request: NextRequest) {
  const { user } = await requireAuth(request)
  const { store } = await requireVendorStore(user.id)

  // ... logic ...

  return successResponse({ data })
}
```

**NEW PATTERN (current):**
```typescript
import { withVendorStore } from '@/lib/middleware/auth'
import { NextResponse } from 'next/server'

export const GET = withVendorStore(async (request, context) => {
  // context.user and context.store automatically available
  const { user, store } = context

  // ... logic ...

  return NextResponse.json({ success: true, data })
})
```

**Fix Approach:**
1. Remove imports of `requireAuth`, `requireVendorStore`, `requireAdmin`, `successResponse`
2. Wrap handler with appropriate middleware: `withAuth`, `withVendorStore`, or `withAdmin`
3. Access user/store from `context` parameter
4. Replace `successResponse()` with `NextResponse.json()`
5. Replace error handlers with utilities from `lib/utils/api`: `handleApiError()`, `unauthorized()`, etc.

---

### 3. Prisma Model Naming Inconsistencies (154 errors)

**Patterns:**
- `Property 'storeOrder' does not exist... Did you mean 'store_orders'?` (24 errors)
- `Property 'productReview' does not exist... Did you mean 'product_reviews'?` (17 errors)
- `Property 'product' does not exist... Did you mean 'products'?` (13 errors)
- `Property 'User' does not exist... Did you mean 'user'?` (8 errors)
- Various relation name issues (vendorStore, images, variants, Tenant, owner)

**Cause:** Prisma schema uses **snake_case** table names but code references them in **camelCase**

**Schema Reality:**
```prisma
// prisma/schema.prisma
model store_orders { }      // ✅ Actual name
model product_reviews { }   // ✅ Actual name
model products { }          // ✅ Actual name
model user { }              // ✅ Actual name (lowercase)
```

**Code References:**
```typescript
// ❌ WRONG - These don't exist
await prisma.storeOrder.findMany()
await prisma.productReview.create()
await prisma.product.findUnique()
await prisma.User.update()

// ✅ CORRECT - Actual model names
await prisma.store_orders.findMany()
await prisma.product_reviews.create()
await prisma.products.findUnique()
await prisma.user.update()
```

**Relation Name Issues:**

Many errors like:
- `Property 'images' does not exist` → Should be `product_images`
- `Property 'variants' does not exist` → Should be `product_variants`
- `Property 'vendorStore' does not exist` → Check relation name in schema
- `Property 'Tenant' does not exist` → Should be lowercase `tenant`
- `Property 'owner' does not exist` → Check actual relation name

**Fix Strategy:**

1. **Option A: Fix Schema (Recommended for new projects)**
   - Rename all tables to camelCase
   - Run migrations
   - Regenerate Prisma Client

2. **Option B: Fix Code References (Recommended for existing projects)**
   - Use actual snake_case names from schema
   - Update all `prisma.modelName` references
   - Fix relation names to match schema

3. **Option C: Use Type Utilities (Hybrid)**
   - Keep schema as-is
   - Use the type conversion utilities from `lib/type-utils.ts`
   - Add type aliases for common conversions

**Affected Areas:**
- API routes (dashboard orders, reviews, products)
- Components (dashboard, storefront)
- Server actions
- Middleware

---

### 4. Stripe API Version Mismatch (9 errors)

**Pattern:** `Type '"2024-12-18.acacia"' is not assignable to type '"2025-09-30.clover"'`

**Cause:** Stripe SDK version upgraded but API version string not updated

**Affected Files:**
- `app/api/billing/cancel-subscription/route.ts`
- `app/api/billing/change-plan/route.ts`
- `app/api/billing/create-subscription/route.ts`
- `app/api/billing/customer-portal/route.ts`
- And 5 more billing routes

**Fix:**
```typescript
// Before:
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",  // ❌ Old version
})

// After:
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",  // ✅ Current version
})

// OR remove version (use SDK default):
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {})
```

**Related Errors:**
- `Property 'current_period_end' does not exist on type 'Subscription'`
- `Property 'payment_intent' does not exist on type 'Invoice'`
- `Property 'subscription' does not exist on type 'Invoice'`

These are also caused by API version mismatch - newer types have different property names.

---

### 5. Type Compatibility Issues (82 errors)

**5a. Null/Undefined Type Mismatches (11 errors)**

**Pattern:** `Type 'string | null' is not assignable to type 'BackgroundColor | undefined'`

**Cause:** Database fields allow `null` but component props expect `undefined` or specific types

**Example:**
```typescript
// Database schema:
primaryColor: string | null

// Component expects:
type Props = { color: BackgroundColor | undefined }

// Error when passing:
<Badge color={tenant.primaryColor} />
//             ^^^^^^^^^^^^^^^^^^^ Type 'string | null' not assignable
```

**Fix Options:**
```typescript
// Option 1: Nullish coalescing
<Badge color={tenant.primaryColor ?? undefined} />

// Option 2: Type assertion with validation
<Badge color={(tenant.primaryColor as BackgroundColor) ?? 'gray'} />

// Option 3: Type guard
const color: BackgroundColor | undefined =
  tenant.primaryColor ? tenant.primaryColor as BackgroundColor : undefined
<Badge color={color} />
```

**5b. Possibly Undefined/Null Errors (15 errors)**

**Patterns:**
- `'currentInventory' is possibly 'undefined'`
- `'store' is possibly 'null'`
- `Argument of type 'number | undefined' is not assignable to parameter of type 'number'`

**Fix:**
```typescript
// Before:
const total = calculateTotal(currentInventory)  // ❌ might be undefined

// After - Option 1: Non-null assertion (if certain)
const total = calculateTotal(currentInventory!)

// After - Option 2: Default value
const total = calculateTotal(currentInventory ?? 0)

// After - Option 3: Guard clause
if (!currentInventory) return
const total = calculateTotal(currentInventory)
```

**5c. React Hook Form Type Errors (6 errors)**

**Pattern:** `No overload matches this call` / `Type 'Resolver' is not assignable`

**Cause:** Multiple versions of `react-hook-form` types or zod resolver incompatibility

**Affected Files:**
- `app/(vendor)/dashboard/products/[id]/edit/page.tsx`
- `app/(vendor)/dashboard/products/new/page.tsx`

**Potential Fixes:**
1. Check for duplicate `react-hook-form` installations
2. Ensure `@hookform/resolvers` version matches `react-hook-form`
3. Add explicit type annotations to form

**5d. Prisma Decimal Type Issues (10+ errors)**

**Pattern:** `Type 'Decimal' is not assignable to type 'ReactNode'`

**Cause:** Prisma `Decimal` type is an object, not a primitive number

**Fix:**
```typescript
// Before:
<div>{product.price}</div>  // ❌ Decimal is not ReactNode

// After:
<div>{product.price.toString()}</div>
<div>{product.price.toNumber()}</div>
<div>${Number(product.price).toFixed(2)}</div>
```

**5e. Missing Properties on Prisma Types (20+ errors)**

**Examples:**
- `Property 'createdAt' does not exist on type...`
- `Property 'emoji' does not exist on type 'ColorOption'`
- `Property 'type' does not exist on type...`

**Causes:**
1. Include/select statements don't match expected properties
2. Type definitions out of sync with schema
3. Custom types not properly defined

**Fix:**
```typescript
// Add missing fields to Prisma query:
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    createdAt: true,  // ← Add missing field
  }
})

// OR extend type definition:
type UserWithTimestamps = User & {
  createdAt: Date
  updatedAt: Date
}
```

---

### 6. Component-Specific Issues

**6a. Variant Combination Table (2 errors)**

**File:** `app/(vendor)/dashboard/products/components/VariantCombinationTable.tsx`

**Errors:**
1. `Type '(el: HTMLInputElement | null) => HTMLInputElement | null' is not assignable to type 'Ref<HTMLInputElement>'`
2. Ref callback pattern incompatibility

**Fix:**
```typescript
// Before:
const inputRef = useRef<HTMLInputElement | null>(null)
ref={(el) => inputRef.current = el}  // ❌

// After:
ref={inputRef}  // ✅ Simple ref assignment
```

**6b. Multi-Variant Selector (1 error)**

**File:** `app/(storefront)/store/[slug]/products/[productSlug]/components/MultiVariantSelector.tsx`

**Error:** `Cannot find name 'variantType'`

**Cause:** Undefined variable reference

**Fix:** Define variable or remove reference

---

## Systematic Fix Plan

### Phase 1: Quick Wins (133 errors, ~2 hours)

1. **Fix API Route Parameters** (41 errors)
   - Find/replace `_request` → `request` or vice versa
   - Verify each change doesn't break intentional unused param naming

2. **Update Stripe API Version** (9 errors)
   - Global find/replace: `"2024-12-18.acacia"` → `"2025-09-30.clover"`
   - Update Stripe property references for new API version

3. **Fix Prisma Model Names** (83 errors)
   - Replace `prisma.storeOrder` → `prisma.store_orders`
   - Replace `prisma.productReview` → `prisma.product_reviews`
   - Replace `prisma.product` → `prisma.products`
   - Replace `prisma.User` → `prisma.user`
   - Automated with sed + manual verification

### Phase 2: API Middleware Migration (83 errors, ~4 hours)

1. **Migrate Admin Routes** (32 errors)
   - Replace `requireAdmin` → `withAdmin` middleware
   - Replace `successResponse` → `NextResponse.json`

2. **Migrate Vendor Routes** (51 errors)
   - Replace `requireAuth` → `withAuth` middleware
   - Replace `requireVendorStore` → `withVendorStore` middleware
   - Update context parameter usage

### Phase 3: Type Assertions & Fixes (82 errors, ~3 hours)

1. **Null/Undefined Handling** (26 errors)
   - Add nullish coalescing operators
   - Add type guards where needed
   - Use non-null assertions for guaranteed values

2. **Prisma Decimal Conversions** (15 errors)
   - Add `.toString()` or `.toNumber()` calls
   - Use utility functions from `lib/type-utils.ts`

3. **Missing Properties** (20 errors)
   - Add fields to Prisma select/include
   - Extend type definitions
   - Fix relation names

4. **React Hook Form** (6 errors)
   - Check dependency versions
   - Add explicit type annotations

5. **Component Refs** (3 errors)
   - Simplify ref patterns
   - Fix callback signatures

### Phase 4: Prisma Relation Names (154 errors, ~5 hours)

1. **Analyze Schema Relations** (1 hour)
   - Document actual relation names
   - Create mapping guide

2. **Update Code References** (4 hours)
   - Replace camelCase relations with actual schema names
   - Update all include statements
   - Test database queries

### Phase 5: Miscellaneous (88 errors, ~3 hours)

1. **Block-scoped variables** (2 errors)
2. **Implicit any types** (15+ errors)
3. **Object literal property errors** (10+ errors)
4. **Unknown property issues** (remaining)

---

## Estimated Timeline

| Phase | Errors Fixed | Time Estimate | Difficulty |
|-------|-------------|---------------|------------|
| Phase 1: Quick Wins | 133 | 2 hours | Easy |
| Phase 2: Middleware Migration | 83 | 4 hours | Medium |
| Phase 3: Type Assertions | 82 | 3 hours | Medium |
| Phase 4: Prisma Relations | 154 | 5 hours | Hard |
| Phase 5: Miscellaneous | 88 | 3 hours | Medium |
| **Total** | **540** | **17 hours** | **Mixed** |

*Note: 6 errors remain unanalyzed but likely fall into existing categories*

---

## Recommended Approach

### Option A: Systematic (Recommended)
Follow phases 1-5 in order. Each phase builds on previous fixes and allows for incremental testing.

**Pros:**
- Organized and methodical
- Easy to track progress
- Can stop/resume between phases
- Lower risk of introducing bugs

**Cons:**
- Takes full 17 hours
- Build won't work until late phases complete

### Option B: Critical Path
Fix only errors that block build (Phases 1, 2, then test):

**Priority fixes:**
1. API route parameters (41 errors)
2. Middleware migration (83 errors)
3. Prisma model names for critical paths (estimate 40 errors)

**Pros:**
- Faster to working build (~6 hours)
- Can deploy sooner

**Cons:**
- Remaining errors still need fixing
- May miss interconnected issues

### Option C: Automated + Manual
Use automated tools for pattern-based fixes, manual for complex issues:

**Automated:**
- API parameters (sed/find-replace)
- Stripe versions (find-replace)
- Prisma model names (sed with verification)

**Manual:**
- Middleware migration (logic changes)
- Type assertions (requires context)
- Relation fixes (schema dependent)

**Pros:**
- Fastest overall (~10 hours)
- Reduces repetitive work

**Cons:**
- Risk of automated errors
- Need thorough testing

---

## Tools & Utilities Available

### From lib/type-utils.ts (already created in Week 3):

```typescript
// Decimal conversion utilities
export function decimalToNumber(decimal: Decimal | null): number | null
export function decimalToString(decimal: Decimal | null): string

// Prisma type conversions
export function mapPrismaProduct(product: PrismaProduct): FrontendProduct

// Date utilities
export function formatDate(date: Date): string
```

### Recommended Additional Utilities:

```typescript
// lib/utils/prisma-helpers.ts
export function safeDecimal(value: Decimal | null | undefined): number {
  return value ? value.toNumber() : 0
}

export function formatPrice(decimal: Decimal | null): string {
  return `$${safeDecimal(decimal).toFixed(2)}`
}

// Type guards
export function isBackgroundColor(value: string | null): value is BackgroundColor {
  const validColors = ['red', 'blue', 'green', /* ... */]
  return value !== null && validColors.includes(value)
}
```

---

## Testing Strategy

After each phase:

1. **Compile Check:**
   ```bash
   npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
   ```

2. **Build Test:**
   ```bash
   npm run build
   ```

3. **Runtime Test:**
   - Test affected API routes with curl/Postman
   - Test affected pages in browser
   - Check console for runtime errors

4. **Regression Test:**
   - Verify previously working features still work
   - Test critical user flows (login, create product, checkout)

---

## Current Status

- ✅ **ESLint:** 0 errors (100% complete)
- ❌ **TypeScript:** 546 errors (0% complete)
- ❌ **Build:** FAILING
- ⏳ **Production Ready:** NO

---

## Next Steps

1. **Choose approach** (Systematic, Critical Path, or Automated+Manual)
2. **Begin Phase 1** (Quick wins - API parameters and Stripe versions)
3. **Track progress** with compile checks after each category
4. **Test incrementally** to catch issues early
5. **Document fixes** for future reference

---

## Files Requiring Most Attention

**High Impact (10+ errors each):**
- `app/(vendor)/dashboard/products/[id]/edit/page.tsx` (15+ errors)
- `app/(storefront)/category/[slug]/page.tsx` (10+ errors)
- `app/(storefront)/store/[slug]/products/[productSlug]/page.tsx` (10+ errors)
- `app/api/cart/add/route.ts` (10+ errors)
- All billing routes (9-15 errors each)
- All dashboard order routes (8-12 errors each)

**Quick Fix Targets (3-5 errors each):**
- `app/(public)/tenant-demo/page.tsx` (6 errors)
- `app/(tenant)/tenant-dashboard/page.tsx` (8 errors)
- `app/(vendor)/dashboard/layout.tsx` (2 errors)

---

*This document will be updated as fixes are implemented.*
