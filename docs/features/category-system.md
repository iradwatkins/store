# Product Category System

**Implementation Date**: 2025-10-09
**Status**: ✅ Complete
**Feature**: Full Etsy-style category hierarchy with 15 top-level categories and subcategories

---

## Overview

The product category system has been upgraded from a simple 3-category enum (Clothing, Shoes, Accessories) to a comprehensive 15-category Etsy-style hierarchy with subcategories. This provides vendors with a much more granular and accurate way to categorize their products.

---

## Category Hierarchy

### Top-Level Categories (15)

1. **Accessories** - 19 subcategories
2. **Art & Collectibles** - 11 subcategories
3. **Bags & Purses** - 14 subcategories
4. **Bath & Beauty** - 8 subcategories
5. **Books, Movies & Music** - 5 subcategories
6. **Clothing** - 12 subcategories
7. **Craft Supplies & Tools** - 7 subcategories
8. **Electronics & Accessories** - 6 subcategories
9. **Home & Living** - 10 subcategories
10. **Jewelry** - 8 subcategories
11. **Paper & Party Supplies** - 10 subcategories
12. **Pet Supplies** - 6 subcategories
13. **Shoes** - 8 subcategories
14. **Toys & Games** - 8 subcategories
15. **Weddings** - 9 subcategories

### Subcategory Examples

**Accessories**: Adult Bibs, Aprons, Belts & Suspenders, Bouquets & Corsages, Face Masks & Accessories, Hair Accessories, Hats & Head Coverings, Keychains & Lanyards, Sunglasses & Eyewear, Wallets & Money Clips, and more...

**Clothing**: Dresses, Jackets & Coats, Pants & Capris, Shirts & Tops, Shorts, Skirts, Sweaters, Swimwear, Suits & Blazers, Undergarments, Athletic Wear, Other Clothing

**Jewelry**: Bracelets, Brooches, Earrings, Necklaces, Rings, Jewelry Sets, Body Jewelry, Other Jewelry

*(Full list available in `/lib/categories.ts`)*

---

## Technical Implementation

### 1. Database Schema (`prisma/schema.prisma`)

**ProductCategory Enum** - Expanded from 3 to 15 values:
```prisma
enum ProductCategory {
  ACCESSORIES
  ART_AND_COLLECTIBLES
  BAGS_AND_PURSES
  BATH_AND_BEAUTY
  BOOKS_MOVIES_AND_MUSIC
  CLOTHING
  CRAFT_SUPPLIES_AND_TOOLS
  ELECTRONICS_AND_ACCESSORIES
  HOME_AND_LIVING
  JEWELRY
  PAPER_AND_PARTY_SUPPLIES
  PET_SUPPLIES
  SHOES
  TOYS_AND_GAMES
  WEDDINGS
}
```

**Product Model** - Added subcategory field:
```prisma
model Product {
  // ... other fields
  category          ProductCategory
  subcategory       String?         // NEW: Optional subcategory
  // ... other fields
}
```

**Migration**: Applied via `npx prisma db push`

---

### 2. Category Constants Library (`lib/categories.ts`)

Centralized category definitions for consistency across the application:

```typescript
export const PRODUCT_CATEGORIES = [
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "ART_AND_COLLECTIBLES", label: "Art & Collectibles" },
  // ... all 15 categories
] as const

export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  ACCESSORIES: [
    "Adult Bibs",
    "Aprons",
    "Belts & Suspenders",
    // ... all subcategories
  ],
  // ... mappings for all categories
}

// Helper functions
export function getCategoryLabel(value: string): string
export function getSubcategories(category: string): string[]
```

---

### 3. Product Creation Form (`app/(vendor)/dashboard/products/new/page.tsx`)

**Features**:
- Cascading dropdown: Category → Subcategory
- Subcategory dropdown appears dynamically when category is selected
- Uses react-hook-form's `watch()` to track selected category
- Zod validation includes all 15 categories

**Key Changes**:
```typescript
import { PRODUCT_CATEGORIES, getSubcategories } from "@/lib/categories"

const productSchema = z.object({
  category: z.enum([
    "ACCESSORIES", "ART_AND_COLLECTIBLES", "BAGS_AND_PURSES",
    // ... all 15 categories
  ]),
  subcategory: z.string().optional(),
  // ... other fields
})

// In component
const selectedCategory = watch("category")

// Render subcategory dropdown conditionally
{selectedCategory && (
  <select {...register("subcategory")}>
    <option value="">Select a subcategory</option>
    {getSubcategories(selectedCategory).map((subcat) => (
      <option key={subcat} value={subcat}>{subcat}</option>
    ))}
  </select>
)}
```

---

### 4. Product Edit Form (`app/(vendor)/dashboard/products/[id]/edit/page.tsx`)

Same implementation as creation form:
- Imports category utilities from `lib/categories.ts`
- Zod schema updated with 15 categories + subcategory
- Cascading dropdowns with `watch("category")`
- Form pre-populated with existing category and subcategory values

---

### 5. API Routes

#### Product Creation API (`app/api/vendor/products/route.ts`)

**Zod Schema Updated**:
```typescript
const createProductSchema = z.object({
  category: z.enum([
    "ACCESSORIES", "ART_AND_COLLECTIBLES", // ... all 15
  ]),
  subcategory: z.string().optional(),
  // ... other fields
})
```

**FormData Parsing**:
```typescript
const data = {
  category: formData.get("category") as string,
  subcategory: formData.get("subcategory") as string | null,
  // ... other fields
}
```

**Database Creation**:
```typescript
const product = await prisma.product.create({
  data: {
    category: validatedData.category as any,
    subcategory: validatedData.subcategory || null,
    // ... other fields
  },
})
```

#### Product Update API (`app/api/vendor/products/[id]/route.ts`)

**Update Logic**:
```typescript
const updatedProduct = await prisma.product.update({
  where: { id: params.id },
  data: {
    category: body.category,
    subcategory: body.subcategory || null,
    // ... other fields
  },
})
```

---

## User Experience

### Vendor Flow

1. **Create Product**:
   - Select category from 15 options
   - Subcategory dropdown appears with relevant options
   - Optional subcategory selection
   - Both values saved to database

2. **Edit Product**:
   - Form pre-populated with existing category/subcategory
   - Can change category (subcategory resets)
   - Can change or clear subcategory

3. **Product Listing**:
   - Category displayed as label (e.g., "Art & Collectibles")
   - Subcategory displayed if set (e.g., "Paintings")

### Customer Flow (Future)

- Browse by category (e.g., "/stores/categories/JEWELRY")
- Filter by subcategory within category
- Search across categories

---

## Files Modified

### Database
- ✅ `prisma/schema.prisma` - ProductCategory enum expanded, subcategory field added

### Library
- ✅ `lib/categories.ts` - Created with category constants and helper functions

### Forms
- ✅ `app/(vendor)/dashboard/products/new/page.tsx` - Category/subcategory dropdowns
- ✅ `app/(vendor)/dashboard/products/[id]/edit/page.tsx` - Same dropdown implementation

### API Routes
- ✅ `app/api/vendor/products/route.ts` - Create endpoint with subcategory
- ✅ `app/api/vendor/products/[id]/route.ts` - Update endpoint with subcategory

---

## Testing Checklist

### ✅ Completed
- [x] Database schema migrated successfully
- [x] Product creation form renders all 15 categories
- [x] Subcategory dropdown appears when category selected
- [x] Form validation includes new categories
- [x] Product edit form pre-populates existing values
- [x] API routes accept and validate category/subcategory
- [x] Application builds successfully
- [x] PM2 process running on port 3008

### ⏳ To Test (Manual)
- [ ] Create product with category + subcategory
- [ ] Verify product saved to database correctly
- [ ] Edit product and change category
- [ ] Verify subcategory clears when category changes
- [ ] Create product without subcategory
- [ ] Verify optional subcategory works
- [ ] Check product listing displays categories correctly

---

## Future Enhancements

### Phase 2 - Storefront Integration
- [ ] Category navigation menu on storefront
- [ ] Filter products by category/subcategory
- [ ] Category-specific landing pages
- [ ] SEO-friendly category URLs

### Phase 3 - Advanced Features
- [ ] Category-specific product templates
- [ ] Recommended subcategories based on product description (AI)
- [ ] Category performance analytics
- [ ] Multi-category products (e.g., "Clothing > Accessories")

---

## Source Data

The category hierarchy is based on Etsy's official category structure, stored in:
- `/root/websites/stores-stepperslife/store stuff/Top Level Categories.md`

This ensures marketplace-standard categorization familiar to both vendors and customers.

---

## Deployment Notes

**Build**: Successful
**PM2 Process**: Running on port 3008
**Status**: Live at https://stores.stepperslife.com

**User Action Required**:
- Hard refresh browser (Ctrl+Shift+R) to clear old chunk cache
- Clear browser cache if experiencing issues

---

## Developer Notes

### Adding New Categories
1. Update `ProductCategory` enum in `prisma/schema.prisma`
2. Add to `PRODUCT_CATEGORIES` in `lib/categories.ts`
3. Add subcategories to `CATEGORY_SUBCATEGORIES`
4. Update Zod schemas in forms and API routes
5. Run `npx prisma db push` to sync database

### Adding New Subcategories
1. Update `CATEGORY_SUBCATEGORIES` in `lib/categories.ts`
2. No database migration needed (subcategory is a string field)
3. Rebuild and deploy

---

**Implementation Complete** ✅
All forms, API routes, and database updated to support 15-category Etsy hierarchy with subcategories.
