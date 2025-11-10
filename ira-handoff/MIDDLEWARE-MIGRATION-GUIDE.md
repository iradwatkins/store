# API Middleware Migration Guide

**Status:** 109 routes need migration
**Complexity:** HIGH - Requires logic restructuring
**Estimated Time:** 3-4 hours for complete migration

---

## Overview

The application needs to migrate from the old inline auth pattern to the new middleware wrapper pattern.

**Old Pattern (Deprecated):**
```typescript
import { requireAuth, requireVendorStore, requireAdmin, successResponse } from '@/lib/utils/api'

export async function GET(request: NextRequest) {
  const { user, store } = await requireVendorStore(request)

  const data = await prisma.products.findMany({
    where: { vendorStoreId: store.id }
  })

  return successResponse({ data })
}
```

**New Pattern (Required):**
```typescript
import { withVendorStore, VendorContext } from '@/lib/middleware/auth'
import { NextResponse } from 'next/server'

export const GET = withVendorStore(async (request, context) => {
  const { user, store } = context

  const data = await prisma.products.findMany({
    where: { vendorStoreId: store.id }
  })

  return NextResponse.json({ success: true, data })
})
```

---

## Why Migrate?

1. **Better Type Safety:** Middleware provides typed context
2. **Error Handling:** Centralized error handling in middleware
3. **Logging:** Automatic request logging with request IDs
4. **Consistency:** All routes use same pattern
5. **Maintainability:** Less boilerplate per route

---

## Migration Steps

### Step 1: Identify Auth Pattern

Determine which middleware the route needs:

| Old Function | New Middleware | Context Type |
|--------------|----------------|--------------|
| `requireAuth()` | `withAuth` | `AuthenticatedContext` |
| `requireVendorStore()` | `withVendorStore` | `VendorContext` |
| `requireAdmin()` | `withAdmin` | `AdminContext` |

### Step 2: Update Imports

**Before:**
```typescript
import {
  requireAdmin,
  requireAuth,
  requireVendorStore,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
```

**After:**
```typescript
import { withAdmin, withAuth, withVendorStore } from "@/lib/middleware/auth"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/utils/api"
```

### Step 3: Convert Function Signature

**Before:**
```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // ...
}
```

**After:**
```typescript
export const GET = withAuth(async (request, context) => {
  const { params } = context
  // ...
})
```

**After (with TypeScript):**
```typescript
import type { AuthenticatedContext } from "@/lib/middleware/auth"

export const GET = withAuth(async (
  request: NextRequest,
  context: AuthenticatedContext & { params: { id: string } }
) => {
  const { params } = context
  // ...
})
```

### Step 4: Remove requireX() Calls

**Before:**
```typescript
export async function GET(request: NextRequest) {
  const { user, store } = await requireVendorStore(request)
  // ...
}
```

**After:**
```typescript
export const GET = withVendorStore(async (request, context) => {
  const { user, store } = context
  // ...
})
```

### Step 5: Replace successResponse()

**Before:**
```typescript
return successResponse({ data })
return successResponse({ data, message: "Success" })
```

**After:**
```typescript
return NextResponse.json({ success: true, data })
return NextResponse.json({ success: true, data, message: "Success" })
```

### Step 6: Update Error Handling

**Before:**
```typescript
try {
  // ...
} catch (error) {
  return handleApiError(error)
}
```

**After:**
```typescript
try {
  // ...
} catch (error) {
  return handleApiError(error, context.requestId)
}
```

### Step 7: Access params from Context

**Before:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
}
```

**After:**
```typescript
export const GET = withAuth(async (request, context) => {
  const { id } = context.params as { id: string }
  // OR
  const id = (context.params as { id: string }).id
})
```

---

## Complete Examples

### Example 1: Simple Admin Route

**File:** `app/api/admin/announcements/route.ts`

**BEFORE:**
```typescript
import { NextRequest } from "next/server"
import { requireAdmin, handleApiError, successResponse } from "@/lib/utils/api"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const announcements = await prisma.announcements.findMany({
      orderBy: { createdAt: "desc" }
    })

    return successResponse({ announcements })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()

    const announcement = await prisma.announcements.create({
      data: body
    })

    return successResponse({ announcement })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**AFTER:**
```typescript
import { NextRequest, NextResponse } from "next/server"
import { withAdmin } from "@/lib/middleware/auth"
import { handleApiError } from "@/lib/utils/api"
import prisma from "@/lib/db"

export const GET = withAdmin(async (request, context) => {
  try {
    const announcements = await prisma.announcements.findMany({
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ success: true, announcements })
  } catch (error) {
    return handleApiError(error, context.requestId)
  }
})

export const POST = withAdmin(async (request, context) => {
  try {
    const body = await request.json()

    const announcement = await prisma.announcements.create({
      data: body
    })

    return NextResponse.json({ success: true, announcement })
  } catch (error) {
    return handleApiError(error, context.requestId)
  }
})
```

---

### Example 2: Vendor Route with Params

**File:** `app/api/vendor/products/[id]/route.ts`

**BEFORE:**
```typescript
import { NextRequest } from "next/server"
import { requireVendorStore, handleApiError, successResponse } from "@/lib/utils/api"
import prisma from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { store } = await requireVendorStore(request)

    const product = await prisma.products.findFirst({
      where: {
        id: params.id,
        vendorStoreId: store.id
      }
    })

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return successResponse({ product })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { store } = await requireVendorStore(request)

    await prisma.products.deleteMany({
      where: {
        id: params.id,
        vendorStoreId: store.id
      }
    })

    return successResponse({ message: "Product deleted" })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**AFTER:**
```typescript
import { NextRequest, NextResponse } from "next/server"
import { withVendorStore } from "@/lib/middleware/auth"
import { handleApiError } from "@/lib/utils/api"
import prisma from "@/lib/db"

export const GET = withVendorStore(async (request, context) => {
  try {
    const { store, params } = context
    const { id } = params as { id: string }

    const product = await prisma.products.findFirst({
      where: {
        id,
        vendorStoreId: store.id
      }
    })

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, product })
  } catch (error) {
    return handleApiError(error, context.requestId)
  }
})

export const DELETE = withVendorStore(async (request, context) => {
  try {
    const { store, params } = context
    const { id } = params as { id: string }

    await prisma.products.deleteMany({
      where: {
        id,
        vendorStoreId: store.id
      }
    })

    return NextResponse.json({ success: true, message: "Product deleted" })
  } catch (error) {
    return handleApiError(error, context.requestId)
  }
})
```

---

### Example 3: Auth Route (Simple)

**File:** `app/api/dashboard/analytics/route.ts`

**BEFORE:**
```typescript
import { NextRequest } from "next/server"
import { requireAuth, handleApiError, successResponse } from "@/lib/utils/api"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    const data = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, name: true }
    })

    return successResponse({ data })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**AFTER:**
```typescript
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware/auth"
import { handleApiError } from "@/lib/utils/api"
import prisma from "@/lib/db"

export const GET = withAuth(async (request, context) => {
  try {
    const { user } = context

    const data = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, name: true }
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(error, context.requestId)
  }
})
```

---

## Routes Requiring Migration

### Admin Routes (16 files = 32 errors)
- `app/api/admin/announcements/route.ts`
- `app/api/admin/announcements/[id]/route.ts`
- `app/api/admin/products/[productId]/route.ts`
- `app/api/admin/stores/route.ts`
- `app/api/admin/stores/[storeId]/route.ts`
- `app/api/admin/stores/[storeId]/products/route.ts`
- `app/api/admin/withdraws/route.ts`
- `app/api/admin/withdraws/[id]/route.ts`

### Vendor Routes (22 files = 44+ errors)
- All `/app/api/dashboard/**` routes
- All `/app/api/vendor/**` routes

### Auth Routes (15+ files = 30+ errors)
- Various routes using `requireAuth`

### All Routes Using successResponse (26+ occurrences)
- Mixed across admin, vendor, and auth routes

---

## Common Pitfalls

### 1. Forgetting to Access params from Context

❌ **Wrong:**
```typescript
export const GET = withAuth(async (request, { params }) => {
  // params is undefined here!
})
```

✅ **Correct:**
```typescript
export const GET = withAuth(async (request, context) => {
  const { params } = context
  // OR destructure in signature:
})
// Better with types:
export const GET = withAuth(async (request, context) => {
  const { id } = context.params as { id: string }
})
```

### 2. Missing NextResponse Import

❌ **Wrong:**
```typescript
return { success: true, data }  // Returns object, not Response
```

✅ **Correct:**
```typescript
import { NextResponse } from "next/server"
return NextResponse.json({ success: true, data })
```

### 3. Forgetting requestId in Error Handler

❌ **Wrong:**
```typescript
catch (error) {
  return handleApiError(error)  // Missing requestId
}
```

✅ **Correct:**
```typescript
catch (error) {
  return handleApiError(error, context.requestId)
}
```

### 4. Not Changing Function to Const

❌ **Wrong:**
```typescript
export async function GET = withAuth(...)  // Syntax error
```

✅ **Correct:**
```typescript
export const GET = withAuth(async (request, context) => {
  //...
})
```

---

## Migration Checklist

For each route file:

- [ ] Update imports (add middleware, NextResponse)
- [ ] Change `export async function` to `export const`
- [ ] Wrap handler with appropriate middleware
- [ ] Remove `await requireX()` calls
- [ ] Access `user`/`store` from `context` instead
- [ ] Access `params` from `context.params`
- [ ] Replace `successResponse()` with `NextResponse.json()`
- [ ] Add `context.requestId` to `handleApiError()` calls
- [ ] Test the route
- [ ] Run TypeScript check to verify no errors

---

## Automation Potential

**High Risk:** This migration is too complex for safe automation because:
- Need to understand each route's auth requirements
- params handling varies by route
- Some routes may have custom logic
- Risk of breaking working routes

**Recommended:** Manual migration with careful testing

**Semi-Automation:** Create template for common patterns, then manually apply

---

## Progress Tracking

### Admin Routes
- [ ] /api/admin/announcements/route.ts
- [ ] /api/admin/announcements/[id]/route.ts
- [ ] /api/admin/products/[productId]/route.ts
- [ ] /api/admin/stores/route.ts
- [ ] /api/admin/stores/[storeId]/route.ts
- [ ] /api/admin/stores/[storeId]/products/route.ts
- [ ] /api/admin/withdraws/route.ts
- [ ] /api/admin/withdraws/[id]/route.ts

### Vendor/Dashboard Routes
- [ ] /api/dashboard/analytics/route.ts
- [ ] /api/dashboard/analytics/daily-sales/route.ts
- [ ] /api/dashboard/orders/route.ts
- [ ] /api/dashboard/orders/[id]/route.ts
- [ ] /api/dashboard/orders/[id]/fulfill/route.ts
- [ ] /api/dashboard/products/route.ts
- [ ] /api/dashboard/products/[id]/route.ts
- [ ] /api/dashboard/reviews/route.ts
- [ ] /api/dashboard/settings/payment/route.ts
- [ ] /api/dashboard/settings/shipping/route.ts
- [ ] And 20+ more vendor routes...

---

## Testing Strategy

After each migration:

1. **Type Check:** `npx tsc --noEmit` - Should have fewer errors
2. **Build Test:** `npm run build` - Should not introduce new errors
3. **Manual Test:** Test the actual route with curl/Postman
4. **Auth Test:** Verify authentication still works correctly

---

## Time Estimates

| Route Type | Count | Time per Route | Total Time |
|------------|-------|----------------|------------|
| Simple Admin | 16 | 5-10 min | 1.5-2.5h |
| Simple Vendor | 22 | 5-10 min | 2-3.5h |
| Complex Routes | 10 | 15-20 min | 2.5-3h |
| **Total** | **48** | | **6-9 hours** |

**Note:** This doesn't include all 109 errors - some routes have multiple exports

---

## Next Steps

1. Start with simple admin routes (clear pattern)
2. Move to vendor routes (slightly more complex)
3. Handle complex routes with special cases
4. Test thoroughly after each batch
5. Document any issues encountered

---

*This guide will be updated as migration progresses*
