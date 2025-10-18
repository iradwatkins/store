# Database Schema - SteppersLife Stores

**Project**: stores.stepperslife.com
**Database**: PostgreSQL 15+
**ORM**: Prisma
**Version**: 1.0

---

## Overview

This schema supports a **single multi-vendor marketplace** for SteppersLife.com. It is NOT multi-tenant - all vendors share the same database with proper data scoping by storeId.

### Key Design Decisions:
- **Single database** (not multi-tenant)
- **Clerk authentication** (SSO with stepperslife.com)
- **Stripe Connect** for vendor payouts
- **7% platform fee** on all transactions
- **Simple product variants** (size OR color, not both)
- **Guest checkout** support

---

## Complete Prisma Schema

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// STORES & VENDORS
// ============================================

model Store {
  id            String   @id @default(cuid())

  // Owner (from Clerk)
  ownerId       String
  ownerClerkId  String   @unique
  ownerEmail    String
  ownerName     String?

  // Store details
  name          String
  slug          String   @unique
  tagline       String?  @db.VarChar(100)
  description   String?  @db.Text

  // Branding
  logoUrl       String?
  bannerUrl     String?

  // Contact
  email         String
  phone         String?

  // Shipping info
  shipFromAddress Json?  // {street, city, state, zip}
  shippingRates   Json?  // {flat: 10.00, express: 25.00, freeOver: 100}

  // Payment (Stripe Connect)
  stripeAccountId       String?  @unique
  stripeChargesEnabled  Boolean  @default(false)
  stripeDetailsSubmitted Boolean @default(false)

  // Platform settings
  platformFeePercent Decimal @default(7.0) @db.Decimal(5, 2)

  // Status
  status        StoreStatus @default(INACTIVE)

  // Relationships
  products      Product[]
  orders        Order[]
  staff         StoreStaff[]

  // Stats (cached, updated via cron)
  totalProducts Int      @default(0)
  totalOrders   Int      @default(0)
  totalSales    Decimal  @default(0) @db.Decimal(12, 2)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([ownerId])
  @@index([ownerClerkId])
  @@index([status])
  @@map("stores")
}

enum StoreStatus {
  INACTIVE   // Not yet approved or missing required setup
  ACTIVE     // Fully operational
  SUSPENDED  // Temporarily disabled by admin
  CLOSED     // Permanently closed
}

// Staff members (helpers for store owners)
model StoreStaff {
  id          String   @id @default(cuid())

  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  // Staff member (from Clerk)
  userId      String
  userClerkId String
  userEmail   String
  userName    String?

  // Role
  role        StoreStaffRole @default(ADMIN)

  // Permissions
  canManageProducts  Boolean @default(true)
  canManageOrders    Boolean @default(true)
  canViewAnalytics   Boolean @default(true)
  canManageSettings  Boolean @default(false)
  canManagePayments  Boolean @default(false)

  // Metadata
  invitedBy   String
  invitedAt   DateTime @default(now())
  acceptedAt  DateTime?
  active      Boolean  @default(true)

  @@unique([storeId, userClerkId])
  @@index([storeId])
  @@index([userClerkId])
  @@map("store_staff")
}

enum StoreStaffRole {
  ADMIN  // Can do most things except delete store or change owner
}

// ============================================
// PRODUCTS
// ============================================

model Product {
  id            String   @id @default(cuid())

  storeId       String
  store         Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  // Basic info
  name          String
  slug          String   // Unique within store
  description   String   @db.Text

  // Pricing
  price         Decimal  @db.Decimal(10, 2)
  compareAtPrice Decimal? @db.Decimal(10, 2) // Original price for "sale" display

  // Inventory
  sku           String?
  quantity      Int      @default(0)
  trackInventory Boolean @default(true)
  lowStockThreshold Int  @default(5)

  // Categorization
  category      ProductCategory
  tags          String[] // ["steppin", "vintage", "chicago", "sale"]

  // Variants (simple: size OR color, not both)
  hasVariants   Boolean  @default(false)
  variantType   VariantType?
  variants      ProductVariant[]

  // Images (stored in MinIO)
  images        ProductImage[]

  // Shipping
  weight        Decimal? @db.Decimal(8, 2) // pounds
  requiresShipping Boolean @default(true)

  // SEO
  metaTitle     String?  @db.VarChar(60)
  metaDescription String? @db.VarChar(160)

  // Status
  status        ProductStatus @default(DRAFT)
  publishedAt   DateTime?

  // Relations
  orderItems    OrderItem[]

  // Stats
  viewCount     Int      @default(0)
  salesCount    Int      @default(0)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([storeId, slug])
  @@index([storeId, status])
  @@index([category])
  @@index([status])
  @@fulltext([name, description])
  @@map("products")
}

enum ProductCategory {
  CLOTHING
  SHOES
  ACCESSORIES
}

enum ProductStatus {
  DRAFT        // Not visible to customers
  ACTIVE       // Visible and purchasable
  OUT_OF_STOCK // Visible but not purchasable
  ARCHIVED     // Hidden from catalog
}

enum VariantType {
  SIZE
  COLOR
}

model ProductVariant {
  id          String   @id @default(cuid())

  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  // Variant details
  name        String   // "Small", "Red", etc.
  value       String   // For programmatic use

  // Pricing (optional override)
  price       Decimal? @db.Decimal(10, 2)

  // Inventory
  sku         String?
  quantity    Int      @default(0)

  // Image (optional override)
  imageUrl    String?

  // Status
  available   Boolean  @default(true)

  // Display order
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([productId])
  @@index([productId, available])
  @@map("product_variants")
}

model ProductImage {
  id          String   @id @default(cuid())

  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  // Image URLs (MinIO)
  url         String   // Original
  thumbnail   String?  // 200x200
  medium      String?  // 600x600
  large       String?  // 1200x1200

  // Metadata
  altText     String?
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())

  @@index([productId])
  @@map("product_images")
}

// ============================================
// ORDERS
// ============================================

model Order {
  id            String   @id @default(cuid())
  orderNumber   String   @unique // SL-ORD-XXXXX

  // Store
  storeId       String
  store         Store    @relation(fields: [storeId], references: [id])

  // Customer (can be guest or registered)
  customerId    String?  // Clerk user ID if logged in
  customerEmail String
  customerName  String
  customerPhone String?

  // Shipping address
  shippingAddress Json   // {name, street, city, state, zip, country}

  // Billing address (same as shipping for now)
  billingAddress  Json   // {name, street, city, state, zip, country}

  // Items
  items         OrderItem[]

  // Amounts (all in USD)
  subtotal      Decimal  @db.Decimal(10, 2)
  shippingCost  Decimal  @db.Decimal(10, 2)
  taxAmount     Decimal  @db.Decimal(10, 2)
  discountAmount Decimal @db.Decimal(10, 2) @default(0)
  total         Decimal  @db.Decimal(10, 2)

  // Platform fee (7% of total)
  platformFee   Decimal  @db.Decimal(10, 2)
  vendorPayout  Decimal  @db.Decimal(10, 2) // total - platformFee

  // Payment
  paymentProcessor PaymentProcessor @default(STRIPE)
  paymentIntentId  String? @unique
  paymentStatus    PaymentStatus @default(PENDING)
  paidAt           DateTime?

  // Fulfillment
  fulfillmentStatus FulfillmentStatus @default(UNFULFILLED)
  shippingMethod    String?  // "Standard", "Express", "Local Pickup"
  trackingNumber    String?
  carrier           String?  // "USPS", "FedEx", "UPS"
  shippedAt         DateTime?
  deliveredAt       DateTime?

  // Order status
  status        OrderStatus @default(PENDING)

  // Notes
  customerNotes String?  @db.Text
  internalNotes String?  @db.Text // Vendor-only notes

  // Cancellation/Refund
  cancelledAt   DateTime?
  cancelReason  String?
  refundedAt    DateTime?
  refundAmount  Decimal? @db.Decimal(10, 2)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([storeId])
  @@index([customerId])
  @@index([customerEmail])
  @@index([status])
  @@index([paymentStatus])
  @@index([fulfillmentStatus])
  @@index([createdAt])
  @@map("orders")
}

enum OrderStatus {
  PENDING    // Created but not paid
  PAID       // Payment successful
  CANCELLED  // Cancelled by customer or vendor
  REFUNDED   // Refund issued
}

enum PaymentStatus {
  PENDING
  AUTHORIZED
  PAID
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum FulfillmentStatus {
  UNFULFILLED
  PARTIALLY_FULFILLED  // For multi-item orders (Phase 2)
  FULFILLED            // Ready to ship
  SHIPPED              // Tracking number assigned
  DELIVERED            // Confirmed delivered
}

enum PaymentProcessor {
  STRIPE
  SQUARE
  PAYPAL
}

model OrderItem {
  id          String   @id @default(cuid())

  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  productId   String
  product     Product  @relation(fields: [productId], references: [id])

  variantId   String?

  // Snapshot at time of purchase
  name        String
  sku         String?
  price       Decimal  @db.Decimal(10, 2)
  quantity    Int

  // Variant info (if applicable)
  variantName String?  // "Small", "Red"

  // Image
  imageUrl    String?

  createdAt   DateTime @default(now())

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

// ============================================
// CATEGORIES (Platform-managed)
// ============================================

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?  @db.Text
  imageUrl    String?

  // Hierarchy (optional, for future sub-categories)
  parentId    String?
  parent      Category? @relation("SubCategories", fields: [parentId], references: [id])
  children    Category[] @relation("SubCategories")

  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())

  @@map("categories")
}

// ============================================
// PLATFORM ADMIN
// ============================================

model PlatformSettings {
  id          String   @id @default(cuid())

  // Fee settings
  defaultPlatformFeePercent Decimal @default(7.0) @db.Decimal(5, 2)

  // Payout settings
  payoutSchedule String  @default("weekly") // "daily", "weekly", "biweekly", "monthly"
  minPayoutAmount Decimal @default(10.00) @db.Decimal(10, 2)

  // Legal
  termsOfService  String? @db.Text
  privacyPolicy   String? @db.Text
  returnPolicy    String? @db.Text

  // Contact
  supportEmail    String  @default("support@stepperslife.com")
  supportPhone    String?

  // Feature flags
  allowNewVendorSignups Boolean @default(true)
  maintenanceMode       Boolean @default(false)

  updatedAt   DateTime @updatedAt

  @@map("platform_settings")
}

// Audit log for admin actions
model AuditLog {
  id          String   @id @default(cuid())

  // Actor
  userId      String
  userEmail   String

  // Action
  action      String   // "store.suspended", "order.refunded", etc.
  entityType  String   // "Store", "Order", "Product"
  entityId    String

  // Details
  oldValue    Json?
  newValue    Json?
  reason      String?  @db.Text

  // IP & User Agent
  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

// ============================================
// ANALYTICS (Aggregated Data)
// ============================================

// Daily sales summary (updated by cron job)
model DailySales {
  id          String   @id @default(cuid())

  storeId     String
  date        DateTime @db.Date

  orderCount  Int
  revenue     Decimal  @db.Decimal(12, 2)
  platformFee Decimal  @db.Decimal(12, 2)
  vendorPayout Decimal @db.Decimal(12, 2)

  createdAt   DateTime @default(now())

  @@unique([storeId, date])
  @@index([storeId])
  @@index([date])
  @@map("daily_sales")
}
```

---

## Indexes & Performance

### Critical Indexes:
```sql
-- Product search (full-text)
CREATE INDEX idx_products_search ON products USING GIN (to_tsvector('english', name || ' ' || description));

-- Order lookup by customer
CREATE INDEX idx_orders_customer_email ON orders(customer_email);

-- Store performance
CREATE INDEX idx_orders_store_created ON orders(store_id, created_at DESC);

-- Analytics queries
CREATE INDEX idx_daily_sales_store_date ON daily_sales(store_id, date DESC);
```

---

## Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create platform settings
  await prisma.platformSettings.create({
    data: {
      defaultPlatformFeePercent: 7.0,
      payoutSchedule: 'weekly',
      supportEmail: 'support@stepperslife.com',
      allowNewVendorSignups: true,
    },
  });

  // Create categories
  const categories = [
    { name: 'Clothing', slug: 'clothing', description: 'Steppin apparel and outfits' },
    { name: 'Shoes', slug: 'shoes', description: 'Dance shoes for Chicago Steppin' },
    { name: 'Accessories', slug: 'accessories', description: 'Hats, jewelry, and more' },
  ];

  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }

  console.log('✅ Database seeded');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Migration Strategy

### Initial Setup:
```bash
# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Seed database
npx prisma db seed

# Generate Prisma Client
npx prisma generate
```

### Future Migrations:
```bash
# After schema changes
npx prisma migrate dev --name add_feature_name

# Deploy to production
npx prisma migrate deploy
```

---

## Data Relationships Diagram

```
Store (1) ──→ (N) Product
  │                 │
  │                 └──→ (N) ProductVariant
  │                 └──→ (N) ProductImage
  │
  └──→ (N) Order
          │
          └──→ (N) OrderItem ──→ (1) Product

Store (1) ──→ (N) StoreStaff

Order (1) ──→ (1) Store
Order (1) ──→ (N) OrderItem
```

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5407/stepperslife_stores?schema=public"

# Clerk Auth (same as main site)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# MinIO (Object Storage)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9007"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="stepperslife-stores"
MINIO_USE_SSL="false"

# Redis
REDIS_URL="redis://localhost:6407"

# Email (Resend)
RESEND_API_KEY="re_..."

# App Config
NEXT_PUBLIC_APP_URL="https://stores.stepperslife.com"
NEXT_PUBLIC_MAIN_SITE_URL="https://stepperslife.com"
PORT=3008
```

---

## Next Steps

1. ✅ Copy this schema to `prisma/schema.prisma`
2. ✅ Run `npx prisma migrate dev --name init`
3. ✅ Create seed script at `prisma/seed.ts`
4. ✅ Run `npx prisma db seed`
5. ✅ Generate Prisma Client: `npx prisma generate`
6. ✅ Start building APIs!

---

**Schema ready for implementation. Proceed to [Development Setup Guide](./DEVELOPMENT-SETUP.md)**
