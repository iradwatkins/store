# CRITICAL: SSO Alignment Required

**Date**: 2025-10-10
**Priority**: 🚨 BLOCKER - Must fix before deploying any database schema
**Issue**: stores-stepperslife schema is NOT aligned with stepperslife.com SSO

## Problem

The current `stores-stepperslife/prisma/schema.prisma` contains:
- ❌ **Local User model** (creates own users table)
- ❌ **Local Account/Session models** (creates own auth tables)
- ❌ **VendorStore model** (should use central Store model)
- ❌ **Custom roles/permissions** (should use UserRole enum from SSO)

## Correct Architecture (from stepperslife.com)

### Central SSO Database: `stepperslife`

**User & Auth Models** (NextAuth.js):
- `User` - Central user table with roles array
- `Account` - OAuth/email provider accounts
- `Session` - User sessions
- `VerificationToken` - Email verification

**UserRole Enum** (source of truth):
```prisma
enum UserRole {
  ADMIN
  USER
  STORE_OWNER          // ← Self-assignable
  STORE_ADMIN          // ← Assigned by store owner
  RESTAURANT_OWNER
  EVENT_ORGANIZER
  INSTRUCTOR
  SERVICE_PROVIDER
  MAGAZINE_WRITER
  RESTAURANT_MANAGER
  RESTAURANT_STAFF
  EVENT_STAFF
  AFFILIATE
}
```

**Business Stub Models** (in SSO database):
- `Store` - Store business stub (id, name, slug, ownerId, staff, isActive)
- `StoreStaff` - Staff assignments for stores
- `Restaurant` - Restaurant business stub
- `Event` - Event business stub
- `Class` - Class business stub
- `Service` - Service business stub

**Role Assignment Tracking**:
- `RoleAssignment` - Audit trail for all role assignments/revocations

## Required Changes

### 1. Database Connection
**Current**: `DATABASE_URL=postgresql://...@localhost:5432/stepperslife`
**Issue**: Stores schema conflicts with main site schema
**Decision Needed**:
- Option A: Share `stepperslife` database (add store-specific tables)
- Option B: Use separate database `stepperslife_store` with foreign keys to SSO

### 2. Schema Alignment

**REMOVE from stores schema**:
- ❌ `model User` (use SSO User)
- ❌ `model Account` (use SSO Account)
- ❌ `model Session` (use SSO Session)
- ❌ `model VerificationToken` (use SSO VerificationToken)
- ❌ `model VendorStore` (use SSO Store)
- ❌ Any custom role enums

**KEEP in stores schema** (store-specific):
- ✅ `Product` model (with userId → SSO User)
- ✅ `ProductImage` model
- ✅ `ProductVariant` model
- ✅ `StoreOrder` model (customerEmail, customerId → SSO User)
- ✅ `OrderItem` model
- ✅ `CartItem` model
- ✅ `ProductReview` model (customerId → SSO User)
- ✅ `ShopRating` model

**UPDATE in stores schema**:
- Change `vendorStoreId` references to `storeId` (match SSO naming)
- Change `VendorStore` relations to `Store`
- Remove local User relations, reference SSO User table
- Use `UserRole` enum from SSO (not custom enums)

### 3. Foreign Key Strategy

If using separate database (Option B):
- Cannot use Prisma relations across databases
- Must use string IDs and manual joins
- Add validation in application code

If using shared database (Option A):
- Use standard Prisma relations
- Enforce with foreign key constraints
- Simpler development experience

## Impact on Current Work

**Stories 1-3 (Reviews System)**:
- ✅ Code logic is correct
- ❌ Database schema needs major refactoring
- ⏸️ CANNOT deploy until SSO alignment complete

**What Needs Rework**:
1. Update all `vendorStoreId` to `storeId`
2. Update all `VendorStore` to `Store`
3. Remove local User model
4. Update auth.ts to use SSO User
5. Update all userId references to point to SSO

## Recommended Action Plan

1. **Confirm architecture** with team:
   - Shared database vs separate database?
   - Store model naming (Store vs VendorStore)?

2. **Update schema.prisma**:
   - Remove User/Account/Session models
   - Use SSO models as data sources
   - Update all foreign key references

3. **Update application code**:
   - Fix auth.ts imports
   - Fix middleware role checks
   - Update API endpoints

4. **Database migration**:
   - Deploy corrected schema
   - Seed initial data
   - Test SSO integration

5. **Test thoroughly**:
   - User authentication flow
   - Role-based access control
   - Store creation workflow
   - Product/order operations

## Questions for User

1. **Should stores use the same `stepperslife` database or separate `stepperslife_store` database?**
2. **Should we rename `VendorStore` → `Store` to match SSO naming?**
3. **Are there any existing users/stores in the main database we need to preserve?**

## Files Requiring Updates

- `prisma/schema.prisma` - Major refactor
- `lib/auth.ts` - Use SSO User model
- `middleware.ts` - Use SSO UserRole enum
- `app/api/**/*.ts` - Update model references
- All components using User/VendorStore

## Estimated Rework Time

- Schema refactor: 2-3 hours
- Code updates: 3-4 hours
- Testing: 2-3 hours
- **Total: 7-10 hours**

## Status

🔴 **BLOCKED** - Cannot proceed with database deployment until SSO alignment is resolved.
