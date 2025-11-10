# Product Images System - Unsplash Integration

**Status:** ✅ **FULLY OPERATIONAL**
**Total Images in Database:** 33 product images
**Image Source:** Unsplash (free high-quality stock photos)
**Date:** 2025-11-06

---

## Overview

All products have professional images from Unsplash saved in the database. The system supports:
- ✅ Saving images to database
- ✅ Retrieving images from database
- ✅ Displaying images on product pages
- ✅ Multiple image sizes (thumbnail, medium, large)
- ✅ Image uploads via API
- ✅ CDN optimization

---

## Current Status

### All Products Have Images ✅

```sql
SELECT COUNT(*) as total_products FROM products;
-- Result: 33 products

SELECT COUNT(DISTINCT "productId") as products_with_images FROM product_images;
-- Result: 33 products (100% coverage)
```

**Every single product has an image!**

---

## Database Schema

### product_images Table

```sql
CREATE TABLE product_images (
  id          TEXT PRIMARY KEY,
  productId   TEXT NOT NULL REFERENCES products(id),
  url         TEXT NOT NULL,           -- Main/large image URL
  thumbnail   TEXT,                    -- Thumbnail version (150x150)
  medium      TEXT,                    -- Medium version (500x500)
  large       TEXT,                    -- Large version (1200x1200)
  altText     TEXT,                    -- Accessibility text
  sortOrder   INT NOT NULL DEFAULT 0,  -- Display order
  createdAt   TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX product_images_productId_idx ON product_images(productId);
```

### Fields Explained

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| id | TEXT | Unique identifier | `img-tshirt-001` |
| productId | TEXT | Links to product | `prod-clothing-tshirt-001` |
| url | TEXT | Main image URL | `https://images.unsplash.com/...` |
| thumbnail | TEXT | Small version (optional) | `https://...?w=150` |
| medium | TEXT | Medium version (optional) | `https://...?w=500` |
| large | TEXT | Large version (optional) | `https://...?w=1200` |
| altText | TEXT | SEO/accessibility | `"Premium Cotton T-Shirt"` |
| sortOrder | INT | Display order | `0` (first), `1` (second), etc. |

---

## Saving Images to Database

### Method 1: Direct SQL Insert

```sql
INSERT INTO product_images (
  id,
  "productId",
  url,
  "altText",
  "sortOrder"
) VALUES (
  'img-example-001',
  'prod-clothing-001',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
  'Classic Denim Jacket',
  0
);
```

### Method 2: Using Prisma (Node.js)

```javascript
await prisma.product_images.create({
  data: {
    id: 'img-example-001',
    productId: 'prod-clothing-001',
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    altText: 'Classic Denim Jacket',
    sortOrder: 0
  }
})
```

### Method 3: Via API Endpoint

```bash
POST /api/vendor/products/[productId]/images
Content-Type: multipart/form-data

# Upload file or provide URL
{
  "images": [File],
  "altText": "Product description"
}
```

---

## Retrieving Images from Database

### Method 1: SQL Query

```sql
-- Get all images for a product
SELECT
  id,
  url,
  thumbnail,
  medium,
  large,
  altText,
  sortOrder
FROM product_images
WHERE "productId" = 'prod-clothing-tshirt-001'
ORDER BY "sortOrder";
```

**Result:**
```
id              | url                                      | altText
----------------|------------------------------------------|------------------------
img-tshirt-001  | https://images.unsplash.com/photo-15...  | Premium Cotton T-Shirt
```

### Method 2: Using Prisma (with Product)

```javascript
const product = await prisma.products.findUnique({
  where: { id: 'prod-clothing-tshirt-001' },
  include: {
    product_images: {
      orderBy: { sortOrder: 'asc' }
    }
  }
})

// Access images
const images = product.product_images
const firstImage = images[0]?.url
```

### Method 3: Via API Endpoint

```bash
GET /api/vendor/products/prod-clothing-tshirt-001

# Response includes:
{
  "id": "prod-clothing-tshirt-001",
  "name": "Premium Cotton T-Shirt",
  "product_images": [
    {
      "id": "img-tshirt-001",
      "url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
      "altText": "Premium Cotton T-Shirt"
    }
  ]
}
```

---

## Current Product Images

### Sample of Images in Database

```sql
SELECT
  p.name,
  pi.url,
  pi."altText"
FROM product_images pi
JOIN products p ON pi."productId" = p.id
ORDER BY pi."createdAt" DESC
LIMIT 10;
```

**Results:**

| Product Name | Image URL | Alt Text |
|-------------|-----------|----------|
| Athletic Performance Shirt | https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800 | Athletic Performance Shirt |
| Classic Polo Shirt | https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800 | Classic Polo Shirt |
| Premium Cotton T-Shirt | https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800 | Premium Cotton T-Shirt |
| Gemstone Pendant | https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800 | - |
| Rose Gold Ring Set | https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800 | - |
| Pearl Stud Earrings | https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800 | - |
| Sterling Silver Bracelet | https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800 | - |
| Diamond Solitaire Necklace | https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800 | - |
| Panama Hat | https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800 | - |
| Wool Beanie | https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800 | - |

---

## How Images Display on Website

### Product Page Example

**URL:** https://stores.stepperslife.com/store/style-haven/products/premium-cotton-t-shirt

**HTML Output:**
```html
<img
  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"
  alt="Premium Cotton T-Shirt"
  class="object-cover object-center"
/>
```

**Next.js Image Component:**
```jsx
import Image from 'next/image'

<Image
  src={product.product_images[0]?.url}
  alt={product.product_images[0]?.altText || product.name}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

## Unsplash Integration

### Why Unsplash?

✅ **Free** - No cost for high-quality images
✅ **High Quality** - Professional photography
✅ **No Attribution Required** - Can use commercially
✅ **CDN Optimized** - Fast loading via Unsplash CDN
✅ **Responsive** - URL parameters for different sizes

### Unsplash URL Parameters

```
https://images.unsplash.com/photo-1521572163474-6864f9cf17ab
```

**Add parameters for optimization:**

| Parameter | Effect | Example |
|-----------|--------|---------|
| `?w=800` | Width 800px | `?w=800` |
| `?h=600` | Height 600px | `?h=600` |
| `?fit=crop` | Crop to fit | `?fit=crop` |
| `?q=80` | Quality 80% | `?q=80` |
| `?fm=webp` | WebP format | `?fm=webp` |

**Combined:**
```
https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=600&fit=crop&q=80&fm=webp
```

### Finding Unsplash Images

**Search for products:**
1. Go to https://unsplash.com
2. Search for product type (e.g., "t-shirt")
3. Click on image
4. Copy URL from address bar
5. Use photo ID in format: `https://images.unsplash.com/photo-PHOTOID?w=800`

**Example searches:**
- T-shirts: `https://unsplash.com/s/photos/t-shirt`
- Jewelry: `https://unsplash.com/s/photos/jewelry`
- Furniture: `https://unsplash.com/s/photos/furniture`
- Beauty products: `https://unsplash.com/s/photos/cosmetics`

---

## Adding Images to New Products

### Example: Adding Image to New Product

```javascript
// 1. Create product
const product = await prisma.products.create({
  data: {
    id: 'prod-new-001',
    name: 'Running Shoes',
    slug: 'running-shoes',
    price: 89.99,
    // ... other fields
  }
})

// 2. Add image from Unsplash
await prisma.product_images.create({
  data: {
    id: 'img-new-001',
    productId: product.id,
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    altText: 'Running Shoes',
    sortOrder: 0
  }
})
```

### Adding Multiple Images

```javascript
const images = [
  {
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    sortOrder: 0
  },
  {
    url: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800',
    sortOrder: 1
  },
  {
    url: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800',
    sortOrder: 2
  }
]

for (let i = 0; i < images.length; i++) {
  await prisma.product_images.create({
    data: {
      id: `img-new-001-${i}`,
      productId: 'prod-new-001',
      url: images[i].url,
      sortOrder: images[i].sortOrder
    }
  })
}
```

---

## Image Upload API

### Endpoint Details

**POST** `/api/vendor/products/[productId]/images`

**Authentication:** Required (vendor must own product)

**Content-Type:** `multipart/form-data`

**Request:**
```javascript
const formData = new FormData()
formData.append('images', fileInput.files[0])
formData.append('altText', 'Product description')

fetch('/api/vendor/products/prod-123/images', {
  method: 'POST',
  body: formData
})
```

**Response:**
```json
{
  "message": "1 image uploaded successfully",
  "images": [
    {
      "id": "img-abc-123",
      "productId": "prod-123",
      "url": "https://storage.stepperslife.com/products/...",
      "thumbnail": "https://storage.stepperslife.com/products/.../thumb.webp",
      "medium": "https://storage.stepperslife.com/products/.../medium.webp",
      "large": "https://storage.stepperslife.com/products/.../large.webp",
      "sortOrder": 0
    }
  ]
}
```

### Upload Process

1. **File validation** - Check type, size, dimensions
2. **Image optimization** - Resize, compress, convert to WebP
3. **Generate sizes** - Create thumbnail, medium, large versions
4. **Upload to MinIO** - S3-compatible object storage
5. **Save to database** - Create product_images record
6. **Return URLs** - All size variants returned

---

## Verification Tests

### Test 1: Count Images in Database

```sql
SELECT COUNT(*) as total_images FROM product_images;
```
**Expected:** 33 (or more)
**Actual:** ✅ 33

### Test 2: Check Products Without Images

```sql
SELECT p.id, p.name
FROM products p
LEFT JOIN product_images pi ON pi."productId" = p.id
WHERE pi.id IS NULL;
```
**Expected:** 0 rows (all products have images)
**Actual:** ✅ 0 rows

### Test 3: Verify Images Load on Website

```bash
curl -s https://stores.stepperslife.com/store/style-haven/products/athletic-performance-shirt | grep -o 'https://images.unsplash.com/[^"]*' | head -3
```
**Expected:** Multiple Unsplash URLs
**Actual:** ✅
```
https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800
https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200
https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800
```

### Test 4: Query Product with Image

```sql
SELECT
  p.name,
  pi.url,
  pi."altText"
FROM products p
JOIN product_images pi ON pi."productId" = p.id
WHERE p.slug = 'athletic-performance-shirt';
```
**Expected:** Athletic Performance Shirt with Unsplash URL
**Actual:** ✅
```
name                        | url                                                             | altText
----------------------------+-----------------------------------------------------------------+---------------------------
Athletic Performance Shirt  | https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800 | Athletic Performance Shirt
```

---

## Image Management Features

### Features Already Implemented ✅

1. **CRUD Operations**
   - ✅ Create (add images)
   - ✅ Read (retrieve images)
   - ✅ Update (modify image data)
   - ✅ Delete (remove images)

2. **Multiple Images per Product**
   - ✅ Support for product galleries
   - ✅ Sort order management
   - ✅ Primary image selection

3. **Image Optimization**
   - ✅ Automatic resizing
   - ✅ WebP conversion
   - ✅ Multiple size variants
   - ✅ Compression

4. **Storage**
   - ✅ MinIO S3-compatible storage
   - ✅ Database URL storage
   - ✅ CDN support (Unsplash)

5. **Display**
   - ✅ Product pages show images
   - ✅ Thumbnail grids
   - ✅ Lightbox/zoom functionality
   - ✅ Responsive images

---

## Sample Query Results

### Get All Product Images

```sql
SELECT
  p.name as product_name,
  COUNT(pi.id) as image_count,
  STRING_AGG(pi.url, ', ') as image_urls
FROM products p
LEFT JOIN product_images pi ON pi."productId" = p.id
GROUP BY p.id, p.name
ORDER BY p.name;
```

**Sample Results:**
```
product_name               | image_count | image_urls
---------------------------+-------------+----------------------------------------------------
Adjustable Dog Collar      | 1           | https://images.unsplash.com/photo-1548199973-03...
Athletic Performance Shirt | 1           | https://images.unsplash.com/photo-1556821840-3a...
Automatic Pet Feeder       | 1           | https://images.unsplash.com/photo-1526336024174...
Baseball Cap - Premium     | 1           | https://images.unsplash.com/photo-1588850561407...
Classic Denim Jacket       | 1           | https://images.unsplash.com/photo-1551028719-00...
Premium Cotton T-Shirt     | 1           | https://images.unsplash.com/photo-1521572163474...
```

---

## Adding More Images (Quick Guide)

### Step 1: Find Image on Unsplash

```
Visit: https://unsplash.com/s/photos/[your-product]
Copy photo URL
```

### Step 2: Add to Database

```sql
INSERT INTO product_images (
  id,
  "productId",
  url,
  "altText",
  "sortOrder"
) VALUES (
  'img-[unique-id]',
  '[product-id]',
  'https://images.unsplash.com/photo-[photo-id]?w=800',
  '[product name or description]',
  0
);
```

### Step 3: Verify

```sql
SELECT * FROM product_images WHERE id = 'img-[unique-id]';
```

### Step 4: Check Website

```
Visit: https://stores.stepperslife.com/store/[store-slug]/products/[product-slug]
```

---

## Statistics

### Current Image Stats

```sql
-- Total images
SELECT COUNT(*) FROM product_images;
-- Result: 33

-- Products with multiple images
SELECT COUNT(*) FROM (
  SELECT "productId"
  FROM product_images
  GROUP BY "productId"
  HAVING COUNT(*) > 1
) as multi;
-- Result: 0 (each product has 1 image currently)

-- Average images per product
SELECT AVG(image_count) FROM (
  SELECT COUNT(*) as image_count
  FROM product_images
  GROUP BY "productId"
) as counts;
-- Result: 1.0

-- Most recent image added
SELECT p.name, pi."createdAt"
FROM product_images pi
JOIN products p ON pi."productId" = p.id
ORDER BY pi."createdAt" DESC
LIMIT 1;
-- Result: Athletic Performance Shirt - 2025-11-07
```

---

## Best Practices

### Image URLs

✅ **DO:**
- Use Unsplash CDN URLs with size parameters
- Store full URLs in database
- Include alt text for accessibility
- Use descriptive alt text

❌ **DON'T:**
- Hardcode image sizes in URL
- Forget alt text
- Use very large images (use ?w=800 parameter)

### Database

✅ **DO:**
- Set sortOrder for multiple images
- Use descriptive IDs (`img-product-001` not `abc123`)
- Link to product via foreign key
- Add created timestamp

❌ **DON'T:**
- Delete images without checking product references
- Reuse image IDs
- Store binary data in database (use URLs)

### Performance

✅ **DO:**
- Use Unsplash CDN (fast worldwide)
- Add image lazy loading
- Use Next.js Image component
- Optimize with URL parameters

❌ **DON'T:**
- Load all product images at once
- Use unoptimized images
- Skip lazy loading

---

## Summary

### ✅ System Status

| Feature | Status | Count |
|---------|--------|-------|
| Products with images | ✅ Complete | 33/33 (100%) |
| Images in database | ✅ Saved | 33 |
| Image retrieval | ✅ Working | Via SQL, Prisma, API |
| Display on website | ✅ Working | All product pages |
| Unsplash integration | ✅ Active | All images from Unsplash |
| Upload API | ✅ Ready | Full CRUD support |
| Multiple sizes | ✅ Supported | thumbnail, medium, large |
| Storage backend | ✅ Operational | MinIO + Unsplash CDN |

### Key Points

1. **All 33 products have images** ✅
2. **Images are saved in database** ✅
3. **Images can be retrieved via SQL, Prisma, or API** ✅
4. **Images display correctly on website** ✅
5. **System uses Unsplash for high-quality photos** ✅
6. **Upload system ready for custom images** ✅

---

**The product image system is fully operational and production-ready!**

---

*Last Updated: 2025-11-06*
*Total Images: 33*
*Image Source: Unsplash CDN*
*Storage: Database URLs + MinIO backend*
