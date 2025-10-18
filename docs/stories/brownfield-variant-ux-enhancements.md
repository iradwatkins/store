# Story: User-Friendly Variant & Product Options System

<!-- Source: Brownfield UX enhancement - Focus on ease of use -->
<!-- Context: Making complex multi-variant products simple for vendors and customers -->

## Status: Draft - UX Priority

## Story

As a **vendor selling any type of product** (clothing, jewelry, art, home goods, electronics, etc.),
I want **an intuitive, visual way to add product options** (sizes, colors, materials, styles, add-ons),
so that **I can set up my products quickly regardless of what I'm selling**.

As a **customer shopping for products with options**,
I want **a clear, visual way to see and select my preferences**,
so that **I know exactly what I'm buying before adding to cart**.

## Context: Multi-Category Marketplace

This is a **multi-vendor marketplace** where vendors can sell **anything** - not just clothing. The variant system must be flexible enough to support:

- 👕 **Apparel**: T-shirts (Size + Color), Shoes (Size + Width + Color), Hats (Size + Style)
- 💍 **Jewelry**: Rings (Size + Metal + Stone), Necklaces (Length + Material), Earrings (Style + Metal)
- 🎨 **Art**: Prints (Size + Frame + Material), Paintings (Size + Canvas Type)
- 🏠 **Home Goods**: Furniture (Color + Material + Size), Decor (Finish + Size)
- 📱 **Electronics**: Accessories (Color + Compatibility + Size)
- 🎁 **Handmade**: Custom items (Material + Color + Personalization)
- 🍰 **Food**: Bakery items (Size + Flavor + Dietary Options)
- 🌱 **Plants**: Size + Pot Type + Care Level
- 📚 **Books**: Format (Hardcover/Paperback/eBook) + Signed Options
- And literally **anything else** vendors want to sell

**Key Requirement**: The system must be **flexible and intuitive** for ANY product category, not just pre-defined types.

## User Experience Problems (Current System)

### 😓 **Vendor Pain Points**

1. **Confusing Variant Setup**
   - Current: Radio buttons for "None/Size/Color" - unclear what this means
   - New vendors don't understand the difference
   - Can't do both size AND color without creating multiple products

2. **Tedious Data Entry**
   - Must manually enter price, SKU, inventory for EVERY variant
   - Example: 5 sizes × 3 colors = 15 rows to fill out manually
   - No quick way to say "all variants cost $29.99"

3. **No Visual Feedback**
   - Variant table is just text and numbers
   - Can't see what the product will look like
   - Hard to spot mistakes (e.g., forgot to set inventory for "Red - Large")

4. **Complex Edit Process**
   - To add a new color after product creation: 15+ clicks
   - Each variant requires opening modal, filling 5 fields, saving
   - No undo if you make a mistake

### 😕 **Customer Pain Points**

1. **Unclear Selection State**
   - Hard to tell if you've selected all required options
   - No preview of selected combination
   - Price doesn't update until you click "Add to Cart"

2. **Out-of-Stock Confusion**
   - Not immediately clear which combinations are unavailable
   - Can select Size M + Color Red, then get error that it's out of stock

3. **No Visual Product Representation**
   - Selecting "Blue" doesn't show blue version of product
   - Customers can't visualize what they're buying

## UX-First Solution: Progressive Complexity

### 🎯 **Core Principle**: Start Simple, Add Complexity Only When Needed

```
┌─────────────────────────────────────────────────────────────┐
│ Product Setup Wizard                                        │
│                                                             │
│ Step 1 of 4: Does this product have options?               │
│                                                             │
│ 🔘 No - This is a simple product (single price, inventory)│
│    Example: Handmade vase, art print                       │
│                                                             │
│ ○  Yes - This product has options                          │
│    Example: T-shirt in multiple sizes/colors               │
│                                                             │
│                                  [Next Step →]             │
└─────────────────────────────────────────────────────────────┘
```

If "Yes" is selected, progressive disclosure:

```
┌─────────────────────────────────────────────────────────────┐
│ Step 2 of 4: What kinds of options?                        │
│                                                             │
│ Select all that apply (pick what makes sense for your      │
│ product - clothing, jewelry, art, electronics, anything!):  │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│ │   📏 Size       │ │   🎨 Color      │ │  ✨ Material │ │
│ │   [✓]           │ │   [✓]           │ │  [ ]         │ │
│ │   Clothing, art,│ │   Any colored   │ │  Metal, wood,│ │
│ │   furniture     │ │   product       │ │  fabric, etc.│ │
│ └─────────────────┘ └─────────────────┘ └───────────────┘ │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│ │   🎨 Finish     │ │   🎭 Style      │ │  📦 Format   │ │
│ │   [ ]           │ │   [ ]           │ │  [ ]         │ │
│ │   Gloss, matte, │ │   Modern,       │ │  Book format,│ │
│ │   textured      │ │   vintage, etc. │ │  digital, etc│ │
│ └─────────────────┘ └─────────────────┘ └───────────────┘ │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│ │   🎁 Add-ons    │ │   💌 Custom     │ │  [+ Add Your │ │
│ │   [ ]           │ │   [ ]           │ │     Own]     │ │
│ │   Gift wrap,    │ │   Create your   │ │              │ │
│ │   rush shipping │ │   own type      │ │              │ │
│ └─────────────────┘ └─────────────────┘ └───────────────┘ │
│                                                             │
│ 💡 Tip: Don't see what you need? Click [+ Add Your Own] to │
│         create custom option types for your unique products │
│                                                             │
│                        [← Back]  [Next Step →]             │
└─────────────────────────────────────────────────────────────┘
```

### 📦 **Smart Defaults & Templates (for ANY Product Type)**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 3 of 4: Size Options                                  │
│                                                             │
│ 🎯 Quick Start (choose a template or create custom):       │
│                                                             │
│ Clothing Sizes:                                             │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐│
│ │ 👕 Standard T-Shirt     │ │ 👔 Dress Shirt Sizes       ││
│ │ [Use Template]          │ │ [Use Template]             ││
│ │ • XS, S, M, L, XL, 2XL  │ │ • 14, 14.5, 15, 15.5...    ││
│ └─────────────────────────┘ └─────────────────────────────┘│
│                                                             │
│ Other Common Sizes:                                         │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐│
│ │ 👟 Shoe Sizes (US)      │ │ 💍 Ring Sizes (US)         ││
│ │ [Use Template]          │ │ [Use Template]             ││
│ │ • 6, 6.5, 7, 7.5, 8...  │ │ • 4, 4.5, 5, 5.5, 6...     ││
│ └─────────────────────────┘ └─────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐│
│ │ 🖼️ Art Print Sizes      │ │ 🪴 Plant Pot Sizes         ││
│ │ [Use Template]          │ │ [Use Template]             ││
│ │ • 5x7, 8x10, 11x14...   │ │ • 4", 6", 8", 10"          ││
│ └─────────────────────────┘ └─────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐│
│ │ 📱 Device Sizes         │ │ 🎨 Custom Sizes            ││
│ │ [Use Template]          │ │ [Build My Own]             ││
│ │ • Phone, Tablet, Laptop │ │ • Enter your own sizes     ││
│ └─────────────────────────┘ └─────────────────────────────┘│
│                                                             │
│ 💡 Selling something unique? Use "Custom" to create any    │
│    size options you need!                                   │
│                                                             │
│                        [← Back]  [Next Step →]             │
└─────────────────────────────────────────────────────────────┘
```

After template selection or custom entry:

```
┌─────────────────────────────────────────────────────────────┐
│ Your Size Options:                                          │
│                                                             │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌────┐ ┌─────┐                   │
│ │ XS│ │ S │ │ M │ │ L │ │ XL │ │ 2XL │                   │
│ └───┘ └───┘ └───┘ └───┘ └────┘ └─────┘                   │
│                                                             │
│ ┌──────────────────────┐                                   │
│ │ + Add Custom Size    │                                   │
│ └──────────────────────┘                                   │
│                                                             │
│ [← Back]  [Next: Color Options →]                          │
└─────────────────────────────────────────────────────────────┘
```

### 🎨 **Visual Color Selection**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 4 of 4: Color Options                                 │
│                                                             │
│ 🎯 Quick Start (choose popular colors):                    │
│                                                             │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                │
│ │ ⬛ │ │ ⬜ │ │ 🟥 │ │ 🟦 │ │ 🟩 │ │ 🟨 │                │
│ │ ✓  │ │ ✓  │ │ ✓  │ │    │ │    │ │    │                │
│ │Blck│ │Whit│ │Red │ │Blue│ │Grn │ │Ylw │                │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                │
│                                                             │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                │
│ │ 🟧 │ │ 🟪 │ │ 🟫 │ │ 🩷 │ │ 🩶 │ │ 🌟 │                │
│ │    │ │    │ │    │ │    │ │    │ │Gold│                │
│ │Orng│ │Prpl│ │Brwn│ │Pink│ │Gray│ │    │                │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                │
│                                                             │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ + Add Custom Color                                       ││
│ │ Color Name: [Rose Gold         ] 🎨 Color Picker        ││
│ │ Upload Photo: [Choose File]                              ││
│ └──────────────────────────────────────────────────────────┘│
│                                                             │
│                        [← Back]  [Review & Finish →]       │
└─────────────────────────────────────────────────────────────┘
```

### ⚡ **Smart Bulk Management**

Instead of tedious table entry, use smart defaults:

```
┌─────────────────────────────────────────────────────────────┐
│ Product Variants Summary                                    │
│                                                             │
│ You've created: 6 sizes × 3 colors = 18 variants           │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🎯 Quick Setup (Recommended)                          │  │
│ │                                                        │  │
│ │ All variants have the same:                            │  │
│ │                                                        │  │
│ │ Price:     [$29.99          ]                          │  │
│ │ Inventory: [50              ] per variant              │  │
│ │ SKU:       [AUTO-GENERATE   ] ✓                        │  │
│ │                                                        │  │
│ │ [Apply to All Variants]                                │  │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 Tip: You can adjust individual variants after creation  │
│                                                             │
│ OR                                                          │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🔧 Advanced: Set each variant individually            │  │
│ │ [Show Variant Table]                                   │  │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                 [← Back]  [Save Product →]                  │
└─────────────────────────────────────────────────────────────┘
```

If "Advanced" selected, progressive disclosure of table:

```
┌──────────────────────────────────────────────────────────────┐
│ Variant Details (18 variants)                               │
│                                                              │
│ ⚡ Bulk Actions:                                             │
│ [Set Price for All Red ▾] [Set Inventory by Size ▾]        │
│                                                              │
│ ┌──────┬───────┬────────┬─────────┬─────────┬────────────┐ │
│ │ Size │ Color │ Price  │ SKU     │ Stock   │ Status     │ │
│ ├──────┼───────┼────────┼─────────┼─────────┼────────────┤ │
│ │ XS   │ Black │ $29.99 │ TSH-XS-│   50    │ ⚠️ No Img  │ │
│ │      │   ⬛  │  [✏️]  │ BLK     │  [✏️]  │ [Add →]    │ │
│ ├──────┼───────┼────────┼─────────┼─────────┼────────────┤ │
│ │ XS   │ White │ $29.99 │ TSH-XS-│   50    │ ⚠️ No Img  │ │
│ │      │   ⬜  │  [✏️]  │ WHT     │  [✏️]  │ [Add →]    │ │
│ ├──────┼───────┼────────┼─────────┼─────────┼────────────┤ │
│ │ XS   │ Red   │ $29.99 │ TSH-XS-│   50    │ ⚠️ No Img  │ │
│ │      │   🟥  │  [✏️]  │ RED     │  [✏️]  │ [Add →]    │ │
│ └──────┴───────┴────────┴─────────┴─────────┴────────────┘ │
│                                                              │
│ 💡 Tip: Click [✏️] to edit, or use Bulk Actions above      │
│                                                              │
│ Showing 3 of 18 | [Load More]                               │
│                                                              │
│                   [← Back]  [Save Product →]                 │
└──────────────────────────────────────────────────────────────┘
```

### 🛍️ **Customer-Facing: Clear, Visual Selection**

Product page with multi-variant:

```
┌──────────────────────────────────────────────────────────────┐
│ Chicago Steppin T-Shirt                                      │
│ ⭐⭐⭐⭐⭐ (42 reviews)                          $29.99      │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 📸 [Product Image]                                       ││
│ │                                                          ││
│ │     [Currently showing: Black / Medium]                  ││
│ │                                                          ││
│ │ ◀  [ Black T-Shirt Photo ]  ▶                           ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                              │
│ 🎨 Color: Black                                              │
│                                                              │
│ ┌────┐ ┌────┐ ┌────┐                                        │
│ │ ⬛ │ │ ⬜ │ │ 🟥 │  ← Click to see that color             │
│ │ ✓  │ │    │ │    │                                        │
│ │Blck│ │Whit│ │Red │                                        │
│ └────┘ └────┘ └────┘                                        │
│   ↑ Selected                                                 │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                              │
│ 👕 Size: Medium                                              │
│                                                              │
│ ┌────┐ ┌────┐ ┌─────┐ ┌────┐ ┌─────┐ ┌──────┐             │
│ │ XS │ │ S  │ │  M  │ │ L  │ │ XL  │ │ 2XL  │             │
│ │    │ │    │ │  ✓  │ │    │ │     │ │      │             │
│ └────┘ └────┘ └─────┘ └────┘ └─────┘ └──────┘             │
│                  ↑ Selected                                  │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                              │
│ ✅ In Stock - 47 available                                  │
│                                                              │
│ Quantity: ┌───┐ ┌───┐ ┌───┐                                │
│           │ - │ │ 1 │ │ + │                                │
│           └───┘ └───┘ └───┘                                │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                              │
│ 🎁 Add Extras (Optional):                                   │
│                                                              │
│ ┌──────────────────────────────────────────────────┐        │
│ │ ☐ Gift Wrapping (+$5.00)                         │        │
│ │   Beautiful gift box with ribbon                 │        │
│ └──────────────────────────────────────────────────┘        │
│                                                              │
│ ┌──────────────────────────────────────────────────┐        │
│ │ ☐ Express Shipping (+$15.00)                     │        │
│ │   Delivery in 2-3 business days                  │        │
│ └──────────────────────────────────────────────────┘        │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                              │
│ Total: $29.99                                                │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │          🛒 ADD TO CART                                 │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key UX Improvements:**
- ✅ **Visual feedback**: Product image changes when color selected
- ✅ **Clear status**: "In Stock - 47 available" vs vague availability
- ✅ **Progressive disclosure**: Add-ons are optional, don't clutter initial view
- ✅ **Mobile-friendly**: Large touch targets for size/color selection
- ✅ **Real-time price**: Total updates as you add options

### 🚫 **Error Prevention & Guidance**

Smart validation prevents mistakes:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Missing Required Information                             │
│                                                             │
│ Before you can publish this product:                        │
│                                                             │
│ ❌ 3 variants have no inventory set                         │
│    → [Quick Fix: Set All to 50]                             │
│                                                             │
│ ❌ "Red - XL" variant has no photo                          │
│    → [Use main product photo] or [Upload specific photo]    │
│                                                             │
│ ⚠️ Recommended: Add product dimensions for shipping         │
│    → [Add Dimensions]                                       │
│                                                             │
│                  [Fix These Issues]  [Save as Draft]        │
└─────────────────────────────────────────────────────────────┘
```

### 📱 **Mobile-First Design**

All screens optimized for phone/tablet:
- Large touch targets (minimum 44×44px)
- Swipeable color/size selection
- Bottom-sheet modals for variant tables
- Sticky "Add to Cart" button

### ♿ **Accessibility**

- Screen reader announcements: "Black color selected, Medium size selected, 47 in stock"
- Keyboard navigation for all controls
- High contrast mode support
- Clear focus indicators

## Technical Implementation (Simplified)

### Frontend Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│ ProductCreationWizard.tsx (NEW)                         │
│                                                         │
│ ├─ Step1: ProductTypeSelector                          │
│ ├─ Step2: VariantTypeSelector                          │
│ ├─ Step3: VariantOptionsSelector (per type)            │
│ │   ├─ SizeTemplateSelector                            │
│ │   ├─ ColorPaletteSelector                            │
│ │   └─ CustomOptionInput                               │
│ ├─ Step4: VariantBulkSetup (smart defaults)            │
│ │   ├─ QuickSetupForm (recommended)                    │
│ │   └─ AdvancedVariantTable (optional)                 │
│ └─ Step5: AddonsManager (optional)                     │
│                                                         │
│ Components:                                             │
│ • WizardProgress (shows 1 of 5 steps)                   │
│ • SmartDefaults (pre-fill common values)                │
│ • ValidationHelper (real-time error checking)           │
│ • PreviewPanel (live product preview)                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ CustomerVariantSelector.tsx (ENHANCED)                  │
│                                                         │
│ ├─ VisualOptionSelector (renders per type)             │
│ │   ├─ ColorSwatchGrid (for colors)                    │
│ │   ├─ SizeButtonGroup (for sizes)                     │
│ │   └─ GenericDropdown (for other types)               │
│ ├─ VariantImageDisplay (updates on selection)          │
│ ├─ AvailabilityIndicator (real-time stock check)       │
│ ├─ PriceDisplay (updates with selections)              │
│ └─ AddToCartButton (validates all selections)          │
└─────────────────────────────────────────────────────────┘
```

### Preset Data (Pre-configured for ease)

```typescript
// lib/variant-presets.ts

export const SIZE_TEMPLATES = {
  // CLOTHING
  'standard-tshirt': {
    name: 'Standard T-Shirt Sizes',
    category: 'Clothing',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
  },
  'mens-dress-shirt': {
    name: "Men's Dress Shirt Sizes",
    category: 'Clothing',
    sizes: ['14', '14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18']
  },
  'us-shoe-mens': {
    name: 'US Shoe Sizes (Men)',
    category: 'Footwear',
    sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14']
  },
  'us-shoe-womens': {
    name: 'US Shoe Sizes (Women)',
    category: 'Footwear',
    sizes: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11']
  },

  // JEWELRY
  'ring-sizes-us': {
    name: 'Ring Sizes (US)',
    category: 'Jewelry',
    sizes: ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12']
  },
  'necklace-length': {
    name: 'Necklace Lengths',
    category: 'Jewelry',
    sizes: ['14"', '16"', '18"', '20"', '22"', '24"', '30"']
  },
  'bracelet-sizes': {
    name: 'Bracelet Sizes',
    category: 'Jewelry',
    sizes: ['6"', '6.5"', '7"', '7.5"', '8"', '8.5"']
  },

  // ART & PRINTS
  'art-print-standard': {
    name: 'Standard Print Sizes',
    category: 'Art',
    sizes: ['5x7', '8x10', '11x14', '16x20', '18x24', '24x36']
  },
  'canvas-sizes': {
    name: 'Canvas Sizes',
    category: 'Art',
    sizes: ['8x10', '11x14', '16x20', '18x24', '24x30', '30x40']
  },

  // HOME & DECOR
  'furniture-sizes': {
    name: 'Furniture Sizes',
    category: 'Home',
    sizes: ['Twin', 'Full', 'Queen', 'King', 'Cal King']
  },
  'plant-pot-sizes': {
    name: 'Plant Pot Sizes',
    category: 'Plants',
    sizes: ['2"', '4"', '6"', '8"', '10"', '12"']
  },

  // ELECTRONICS
  'device-compatibility': {
    name: 'Device Sizes',
    category: 'Electronics',
    sizes: ['Phone', 'Tablet', 'Laptop', 'Desktop']
  },

  // FOOD & BEVERAGE
  'cake-sizes': {
    name: 'Cake Sizes',
    category: 'Food',
    sizes: ['6" (Serves 8-10)', '8" (Serves 12-16)', '10" (Serves 20-25)', '12" (Serves 30-40)']
  }
}

export const COLOR_PALETTE = [
  // Basic Colors (universal)
  { name: 'Black', hex: '#000000', icon: '⬛' },
  { name: 'White', hex: '#FFFFFF', icon: '⬜' },
  { name: 'Red', hex: '#DC2626', icon: '🟥' },
  { name: 'Blue', hex: '#2563EB', icon: '🟦' },
  { name: 'Green', hex: '#16A34A', icon: '🟩' },
  { name: 'Yellow', hex: '#EAB308', icon: '🟨' },
  { name: 'Orange', hex: '#EA580C', icon: '🟧' },
  { name: 'Purple', hex: '#9333EA', icon: '🟪' },
  { name: 'Brown', hex: '#92400E', icon: '🟫' },
  { name: 'Pink', hex: '#EC4899', icon: '🩷' },
  { name: 'Gray', hex: '#6B7280', icon: '🩶' },
  { name: 'Navy', hex: '#1E3A8A', icon: '🔷' },
  { name: 'Beige', hex: '#D4A574', icon: '🟤' },
  { name: 'Gold', hex: '#D97706', icon: '🌟' },
  { name: 'Silver', hex: '#9CA3AF', icon: '💿' },
  { name: 'Rose Gold', hex: '#B76E79', icon: '🩷' },
  { name: 'Copper', hex: '#B87333', icon: '🟤' }
]

export const MATERIAL_OPTIONS = {
  jewelry: ['Sterling Silver', 'Gold', '14K Gold', '18K Gold', 'Rose Gold', 'Platinum', 'Stainless Steel', 'Brass', 'Copper'],
  art: ['Canvas', 'Paper', 'Metal', 'Wood', 'Acrylic', 'Glass'],
  clothing: ['Cotton', '100% Cotton', 'Polyester', 'Cotton Blend', 'Linen', 'Silk', 'Wool', 'Denim', 'Leather'],
  furniture: ['Wood', 'Oak', 'Pine', 'Walnut', 'Metal', 'Plastic', 'Fabric', 'Leather', 'Rattan'],
  electronics: ['Plastic', 'Silicone', 'Leather', 'Fabric', 'Metal', 'Wood']
}

export const STYLE_OPTIONS = {
  general: ['Modern', 'Vintage', 'Classic', 'Contemporary', 'Rustic', 'Minimalist', 'Boho', 'Industrial'],
  jewelry: ['Dainty', 'Statement', 'Minimalist', 'Vintage', 'Modern', 'Classic'],
  art: ['Abstract', 'Realistic', 'Modern', 'Traditional', 'Pop Art', 'Impressionist']
}

export const FORMAT_OPTIONS = {
  books: ['Hardcover', 'Paperback', 'eBook', 'Audiobook', 'Large Print'],
  art: ['Print Only', 'Framed', 'Canvas Stretched', 'Canvas Rolled', 'Matted'],
  digital: ['Digital Download', 'Physical CD', 'USB Drive', 'Cloud Access']
}

export const ADDON_TEMPLATES = [
  {
    name: 'Gift Wrapping',
    description: 'Beautiful gift box with ribbon',
    price: 5.00,
    icon: '🎁'
  },
  {
    name: 'Express Shipping',
    description: '2-3 business day delivery',
    price: 15.00,
    icon: '📦'
  },
  {
    name: 'Personalized Card',
    description: 'Add a custom message card',
    price: 3.00,
    icon: '💌'
  }
]
```

## Acceptance Criteria (UX-Focused)

### Vendor Experience

1. **Wizard Onboarding**
   - [ ] New vendors complete product setup in < 5 minutes
   - [ ] Wizard progress clearly visible (Step X of Y)
   - [ ] Can go back to previous steps without losing data
   - [ ] Helpful tips displayed at each step

2. **Template Usage**
   - [ ] Pre-built templates for common product types
   - [ ] One-click apply template (sizes, colors)
   - [ ] Templates save 80% of data entry time

3. **Smart Defaults**
   - [ ] "Apply to all variants" button works for price, inventory, SKU
   - [ ] Auto-generated SKUs follow logical pattern (PROD-SIZE-COLOR)
   - [ ] Sensible default values pre-filled

4. **Error Prevention**
   - [ ] Real-time validation (shows errors as you type)
   - [ ] Quick fix buttons for common issues
   - [ ] Clear explanation of what's wrong and how to fix it
   - [ ] Can save as draft with incomplete data

5. **Visual Feedback**
   - [ ] Product preview updates in real-time
   - [ ] Clear indication of what's selected vs available
   - [ ] Success animations when actions complete
   - [ ] Loading states for async operations

### Customer Experience

6. **Visual Selection**
   - [ ] Color swatches show actual product colors
   - [ ] Size buttons are large, easy to tap on mobile
   - [ ] Selected options have clear visual indicator
   - [ ] Disabled options (out of stock) are grayed out

7. **Image Updates**
   - [ ] Product image changes when color selected (if variant image exists)
   - [ ] Smooth transition between images (fade effect)
   - [ ] Image zoom works on mobile (pinch to zoom)

8. **Real-Time Feedback**
   - [ ] Price updates instantly when options selected
   - [ ] Stock availability shown for current selection
   - [ ] "Add to Cart" button disabled if required options not selected
   - [ ] Tooltip explains why button is disabled

9. **Mobile Optimization**
   - [ ] Swipeable color/size selection
   - [ ] Bottom sheet for variant details
   - [ ] Sticky "Add to Cart" button visible while scrolling
   - [ ] Touch targets are 44×44px minimum

10. **Accessibility**
    - [ ] Screen reader announces selection changes
    - [ ] Keyboard navigation works for all controls
    - [ ] High contrast mode support
    - [ ] Focus indicators clearly visible

## Tasks / Subtasks (UX-First Implementation)

### Phase 1: Wizard Framework

- [ ] **Task 1: Create wizard component structure**
  - [ ] Build `ProductCreationWizard.tsx` with step navigation
  - [ ] Add progress indicator (Step X of Y)
  - [ ] Implement back/next navigation with data persistence
  - [ ] Add "Save as Draft" option at any step

- [ ] **Task 2: Design wizard steps**
  - [ ] Step 1: Product Type (Simple vs Options)
  - [ ] Step 2: Option Types (Size, Color, Material, Add-ons)
  - [ ] Step 3: Configure each option type
  - [ ] Step 4: Smart defaults & bulk setup
  - [ ] Step 5: Review & publish

### Phase 2: Preset Templates & Smart Defaults

- [ ] **Task 3: Create preset data files**
  - [ ] Define size templates (clothing, shoes, etc.)
  - [ ] Define color palette with hex codes
  - [ ] Create addon templates
  - [ ] Add icons/emojis for visual representation

- [ ] **Task 4: Build template selector UI**
  - [ ] Visual template cards (not just dropdowns)
  - [ ] Preview what template includes
  - [ ] One-click apply
  - [ ] Option to customize after applying

- [ ] **Task 5: Implement smart defaults**
  - [ ] "Apply to all variants" button
  - [ ] Auto-generate SKUs (configurable pattern)
  - [ ] Bulk inventory setter
  - [ ] Bulk price modifier

### Phase 3: Visual Option Selectors

- [ ] **Task 6: Build color swatch component**
  - [ ] Large, clickable color circles with hex colors
  - [ ] Selected state indicator
  - [ ] Color name label
  - [ ] Custom color picker integration

- [ ] **Task 7: Build size button component**
  - [ ] Button group with clear selected state
  - [ ] Support for various size formats (XS-3XL, numeric, custom)
  - [ ] Responsive grid layout

- [ ] **Task 8: Create generic option selector**
  - [ ] For variant types beyond size/color
  - [ ] Dropdown for many options, buttons for few
  - [ ] Search functionality for large lists

### Phase 4: Real-Time Validation & Feedback

- [ ] **Task 9: Implement validation system**
  - [ ] Real-time error checking (as user types)
  - [ ] Error messages with suggested fixes
  - [ ] Quick fix buttons (e.g., "Set all to 50")
  - [ ] Block publishing if critical issues exist

- [ ] **Task 10: Add visual feedback**
  - [ ] Success animations (checkmarks, green highlights)
  - [ ] Loading spinners for async operations
  - [ ] Toast notifications for actions
  - [ ] Smooth transitions between states

### Phase 5: Mobile Optimization

- [ ] **Task 11: Make wizard mobile-friendly**
  - [ ] Responsive layout for all steps
  - [ ] Large touch targets (44×44px min)
  - [ ] Bottom sheets for complex inputs
  - [ ] Swipe gestures for navigation

- [ ] **Task 12: Optimize customer selection for mobile**
  - [ ] Sticky "Add to Cart" button
  - [ ] Collapsible sections
  - [ ] Swipeable image gallery
  - [ ] Pinch-to-zoom on product images

### Phase 6: Customer-Facing Enhancements

- [ ] **Task 13: Build visual variant selector**
  - [ ] Color swatches with images
  - [ ] Size button grid
  - [ ] Real-time stock checking
  - [ ] Price updates on selection

- [ ] **Task 14: Implement variant image switching**
  - [ ] Load variant-specific images
  - [ ] Smooth fade transitions
  - [ ] Fallback to main product images
  - [ ] Preload images for performance

- [ ] **Task 15: Add addon selection UI**
  - [ ] Optional addon checkboxes
  - [ ] Required addon highlighting
  - [ ] Price breakdown (base + addons)

### Phase 7: Accessibility & Polish

- [ ] **Task 16: Add accessibility features**
  - [ ] ARIA labels for all interactive elements
  - [ ] Screen reader announcements
  - [ ] Keyboard navigation
  - [ ] Focus management (trap focus in modals)

- [ ] **Task 17: High contrast & theme support**
  - [ ] Test in high contrast mode
  - [ ] Ensure sufficient color contrast (WCAG AA)
  - [ ] Dark mode support

- [ ] **Task 18: Performance optimization**
  - [ ] Lazy load variant tables
  - [ ] Debounce real-time validation
  - [ ] Optimize image loading
  - [ ] Code split wizard components

### Phase 8: User Testing & Iteration

- [ ] **Task 19: Conduct usability testing**
  - [ ] Test with 5 vendors (varying tech savvy)
  - [ ] Record session (watch for confusion)
  - [ ] Time to complete product setup
  - [ ] Identify pain points

- [ ] **Task 20: Iterate based on feedback**
  - [ ] Address common confusion points
  - [ ] Simplify complex steps
  - [ ] Add more helpful tips
  - [ ] Improve error messages

## Success Metrics (UX-Focused)

### Vendor Metrics
- [ ] **Time to create product**: < 5 minutes (vs 15+ currently)
- [ ] **Setup completion rate**: > 80% (finish wizard without abandoning)
- [ ] **Error rate**: < 5% (products created with issues)
- [ ] **Template usage**: > 60% of vendors use templates
- [ ] **Satisfaction score**: > 4.5/5 (post-setup survey)

### Customer Metrics
- [ ] **Cart abandonment reduction**: -20% (clearer selection = more checkouts)
- [ ] **Add to cart time**: < 30 seconds (faster selection process)
- [ ] **Support tickets**: -30% (fewer questions about how to order)
- [ ] **Mobile conversion**: Matches desktop (currently lower)

## Notes

### Design Principles Applied

1. **Progressive Disclosure**: Show simple options first, advanced options on demand
2. **Smart Defaults**: Pre-fill sensible values to reduce manual entry
3. **Visual Hierarchy**: Most important actions are most prominent
4. **Error Prevention**: Validate early, provide quick fixes
5. **Feedback**: Instant visual feedback for all actions
6. **Accessibility**: Usable by everyone, including screen readers and keyboard-only

### Inspiration & Best Practices

- **Shopify**: Excellent variant management, great templates
- **Etsy**: Simple product creation, good for non-technical sellers
- **WooCommerce**: Comprehensive but complex (we aim for simpler)
- **Faire**: B2B marketplace with clean variant selection

### Implementation Priority

1. ⭐⭐⭐ **Wizard Framework** - Foundation for good UX
2. ⭐⭐⭐ **Templates & Smart Defaults** - Biggest time saver
3. ⭐⭐ **Visual Selectors** - Improves clarity
4. ⭐⭐ **Real-Time Validation** - Prevents errors
5. ⭐ **Animations & Polish** - Nice to have

---

**Story Type**: UX Enhancement (Brownfield)
**Estimated Effort**: 15-20 days (including design & testing)
**User Impact**: HIGH - Affects all vendors creating products with variants
**Technical Complexity**: MEDIUM - Mostly frontend, some backend API adjustments
