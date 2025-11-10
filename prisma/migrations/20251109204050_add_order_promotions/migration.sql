-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('ORDER_BUMP', 'UPSELL', 'CROSS_SELL');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SCHEDULED', 'EXPIRED');

-- CreateTable
CREATE TABLE "order_promotions" (
    "id" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "freeShipping" BOOLEAN NOT NULL DEFAULT false,
    "status" "PromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB,
    "displayCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedCount" INTEGER NOT NULL DEFAULT 0,
    "revenueAdded" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_promotions_vendorStoreId_status_idx" ON "order_promotions"("vendorStoreId", "status");

-- CreateIndex
CREATE INDEX "order_promotions_status_priority_idx" ON "order_promotions"("status", "priority");

-- AddForeignKey
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
