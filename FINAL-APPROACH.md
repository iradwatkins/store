# Final Database Approach - Stores Marketplace

**Decision**: Create separate e-commerce tables, reference existing User table for SSO

---

## ✅ What Exists (Don't Touch)

From main stepperslife.com database:
- `User` table (for authentication/SSO)
- `Account` table (NextAuth OAuth)
- `Session` table (NextAuth sessions)
- `VerificationToken` table
- `Store` table (generic directory, NOT e-commerce)
- `Event`, `Restaurant`, `Class`, etc. tables

---

## ✅ What We'll Create (New E-commerce Tables)

All tables prefixed or named clearly to avoid conflicts:

### 1. **VendorStore** (E-commerce marketplace store)
- `id`, `userId` (FK to User), `name`, `slug`
- `logoUrl`, `bannerUrl`, `tagline`, `description`
- `email`, `phone`, `shipFromAddress`
- `stripeAccountId`, `platformFeePercent`
- `totalProducts`, `totalOrders`, `totalSales`

### 2. **Product** (Marketplace products)
- `id`, `vendorStoreId` (FK to VendorStore)
- `name`, `slug`, `description`, `price`, `compareAtPrice`
- `sku`, `quantity`, `category`, `tags`
- `status` (DRAFT/ACTIVE/OUT_OF_STOCK)
- Images, variants, shipping info

### 3. **ProductVariant**, **ProductImage**
- Simple size OR color variants
- Multiple images per product

### 4. **StoreOrder** (E-commerce orders, distinct from Event orders)
- `id`, `orderNumber`, `vendorStoreId`
- `customerId` (FK to User, nullable for guests)
- `customerEmail`, `customerName`
- Amounts, payment, fulfillment tracking

### 5. **OrderItem** (order line items)

### 6. **Category** (product categories: Clothing, Shoes, Accessories)

### 7. **Platform settings, Audit logs, Daily sales**

---

## ✅ SSO Strategy

**How users log in across subdomains:**

1. User logs in on **stepperslife.com** → creates session in `Session` table
2. NextAuth sets cookie with domain `.stepperslife.com`
3. User visits **stores.stepperslife.com**
4. NextAuth reads cookie, finds session in shared `Session` table
5. User is authenticated ✅

**Both sites share:**
- Same database (`stepperslife`)
- Same `User`, `Account`, `Session` tables
- Same NextAuth cookie domain (`.stepperslife.com`)

---

## 🎯 Implementation

Creating clean migration that:
1. Doesn't modify existing tables
2. Creates new e-commerce tables with clear names
3. References existing `User` table via foreign keys
4. Uses PascalCase naming to match existing schema

---

**This approach gives us SSO + independent e-commerce tables = Best of both worlds!**
