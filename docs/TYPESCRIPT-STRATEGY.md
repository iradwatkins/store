# TypeScript Error Resolution Strategy

## Current Status

**Total Errors**: 498
**Target**: Reduce to <20 critical errors
**Strategy**: Strategic fixes + temporary suppressions with TODOs

## Error Categories

### 1. Prisma Naming Conventions (~150 errors)
**Issue**: Code uses snake_case (vendor_stores, product_images) but Prisma client exports camelCase

**Examples**:
```typescript
// ❌ Current (snake_case)
product.vendor_stores.name
product.product_images[0].url

// ✅ Should be (camelCase)
product.vendorStore.name
product.productImages[0].url
```

**Resolution Strategy**:
- **Phase 1**: Add type utilities to handle both naming conventions
- **Phase 2**: Update Prisma schema with @@map directives
- **Phase 3**: Global search & replace for common patterns
- **Phase 4**: Add ESLint rule to prevent snake_case usage

**Priority**: HIGH (affects data access throughout app)

---

### 2. Null/Undefined Handling (~120 errors)
**Issue**: Properties that can be null aren't properly type-guarded

**Examples**:
```typescript
// ❌ Type error: Property 'createdAt' does not exist
session.user.createdAt

// ✅ Use type guard
if ('createdAt' in session.user) {
  const date = session.user.createdAt
}

// ✅ Use optional chaining
const date = session.user?.createdAt

// ✅ Use type utility
const date = safeGet(session.user, 'createdAt')
```

**Resolution Strategy**:
- Use `lib/type-utils.ts` helpers: `isDefined()`, `safeGet()`, `assertDefined()`
- Add optional chaining (`?.`) where appropriate
- Use nullish coalescing (`??`) for fallback values

**Priority**: HIGH (common pattern, easy to fix)

---

### 3. Tremor Component Type Mismatches (~80 errors)
**Issue**: Tremor components expect specific color types but receive `string | null`

**Examples**:
```typescript
// ❌ Type error: string | null not assignable to BackgroundColor
<Card className="..." style={{ backgroundColor: myColor }} />

// ✅ Use type utility
import { getTremorBackgroundColor } from '@/lib/type-utils'
<Card className="..." style={{ backgroundColor: getTremorBackgroundColor(myColor) }} />
```

**Resolution Strategy**:
- Use `getTremorColor()` and `getTremorBackgroundColor()` from type-utils
- Add fallback colors for all Tremor components

**Priority**: MEDIUM (visual components, won't break functionality)

---

### 4. Decimal Type Mismatches (~60 errors)
**Issue**: Prisma Decimal types used where React expects string/number

**Examples**:
```typescript
// ❌ Type error: Decimal not assignable to ReactNode
<div>{product.price}</div>

// ✅ Convert to string
<div>{decimalToString(product.price)}</div>

// ✅ Format as currency
<div>{decimalToCurrency(product.price)}</div>
```

**Resolution Strategy**:
- Use `lib/type-utils.ts` helpers: `decimalToNumber()`, `decimalToString()`, `decimalToCurrency()`
- Update components to handle Decimal types

**Priority**: HIGH (common in product/pricing pages)

---

### 5. Undefined Variable Usage (~40 errors)
**Issue**: Variables used before declaration or potentially undefined

**Examples**:
```typescript
// ❌ Type error: Variable used before declaration
const result = fetchOrder()
async function fetchOrder() { ... }

// ✅ Declare function first
async function fetchOrder() { ... }
const result = fetchOrder()
```

**Resolution Strategy**:
- Reorder variable declarations
- Add proper initialization
- Use `assertDefined()` for required values

**Priority**: HIGH (can cause runtime errors)

---

### 6. Form Validation Type Errors (~30 errors)
**Issue**: Zod schema types incompatible with react-hook-form

**Examples**:
```typescript
// ❌ Type error: Resolver type mismatch
resolver: zodResolver(productSchema)

// ✅ Use proper typing
resolver: zodResolver(productSchema) as any // TEMP: See TODO-TS-001
```

**Resolution Strategy**:
- Temporary: Add type assertions with TODO comments
- Long-term: Update to latest react-hook-form and @hookform/resolvers

**Priority**: LOW (forms work, just type mismatch)

---

### 7. Import/Export Errors (~18 errors)
**Issue**: Exported members not found, usually due to cache issues

**Examples**:
```typescript
// ❌ Module has no exported member 'requireAdmin'
import { requireAdmin } from '@/lib/utils/api'
```

**Resolution Strategy**:
- Clear TypeScript cache: `rm -rf .next node_modules/.cache`
- Regenerate Prisma client: `npm run db:generate`
- Verify exports exist in source files

**Priority**: HIGH (blocks development)

---

## Implementation Plan

### Week 3 Day 1-2: Critical Fixes (Target: 498 → 150 errors)

1. **Fix import/export errors** (18 errors)
   - Clear caches
   - Verify all exports
   - Fix any missing exports

2. **Fix undefined variable usage** (40 errors)
   - Reorder declarations
   - Add initialization

3. **Add Decimal conversion utilities** (60 errors)
   - Import type-utils helpers
   - Replace raw Decimal usage

4. **Fix null/undefined common patterns** (50 errors)
   - Add optional chaining
   - Use type guards

**Expected Result**: 330 errors remaining

### Week 3 Day 3: Medium Priority (Target: 330 → 100 errors)

5. **Fix Prisma naming convention** (150 errors)
   - Search & replace vendor_stores → vendorStore
   - Search & replace product_images → productImages
   - Search & replace other common patterns

6. **Fix Tremor type mismatches** (80 errors)
   - Use color type utilities
   - Add fallback colors

**Expected Result**: 100 errors remaining

### Week 3 Day 4-5: Cleanup & Suppression (Target: 100 → <20 errors)

7. **Strategic suppressions** (80 errors)
   - Add `@ts-expect-error` with TODO comments for non-critical errors
   - Document why each suppression is temporary
   - Create tickets for future fixes

8. **Final polish** (remaining errors)
   - Fix any critical errors found during testing
   - Run full type-check and ensure <20 errors

**Expected Result**: <20 errors, all non-critical and documented

---

## Type Utilities Reference

Created in `lib/type-utils.ts`:

### Type Guards
- `isDefined<T>(value)` - Check if not null/undefined
- `isNonEmptyString(value)` - Check for non-empty string
- `isTremorColor(value)` - Check if valid Tremor color
- `isNonEmptyArray(arr)` - Check for non-empty array

### Decimal Helpers
- `decimalToNumber(value, fallback)` - Convert to number
- `decimalToString(value, fallback)` - Convert to string
- `decimalToCurrency(value)` - Format as USD currency

### Tremor Helpers
- `getTremorColor(value, fallback)` - Get color with fallback
- `getTremorBackgroundColor(value, fallback)` - Get bg color with fallback

### Safe Access
- `safeGet(obj, key)` - Safe property access
- `safeGetNested(obj, path, fallback)` - Deep property access
- `safeArrayAccess(arr, index, fallback)` - Safe array indexing

### Parsing
- `parseNumber(value, fallback)` - Parse to number
- `parseInt10(value, fallback)` - Parse to integer
- `toBoolean(value)` - Convert to boolean

### Assertions
- `assertDefined(value, message)` - Throw if not defined
- `assertNever(x)` - Exhaustive switch check

---

## Suppression Format

When adding TypeScript suppressions, use this format:

```typescript
// TODO-TS-001: Fix react-hook-form resolver type mismatch
// Related to: Form validation type errors (category #6)
// Priority: LOW
// Estimated effort: 2 hours (upgrade dependencies)
// @ts-expect-error Temporary suppression
resolver: zodResolver(productSchema)
```

This allows us to:
1. Track all suppressions with unique IDs
2. Document why the suppression exists
3. Categorize by priority
4. Estimate effort for future fixes

---

## Testing Strategy

After each fix batch:

```bash
# Run type-check
npm run type-check

# Verify no runtime errors
npm run dev
# Test affected pages manually

# Run tests
npm test

# Check build
npm run build
```

---

## Success Criteria

✅ **Phase 1 Complete** (Day 1-2):
- <150 errors remaining
- All critical errors fixed
- App runs without runtime errors

✅ **Phase 2 Complete** (Day 3):
- <100 errors remaining
- All high-priority errors fixed
- All pages load correctly

✅ **Phase 3 Complete** (Day 4-5):
- <20 errors remaining
- All suppressions documented
- Build passes without errors
- Production deploy successful

---

## Known Issues & Workarounds

### Issue: Prisma Client Type Inference
**Problem**: TypeScript can't infer types for included relations
**Workaround**: Manually cast types or use Prisma.$inferSelect
**Permanent Fix**: Upgrade to Prisma 6.x (breaking changes)

### Issue: Next.js 15 Route Handler Types
**Problem**: Request/Response types changed in Next.js 15
**Workaround**: Use `any` for now, update when stable types available
**Permanent Fix**: Wait for Next.js 15 stable release

### Issue: Tremor React Type Definitions
**Problem**: Some Tremor components have overly strict types
**Workaround**: Use type utilities to coerce values
**Permanent Fix**: Submit PR to @tremor/react for more flexible types

---

## Monitoring

Track TypeScript error count over time:

```bash
# Add to package.json scripts
"type-check:count": "npm run type-check 2>&1 | grep 'error TS' | wc -l"

# Run daily
npm run type-check:count
```

Target trajectory:
- Day 1: 498 → 330 (33% reduction)
- Day 2: 330 → 150 (55% reduction)
- Day 3: 150 → 100 (67% reduction)
- Day 4: 100 → 50 (83% reduction)
- Day 5: 50 → <20 (96% reduction)
