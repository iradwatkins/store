-- Performance Optimization Indexes for SteppersLife Stores
-- Sprint 4: Production Readiness
-- Date: 2025-10-10

-- ============================================================================
-- Order Performance Indexes
-- ============================================================================

-- Index for webhook order creation (payment intent lookup)
-- Already exists as @unique on paymentIntentId

-- Index for shipped orders cron job (review request emails)
CREATE INDEX IF NOT EXISTS "store_orders_shipped_at_payment_status_idx"
ON "store_orders" ("shippedAt", "paymentStatus", "fulfillmentStatus")
WHERE "shippedAt" IS NOT NULL AND "paymentStatus" = 'PAID';

-- Index for vendor order analytics (last 30/90 days)
CREATE INDEX IF NOT EXISTS "store_orders_vendor_paid_created_idx"
ON "store_orders" ("vendorStoreId", "paymentStatus", "createdAt")
WHERE "paymentStatus" = 'PAID';

-- ============================================================================
-- Review Performance Indexes
-- ============================================================================

-- Index for review eligibility checks (by order item)
-- Already covered by @@index([orderItemId]) on ProductReview

-- Index for vendor review filtering (flagged reviews)
CREATE INDEX IF NOT EXISTS "product_reviews_vendor_status_idx"
ON "product_reviews" ("vendorStoreId", "status", "createdAt" DESC);

-- Index for product review displays (published only)
CREATE INDEX IF NOT EXISTS "product_reviews_product_published_idx"
ON "product_reviews" ("productId", "status", "createdAt" DESC)
WHERE "status" = 'PUBLISHED';

-- ============================================================================
-- Product Performance Indexes
-- ============================================================================

-- Index for low stock alerts in analytics
CREATE INDEX IF NOT EXISTS "products_vendor_low_stock_idx"
ON "products" ("vendorStoreId", "status", "quantity")
WHERE "status" = 'ACTIVE' AND "quantity" < 5 AND "quantity" > 0;

-- Index for top products by sales (analytics dashboard)
CREATE INDEX IF NOT EXISTS "products_vendor_sales_count_idx"
ON "products" ("vendorStoreId", "salesCount" DESC)
WHERE "salesCount" > 0;

-- ============================================================================
-- Cart & Checkout Performance
-- ============================================================================

-- Index for product variant availability checks
-- Already covered by @@index([productId, available]) on ProductVariant

-- ============================================================================
-- NOTES
-- ============================================================================
-- These indexes are designed to optimize:
-- 1. Email sending workflows (order confirmations, shipping notifications, review requests)
-- 2. Vendor analytics dashboard queries
-- 3. Review moderation and display
-- 4. Checkout/payment webhook processing
--
-- All indexes use IF NOT EXISTS to prevent errors on re-run
-- Partial indexes (WHERE clause) reduce index size for better performance
