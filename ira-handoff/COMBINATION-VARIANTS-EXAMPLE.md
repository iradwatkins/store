# Combination Variants Example - ONE Product with Multiple Options

**Status:** ✅ **LIVE AND WORKING**
**Product:** Athletic Performance Shirt
**URL:** https://stores.stepperslife.com/store/style-haven/products/athletic-performance-shirt

---

## What Are Combination Variants?

Combination variants allow customers to choose **MULTIPLE options** for a **SINGLE product**.

For example, a shirt can have:
- **Option 1:** Color (Red, Green)
- **Option 2:** Size (Small, Medium, Large)

This creates **combination variants** where customers choose BOTH color AND size.

---

## The Example Product

### Athletic Performance Shirt

**ONE Product** with **TWO variant options**:

#### Option 1: COLOR
- Red
- Green

#### Option 2: SIZE
- Small
- Medium
- Large

**Total Combinations:** 2 colors × 3 sizes = **6 variants**

---

## All 6 Variant Combinations

This is **ONE product** that appears **6 different ways** in inventory:

```
┌─────────────────────────────────────────────────────────────┐
│ ATHLETIC PERFORMANCE SHIRT                                  │
│ Base Price: $34.99                                          │
└─────────────────────────────────────────────────────────────┘

    RED COLOR OPTIONS:
    ┌──────────────────────────────────────────────────────┐
    │ 1. Red / Small    $34.99   SKU: ATH-RED-S   30 units │
    │ 2. Red / Medium   $34.99   SKU: ATH-RED-M   30 units │
    │ 3. Red / Large    $34.99   SKU: ATH-RED-L   30 units │
    └──────────────────────────────────────────────────────┘

    GREEN COLOR OPTIONS:
    ┌──────────────────────────────────────────────────────┐
    │ 4. Green / Small  $34.99   SKU: ATH-GRN-S   30 units │
    │ 5. Green / Medium $34.99   SKU: ATH-GRN-M   30 units │
    │ 6. Green / Large  $34.99   SKU: ATH-GRN-L   30 units │
    └──────────────────────────────────────────────────────┘

    Total Stock: 180 units (30 per combination)
```

---

## How Customers See It

### On the Product Page

Customers visiting the product page will see:

**Product Name:** Athletic Performance Shirt
**Price:** $34.99

**Available Options:**

**Color:**
- [ ] Red
- [ ] Green

**Size:**
- [ ] Small
- [ ] Medium
- [ ] Large

**Example Selection:**
- Customer selects: **Red** + **Large**
- System shows: "Red / Large - $34.99 - 30 available"
- Add to cart saves: "Athletic Performance Shirt - Red / Large"

---

## Database Structure

### The Product Record (ONE record)

```sql
SELECT * FROM products WHERE id = 'prod-clothing-athletic-shirt-001';
```

```
id:                prod-clothing-athletic-shirt-001
name:              Athletic Performance Shirt
slug:              athletic-performance-shirt
price:             34.99
hasVariants:       true
useMultiVariants:  true
variantTypes:      ['Color', 'Size']
quantity:          180  (total across all variants)
```

### The Variant Records (SIX records)

```sql
SELECT name, sku, price, quantity
FROM product_variants
WHERE productId = 'prod-clothing-athletic-shirt-001'
ORDER BY sortOrder;
```

```
name              | sku       | price | quantity
------------------+-----------+-------+---------
Red / Small       | ATH-RED-S | 34.99 | 30
Red / Medium      | ATH-RED-M | 34.99 | 30
Red / Large       | ATH-RED-L | 34.99 | 30
Green / Small     | ATH-GRN-S | 34.99 | 30
Green / Medium    | ATH-GRN-M | 34.99 | 30
Green / Large     | ATH-GRN-L | 34.99 | 30
```

---

## How It Works in the Cart

### Customer Journey

**Step 1:** Customer browses to product page
```
Athletic Performance Shirt - $34.99
[Select Color] [Select Size]
```

**Step 2:** Customer selects options
```
Color: [Red ✓]  [Green]
Size:  [Small]  [Medium]  [Large ✓]
```

**Step 3:** Customer adds to cart
```
Cart now contains:
- Athletic Performance Shirt - Red / Large
  Price: $34.99
  Quantity: 1
  SKU: ATH-RED-L
```

**Step 4:** Inventory is updated
```
Red / Large stock: 30 → 29 units
(Other variants unchanged)
```

---

## Inventory Tracking

### Each Combination Tracked Separately

```
RED VARIANTS:
├── Red / Small   → 30 units in stock → SKU: ATH-RED-S
├── Red / Medium  → 30 units in stock → SKU: ATH-RED-M
└── Red / Large   → 30 units in stock → SKU: ATH-RED-L

GREEN VARIANTS:
├── Green / Small  → 30 units in stock → SKU: ATH-GRN-S
├── Green / Medium → 30 units in stock → SKU: ATH-GRN-M
└── Green / Large  → 30 units in stock → SKU: ATH-GRN-L
```

### If Red / Large Sells Out:

```
✅ Still available:
   - Red / Small (30)
   - Red / Medium (30)
   - Green / Small (30)
   - Green / Medium (30)
   - Green / Large (30)

❌ Out of stock:
   - Red / Large (0)
```

Customers can still buy Red shirts in Small or Medium, or any Green size.

---

## Real-World Scenario

### Scenario: Customer Orders

**Order 1:** Customer A buys **Red / Large**
```
Before: Red / Large = 30 units
After:  Red / Large = 29 units
All other variants: unchanged
```

**Order 2:** Customer B buys **Green / Small**
```
Before: Green / Small = 30 units
After:  Green / Small = 29 units
All other variants: unchanged
```

**Order 3:** Customer C buys **Red / Large** (same as Customer A)
```
Before: Red / Large = 29 units
After:  Red / Large = 28 units
All other variants: unchanged
```

Each variant has **independent inventory tracking**.

---

## Code Implementation

### Creating the Product

```javascript
// 1. Create the main product
const shirt = await prisma.products.create({
  data: {
    name: 'Athletic Performance Shirt',
    price: 34.99,
    hasVariants: true,
    useMultiVariants: true,
    variantTypes: ['Color', 'Size']
  }
})

// 2. Define variant options
const colors = ['Red', 'Green']
const sizes = ['Small', 'Medium', 'Large']

// 3. Create all combinations
for (const color of colors) {
  for (const size of sizes) {
    await prisma.product_variants.create({
      data: {
        productId: shirt.id,
        name: `${color} / ${size}`,
        sku: `ATH-${color}-${size}`,
        price: 34.99,
        quantity: 30
      }
    })
  }
}
```

---

## Adding to Cart with Variants

### API Request

```bash
POST /api/cart/add
Content-Type: application/json

{
  "productId": "prod-clothing-athletic-shirt-001",
  "variantId": "var-athletic-shirt-0",  // Red / Small
  "quantity": 1
}
```

### What Gets Saved

```javascript
{
  cartItemId: "cart-item-123",
  productId: "prod-clothing-athletic-shirt-001",
  productName: "Athletic Performance Shirt",
  variantId: "var-athletic-shirt-0",
  variantName: "Red / Small",
  price: 34.99,
  quantity: 1,
  sku: "ATH-RED-S"
}
```

---

## Checkout Process

### In the Order

When customer checks out, the order contains:

```javascript
{
  orderId: "order-12345",
  items: [
    {
      productName: "Athletic Performance Shirt",
      variantName: "Red / Small",
      sku: "ATH-RED-S",
      price: 34.99,
      quantity: 1,
      subtotal: 34.99
    }
  ]
}
```

### Vendor Dashboard

Vendor sees the exact variant ordered:
```
Order #12345
- Athletic Performance Shirt
  Variant: Red / Small
  SKU: ATH-RED-S
  Price: $34.99
  Qty: 1
```

This tells them exactly which shirt to ship.

---

## Other Examples of Combination Variants

### More Products You Can Create:

**1. Shoes**
- Colors: Black, Brown, White
- Sizes: 7, 8, 9, 10, 11, 12
- Total: 3 × 6 = **18 variants**

**2. Laptop**
- RAM: 8GB, 16GB, 32GB
- Storage: 256GB, 512GB, 1TB
- Total: 3 × 3 = **9 variants**

**3. Coffee Blend**
- Roast: Light, Medium, Dark
- Grind: Whole Bean, Fine, Coarse
- Total: 3 × 3 = **9 variants**

**4. Candle**
- Size: Small (4oz), Medium (8oz), Large (16oz)
- Scent: Lavender, Vanilla, Cinnamon
- Total: 3 × 3 = **9 variants**

---

## Key Benefits

### For Customers
✅ Choose exactly what they want (color AND size)
✅ See real-time availability per combination
✅ Clear pricing for each option
✅ Easy to compare variants

### For Vendors
✅ Track inventory per specific combination
✅ Know exactly which variant to ship
✅ Unique SKU for each variant
✅ Prevent overselling specific combinations

### For Store
✅ ONE product page for all variants
✅ Better SEO (one URL, not separate pages)
✅ Easier to manage (update once, affects all)
✅ Professional shopping experience

---

## Testing the Product

### View the Live Product

**URL:** https://stores.stepperslife.com/store/style-haven/products/athletic-performance-shirt

### What You'll See:

1. Product image
2. Product name: "Athletic Performance Shirt"
3. Price: $34.99
4. Variant selector showing all 6 options:
   - Red / Small
   - Red / Medium
   - Red / Large
   - Green / Small
   - Green / Medium
   - Green / Large
5. Stock availability for each
6. Add to Cart button

### Try It:
1. Select "Green / Large"
2. Click "Add to Cart"
3. View cart - should show: "Athletic Performance Shirt - Green / Large"

---

## Summary

### One Product, Six Ways to Buy It

```
PRODUCT: Athletic Performance Shirt ($34.99)

Customer can choose from 6 combinations:

RED                    GREEN
├── Small  ($34.99)   ├── Small  ($34.99)
├── Medium ($34.99)   ├── Medium ($34.99)
└── Large  ($34.99)   └── Large  ($34.99)
```

### Database Summary

- **1 Product Record:** Athletic Performance Shirt
- **6 Variant Records:** One for each color/size combination
- **6 Unique SKUs:** ATH-RED-S, ATH-RED-M, ATH-RED-L, ATH-GRN-S, ATH-GRN-M, ATH-GRN-L
- **180 Total Units:** 30 per variant

### System Status

✅ Product created
✅ All 6 variants created
✅ Images uploaded
✅ Displaying on website
✅ Available for purchase
✅ Inventory tracking active
✅ Cart system compatible
✅ Checkout ready

---

**This is exactly how real e-commerce stores like Amazon, Nike, and clothing retailers handle product variations!**

---

*Created: 2025-11-06*
*Product Status: Live*
*Variants Status: All Active*
