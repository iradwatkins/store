# Story: Multi-Variant Product System Enhancement

<!-- Source: Brownfield code analysis and vendor requirements -->
<!-- Context: Brownfield enhancement to existing single-variant product system -->

## Status: Draft

## Story

As a **vendor selling products with multiple options** (e.g., T-shirts in multiple colors AND sizes),
I want **to create products with multiple variant dimensions** (Size + Color + Material, etc.),
so that **I can accurately represent my inventory without creating duplicate products for each combination**.

## Context Source

- **Source Documents**:
  - Code analysis of existing variant system
  - Database schema: `prisma/schema.prisma` (ProductVariant model lines 263-281)
  - Vendor product creation UI: `app/(vendor)/dashboard/products/new/page.tsx`
  - Variant API: `app/api/vendor/products/[id]/variants/route.ts`

- **Enhancement Type**: Multi-feature enhancement to existing product variant system
- **Existing System Impact**: **HIGH** - Affects product creation, inventory tracking, cart, checkout, order fulfillment

## Current System State

### Existing Architecture
The current system supports **SINGLE variant dimension** per product:

**Database (ProductVariant model):**
```prisma
model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  name      String   // "Size" or "Color"
  value     String   // "Large", "Red", etc.
  price     Decimal? // Optional variant price override
  sku       String?
  quantity  Int      @default(0)
  imageUrl  String?  // NOT CURRENTLY USED
  available Boolean  @default(true)
  sortOrder Int      @default(0)
}
```

**Product model has:**
- `hasVariants: Boolean` - Flag for variant existence
- `variantType: VariantType?` - Enum: SIZE or COLOR (only 2 options)

### Current Limitations

1. **Single Variant Type Only**
   - Products can ONLY be SIZE variants OR COLOR variants, not both
   - Real scenario broken: "Red T-Shirt in Medium" requires workaround
   - Current workaround: Create separate products for each color

2. **No Product Addons**
   - Cannot offer gift wrapping, engraving, monogramming
   - No upsell options at product level

3. **Limited Variant Types**
   - Hardcoded to only SIZE and COLOR
   - Cannot do: Material, Style, Flavor, Pattern, Finish, etc.

4. **Tedious Variant Management**
   - Manual entry for each variant's inventory/price/SKU
   - No bulk operations
   - No CSV import/export

5. **Unused Features**
   - `imageUrl` field exists but not implemented in UI
   - Cannot show color-specific product photos

## Acceptance Criteria

### Phase 1: Multi-Dimensional Variants (PRIORITY)

1. **Multi-Variant Product Creation**
   - [ ] Vendors can select 2-3 variant types per product (e.g., Size + Color)
   - [ ] System automatically generates all variant combinations
   - [ ] Example: 5 sizes × 3 colors = 15 variant combinations auto-generated
   - [ ] Each combination has independent inventory, price, SKU

2. **Backward Compatibility**
   - [ ] Existing single-variant products continue to work unchanged
   - [ ] Old product creation flow still functional
   - [ ] Migration path for upgrading single-variant to multi-variant

3. **Bulk Variant Management**
   - [ ] Bulk set pricing for all variants
   - [ ] Bulk set inventory for variants matching criteria (e.g., "all Red variants")
   - [ ] Bulk enable/disable variant combinations

4. **Customer Experience**
   - [ ] Customers can select multiple variant dimensions on product page
   - [ ] Out-of-stock combinations are clearly marked
   - [ ] Selected combination shows correct price, availability, and image (if set)
   - [ ] Add to cart includes all selected variant options

5. **Inventory Tracking**
   - [ ] Each variant combination tracks separate inventory
   - [ ] Low stock alerts work at combination level
   - [ ] Order fulfillment decrements correct combination inventory

### Phase 2: Product Addons System

6. **Addon Creation**
   - [ ] Vendors can create addons (e.g., "Gift Wrapping +$5")
   - [ ] Addons have: name, description, price, optional/required flag
   - [ ] Addons can be product-specific or store-wide

7. **Customer Addon Selection**
   - [ ] Customers see available addons on product page
   - [ ] Required addons must be selected before adding to cart
   - [ ] Addon selections are preserved in cart and order

### Phase 3: Enhanced Variant UX

8. **Variant Images**
   - [ ] Upload specific image for each variant (primarily colors)
   - [ ] Variant image displays when customer selects that option
   - [ ] Fallback to main product images if variant image not set

9. **CSV Import/Export**
   - [ ] Export all variants to CSV for bulk editing
   - [ ] Import CSV to update variant inventory, prices, SKUs
   - [ ] Validation and error reporting for imports

10. **Variant Templates**
    - [ ] Save variant configurations as templates
    - [ ] Apply template when creating new products
    - [ ] Example templates: "Standard Clothing Sizes", "Jewelry Metal Options"

## Technical Guidance

### Existing System Context

**Current Product Creation Flow:**
1. Vendor selects variant type: NONE, SIZE, or COLOR (lines 68-153 in `new/page.tsx`)
2. If SIZE: Shows 8 preset sizes + custom input
3. If COLOR: Shows 15 preset colors + custom input
4. Selected options generate flat list of variants
5. Variants displayed in table for inventory/price entry
6. On submit: Product created with `variantType` field set
7. ProductVariant rows created for each selected option

**Current Database Structure:**
- Product has `variantType: VariantType?` - ENUM (SIZE, COLOR)
- ProductVariant has `name` and `value` - both strings
- No junction table or multi-dimensional support

**Key Files Requiring Changes:**
- `prisma/schema.prisma` - Add new models/fields
- `app/(vendor)/dashboard/products/new/page.tsx` - Multi-variant UI
- `app/(vendor)/dashboard/products/[id]/edit/page.tsx` - Edit multi-variants
- `app/api/vendor/products/route.ts` - Handle multi-variant creation
- `app/api/vendor/products/[id]/variants/route.ts` - CRUD for variant combinations
- `app/(storefront)/store/[slug]/products/[productSlug]/AddToCartButton.tsx` - Multi-select UI
- `app/api/cart/add/route.ts` - Handle variant combinations in cart

### Integration Approach

#### 1. Database Schema Changes

**Option A: Backward Compatible (RECOMMENDED)**

Keep existing `ProductVariant` model, extend with new fields:

```prisma
model Product {
  // Existing fields...
  hasVariants Boolean @default(false)
  variantType VariantType? // DEPRECATED - keep for old products
  variantTypes String[] // NEW: ["SIZE", "COLOR"] for multi-variant
  // Existing relations...
}

model ProductVariant {
  // Existing fields...
  id        String @id @default(cuid())
  productId String

  // OLD FIELDS (deprecated but kept for compatibility)
  name  String // "Size" or "Color"
  value String // "Large", "Red"

  // NEW FIELDS for multi-variant
  variantOptionId String? // Links to VariantOption
  combinationKey  String? // "SIZE:Large|COLOR:Red" for lookups
  optionValues    Json?   // {"SIZE": "Large", "COLOR": "Red"}

  // Existing fields...
  price     Decimal?
  sku       String?
  quantity  Int
  imageUrl  String?
  available Boolean
  sortOrder Int

  variantOption VariantOption? @relation(fields: [variantOptionId], references: [id])
  product       Product @relation(fields: [productId], references: [id])
}

// NEW MODEL: Defines available variant types and options
model VariantOption {
  id          String @id @default(cuid())
  productId   String
  type        String // "SIZE", "COLOR", "MATERIAL", etc.
  value       String // "Large", "Red", "Cotton"
  displayName String // "Large", "Red", "100% Cotton"
  hexColor    String? // For color swatches
  imageUrl    String? // Variant-specific image
  sortOrder   Int @default(0)
  createdAt   DateTime @default(now())

  product  Product @relation(fields: [productId], references: [id])
  variants ProductVariant[]

  @@unique([productId, type, value])
  @@index([productId, type])
}

// NEW MODEL: Product addons (gift wrap, etc.)
model ProductAddon {
  id          String @id @default(cuid())
  productId   String?
  storeId     String // For store-wide addons
  name        String
  description String?
  price       Decimal @db.Decimal(10, 2)
  isRequired  Boolean @default(false)
  isActive    Boolean @default(true)
  sortOrder   Int @default(0)
  createdAt   DateTime @default(now())

  product Product? @relation(fields: [productId], references: [id])
  store   VendorStore @relation(fields: [storeId], references: [id])

  @@index([productId])
  @@index([storeId, isActive])
}
```

**Migration Strategy:**
1. Add new fields with `?` nullable
2. Keep old fields for backward compatibility
3. New products use `variantTypes[]` and `VariantOption`
4. Old products continue using `variantType` and legacy variant structure
5. Provide migration endpoint to upgrade old products to new system

#### 2. API Changes

**Variant Creation API** (`/api/vendor/products/[id]/variants/route.ts`)

Current:
```typescript
POST /api/vendor/products/[id]/variants
{
  "name": "Size",
  "value": "Large",
  "price": 29.99,
  "sku": "SHIRT-L",
  "quantity": 50
}
```

New (supports both single and multi-variant):
```typescript
POST /api/vendor/products/[id]/variants/combinations
{
  "variantTypes": ["SIZE", "COLOR"], // Product variant types
  "options": [
    {
      "type": "SIZE",
      "values": ["Small", "Medium", "Large", "XL"]
    },
    {
      "type": "COLOR",
      "values": ["Red", "Blue", "Black"],
      "colors": {
        "Red": "#DC2626",
        "Blue": "#2563EB",
        "Black": "#000000"
      }
    }
  ],
  "generateCombinations": true, // Auto-create all combinations
  "defaultPrice": null, // Use product price
  "defaultQuantity": 0
}

// Response: Creates 4 × 3 = 12 variant combinations
{
  "created": 12,
  "variants": [
    {
      "id": "...",
      "combinationKey": "SIZE:Small|COLOR:Red",
      "optionValues": {"SIZE": "Small", "COLOR": "Red"},
      "price": 29.99,
      "quantity": 0
    },
    // ... 11 more
  ]
}
```

**Bulk Update API** (NEW)
```typescript
PATCH /api/vendor/products/[id]/variants/bulk
{
  "filter": {
    "COLOR": "Red" // Update all Red variants
  },
  "updates": {
    "quantity": 100,
    "price": 34.99
  }
}
```

#### 3. UI Changes

**Product Creation Flow** (`new/page.tsx`)

Current: Radio buttons for NONE | SIZE | COLOR

New:
```
┌─────────────────────────────────────────┐
│ Product Variants                        │
│                                         │
│ ☐ No variants (single product)         │
│ ☐ This product has variants            │
│   ┌───────────────────────────────────┐ │
│   │ Select variant types (1-3):       │ │
│   │ ☑ Size                            │ │
│   │ ☑ Color                           │ │
│   │ ☐ Material                        │ │
│   │ ☐ Style                           │ │
│   │ ☐ Pattern                         │ │
│   │ [+ Add custom type]               │ │
│   └───────────────────────────────────┘ │
│                                         │
│ Size Options:                           │
│ [XS] [S] [M] [L] [XL] [2XL]            │
│ [+ Add custom size]                     │
│                                         │
│ Color Options:                          │
│ [🔴 Red] [🔵 Blue] [⚫ Black]          │
│ [+ Add custom color]                    │
│                                         │
│ ┌─ Variant Combinations (12 total) ───┐ │
│ │ Size × Color = 6 sizes × 2 colors   │ │
│ │                                      │ │
│ │ [Bulk Actions ▾]                    │ │
│ │ • Set all prices                     │ │
│ │ • Set inventory for size/color       │ │
│ │ • Import from CSV                    │ │
│ └──────────────────────────────────────┘ │
│                                         │
│ Variant Inventory Table:                │
│ ┌────────┬───────┬───────┬─────┬─────┐  │
│ │ Size   │ Color │ Price │ SKU │ Qty │  │
│ ├────────┼───────┼───────┼─────┼─────┤  │
│ │ Small  │ Red   │ 29.99 │ ... │ 10  │  │
│ │ Small  │ Blue  │ 29.99 │ ... │ 10  │  │
│ │ Medium │ Red   │ 29.99 │ ... │ 10  │  │
│ │ ...    │ ...   │ ...   │ ... │ ... │  │
│ └────────┴───────┴───────┴─────┴─────┘  │
└─────────────────────────────────────────┘
```

**Customer Product Page** (`AddToCartButton.tsx`)

Current: Simple dropdown or button group (one dimension)

New:
```
┌─────────────────────────────────────────┐
│ Select Size:                            │
│ ( XS ) ( S ) ( M ) [L] ( XL )          │
│                        ↑ selected        │
│ Select Color:                           │
│ (🔴) (🔵) [⚫]                          │
│           ↑ selected                     │
│                                         │
│ Price: $29.99                           │
│ Availability: ✅ In Stock (15 left)    │
│                                         │
│ Quantity: [-] 1 [+]                     │
│                                         │
│ [Add to Cart]                           │
│                                         │
│ Product Addons (optional):              │
│ ☐ Gift Wrapping (+$5.00)               │
│ ☐ Express Shipping (+$15.00)           │
└─────────────────────────────────────────┘
```

### Technical Constraints

1. **Database Migration**
   - Cannot break existing products with single variants
   - Must support gradual migration
   - Nullable fields to maintain compatibility

2. **Performance Concerns**
   - Large variant combinations (e.g., 10 sizes × 8 colors × 3 materials = 240 variants)
   - Need efficient queries for variant availability checks
   - Consider pagination for variant management UI

3. **Cart Compatibility**
   - Cart currently stores `variantId: string?`
   - Need to ensure cart can handle multi-variant products
   - May need to store `combinationKey` in cart items

4. **Inventory System**
   - Low stock alerts currently check product-level or single-variant
   - Need variant combination level alerts
   - Integration with existing `app/api/cron/check-low-stock/route.ts`

5. **Image Storage**
   - Variant images will increase storage usage
   - Need to track in tenant quota system
   - Optimize image sizes for variant thumbnails

### Missing Information

**Questions for Dev Agent:**

1. ✅ **Variant Type Extensibility**: Should vendors be able to create custom variant types beyond SIZE/COLOR/MATERIAL? Or keep preset list?
   - *Suggest*: Start with preset list of 10-15 common types, add custom type support in Phase 4

2. ✅ **Variant Combination Limits**: What's the maximum allowed variant combinations per product?
   - *Suggest*: 100 combinations for STARTER plan, 500 for PRO, unlimited for ENTERPRISE

3. ✅ **Addon Scope**: Should addons be product-specific, store-wide, or both?
   - *Suggest*: Both - addons can be created at store level and optionally linked to specific products

4. ✅ **Pricing Rules**: Should variant price be additive (base + variant) or override?
   - *Current system*: Override (variant price replaces product price)
   - *Suggest*: Keep override, add optional "price modifier" field for additive pricing

5. ⚠️ **Migration UI**: Should we provide UI for vendors to migrate old products to multi-variant?
   - *Need input*: Auto-migrate vs manual migration tool

## Tasks / Subtasks

### Phase 1: Database Schema & Migration

- [ ] **Task 1: Create database migration for new schema**
  - [ ] Add `variantTypes` string array to Product model
  - [ ] Create `VariantOption` model
  - [ ] Add new fields to `ProductVariant` (combinationKey, optionValues JSON)
  - [ ] Add `ProductAddon` model
  - [ ] Create indexes for performance
  - [ ] Run migration with `npx prisma migrate dev`

- [ ] **Task 2: Create seed data for variant types**
  - [ ] Define preset variant types (SIZE, COLOR, MATERIAL, STYLE, PATTERN, FINISH)
  - [ ] Create helpers for common variant options (clothing sizes, standard colors)

### Phase 2: Backend API - Multi-Variant Support

- [ ] **Task 3: Update product creation API**
  - [ ] Modify `app/api/vendor/products/route.ts` POST handler
  - [ ] Accept `variantTypes[]` in request
  - [ ] Support backward compatibility for single-variant products
  - [ ] Validate variant type combinations

- [ ] **Task 4: Create variant combination generation API**
  - [ ] New endpoint: `POST /api/vendor/products/[id]/variants/combinations`
  - [ ] Generate all combinations from variant options
  - [ ] Create VariantOption records
  - [ ] Create ProductVariant records with combinationKey
  - [ ] Handle existing variants (update vs create)

- [ ] **Task 5: Create bulk variant update API**
  - [ ] New endpoint: `PATCH /api/vendor/products/[id]/variants/bulk`
  - [ ] Filter variants by type/value
  - [ ] Update price/inventory/availability in bulk
  - [ ] Return summary of updated variants

- [ ] **Task 6: Update variant CRUD endpoints**
  - [ ] Modify `app/api/vendor/products/[id]/variants/route.ts`
  - [ ] Support multi-variant structure in GET/POST/PUT/DELETE
  - [ ] Maintain backward compatibility for old variants

### Phase 3: Frontend - Vendor Product Creation

- [ ] **Task 7: Update product creation form**
  - [ ] Modify `app/(vendor)/dashboard/products/new/page.tsx`
  - [ ] Add multi-variant type selector (checkboxes)
  - [ ] Show multiple variant option sections (Size + Color + etc.)
  - [ ] Generate variant combination preview
  - [ ] Add bulk action controls

- [ ] **Task 8: Build variant combination table component**
  - [ ] Display all variant combinations in paginated table
  - [ ] Editable fields: price, SKU, quantity, availability
  - [ ] Inline editing for quick updates
  - [ ] Highlight missing data (e.g., no inventory set)

- [ ] **Task 9: Add bulk variant management UI**
  - [ ] Bulk price setter (apply to all or filtered variants)
  - [ ] Bulk inventory setter with filters
  - [ ] Bulk SKU generator (pattern-based)
  - [ ] Select multiple variants for batch operations

- [ ] **Task 10: Update product edit page**
  - [ ] Modify `app/(vendor)/dashboard/products/[id]/edit/page.tsx`
  - [ ] Support editing multi-variant products
  - [ ] Add/remove variant types
  - [ ] Regenerate combinations when options change

### Phase 4: Frontend - Customer Experience

- [ ] **Task 11: Create multi-variant selector component**
  - [ ] New component: `MultiVariantSelector.tsx`
  - [ ] Dynamic variant type rendering (size buttons, color swatches, etc.)
  - [ ] Real-time availability checking as options selected
  - [ ] Display selected combination's price and inventory
  - [ ] Show variant image if available

- [ ] **Task 12: Update AddToCartButton component**
  - [ ] Modify `app/(storefront)/store/[slug]/products/[productSlug]/AddToCartButton.tsx`
  - [ ] Integrate MultiVariantSelector
  - [ ] Validate all required variant types selected
  - [ ] Pass combination key to cart API

- [ ] **Task 13: Update product display page**
  - [ ] Modify `app/(storefront)/store/[slug]/products/[productSlug]/page.tsx`
  - [ ] Display variant selector for multi-variant products
  - [ ] Maintain single-variant product support
  - [ ] Show variant-specific images

### Phase 5: Cart & Checkout Integration

- [ ] **Task 14: Update cart API for multi-variants**
  - [ ] Modify `app/api/cart/add/route.ts`
  - [ ] Accept `combinationKey` or multiple `variantOptionIds`
  - [ ] Validate variant combination exists and is available
  - [ ] Store full variant details in cart

- [ ] **Task 15: Update cart display**
  - [ ] Show all selected variant options in cart (e.g., "Size: Large, Color: Red")
  - [ ] Ensure cart switching modal handles multi-variant products
  - [ ] Display correct variant image in cart

- [ ] **Task 16: Update order creation**
  - [ ] Modify order creation to include all variant details
  - [ ] Store combination key in StoreOrderItem
  - [ ] Ensure inventory decrements correct variant combination

### Phase 6: Product Addons System

- [ ] **Task 17: Create addon management API**
  - [ ] New endpoint: `POST /api/vendor/products/[id]/addons`
  - [ ] CRUD for product and store-wide addons
  - [ ] Validate addon pricing

- [ ] **Task 18: Build addon management UI**
  - [ ] Addon section in product creation/edit pages
  - [ ] Toggle between product-specific and store-wide addons
  - [ ] Set required/optional flag

- [ ] **Task 19: Integrate addons in product page**
  - [ ] Display available addons below variant selector
  - [ ] Required addons must be selected
  - [ ] Add addon prices to total

- [ ] **Task 20: Update cart for addons**
  - [ ] Store selected addons with cart items
  - [ ] Display addon charges in cart
  - [ ] Include addons in order total

### Phase 7: Variant Images

- [ ] **Task 21: Add variant image upload**
  - [ ] UI in variant management to upload images per VariantOption
  - [ ] Store variant images in MinIO
  - [ ] Associate image URL with VariantOption record

- [ ] **Task 22: Display variant images on product page**
  - [ ] Show variant image when customer selects option
  - [ ] Fallback to product images if variant image not set
  - [ ] Image gallery integration

### Phase 8: Testing & Optimization

- [ ] **Task 23: Write tests for variant combination generation**
  - [ ] Unit tests for combination logic
  - [ ] Test edge cases (single variant, 3-variant combos, empty options)

- [ ] **Task 24: Test backward compatibility**
  - [ ] Verify old single-variant products still work
  - [ ] Test mixed store (old and new variant products)
  - [ ] Validate cart/checkout with both product types

- [ ] **Task 25: Performance optimization**
  - [ ] Add indexes for variant combination queries
  - [ ] Optimize variant table pagination for large product sets
  - [ ] Cache frequently accessed variant combinations

- [ ] **Task 26: End-to-end testing**
  - [ ] Create multi-variant product
  - [ ] Customer selects variants and adds to cart
  - [ ] Complete checkout and order fulfillment
  - [ ] Verify inventory decrements correctly

## Risk Assessment

### Implementation Risks

**Primary Risk: Breaking Existing Products**
- **Mitigation**:
  - All new schema fields are nullable
  - Check `product.variantTypes` to determine old vs new variant system
  - Run parallel code paths for old/new products
  - Extensive testing on production data copy

**Secondary Risk: Performance with Large Variant Sets**
- **Mitigation**:
  - Limit variant combinations (100-500 depending on plan)
  - Add database indexes on `combinationKey` and `optionValues`
  - Paginate variant management tables
  - Lazy load variant availability checks on customer-facing pages

**Tertiary Risk: Cart Compatibility Issues**
- **Mitigation**:
  - Update cart schema to support both single and multi-variants
  - Store full variant details to avoid JOIN queries
  - Test cart switching scenarios thoroughly

### Rollback Plan

If critical issues arise post-deployment:

1. **Database**: New fields are nullable - can revert API code without schema rollback
2. **Feature Flag**: Add `ENABLE_MULTI_VARIANTS` flag to disable new UI/API
3. **Gradual Rollout**: Deploy to test stores first, monitor for issues
4. **Data Integrity**: Keep old variant fields populated for rollback compatibility

### Safety Checks

- [ ] Test on staging environment with copy of production database
- [ ] Create test vendor account to create multi-variant products
- [ ] Verify old products remain functional
- [ ] Test checkout flow with both old and new variant products
- [ ] Load test variant combination generation (100+ combos)
- [ ] Verify inventory tracking across all scenarios

## Success Metrics

### Functional Success
- [ ] Vendors can create products with 2+ variant types
- [ ] Variant combinations are generated accurately (all permutations)
- [ ] Customers can select multi-variant options and add to cart
- [ ] Orders capture full variant details and decrement correct inventory
- [ ] Existing single-variant products work unchanged

### Performance Success
- [ ] Variant combination generation completes in < 5 seconds for 100 combos
- [ ] Product page loads with multi-variant selector in < 3 seconds
- [ ] Cart add operation completes in < 1 second
- [ ] No N+1 query issues in variant loading

### Business Success
- [ ] Reduce duplicate products (vendors consolidate color variants)
- [ ] Enable new product categories (clothing, configurable goods)
- [ ] Increase conversion rate with better variant UX
- [ ] Support upsells via product addons

## Notes

### Development Sequence

**Recommended Implementation Order:**
1. Phase 1: Database (1-2 days)
2. Phase 2: Backend APIs (3-4 days)
3. Phase 3: Vendor UI (4-5 days)
4. Phase 4: Customer UI (3-4 days)
5. Phase 5: Cart/Checkout (2-3 days)
6. Phase 6: Addons (2-3 days)
7. Phase 7: Images (2 days)
8. Phase 8: Testing (3-4 days)

**Total Estimate**: 20-30 days

### Future Enhancements (Not in Current Story)

- **CSV Import/Export**: Bulk manage variants via spreadsheet
- **Variant Templates**: Save/reuse variant configurations
- **Custom Variant Types**: Allow vendors to define new types beyond presets
- **Variant Rules**: Conditional combinations (e.g., XL only in Black)
- **Dynamic Pricing**: Price modifiers based on combination
- **Variant Analytics**: Which combinations sell best

### Open Questions

1. Should we auto-migrate existing single-variant products to new system?
   - Pro: Unified codebase, easier maintenance
   - Con: Risk of breaking working products, data migration complexity
   - **Recommendation**: Provide optional migration tool, not automatic

2. How to handle variant inventory when deleting variant options?
   - If vendor removes "Red" color, what happens to inventory of Red variants?
   - **Recommendation**: Soft delete with warning, allow undo

3. Should variant combination limits be enforced at creation or at product level?
   - **Recommendation**: Warn at 50+ combos, hard limit at plan threshold

---

**Story Author**: Claude Code Brownfield Task Agent
**Created**: 2025-10-16
**Last Updated**: 2025-10-16
**Related Docs**:
- `docs/DATABASE-SCHEMA.md`
- `docs/IMPLEMENTATION-ROADMAP.md`
