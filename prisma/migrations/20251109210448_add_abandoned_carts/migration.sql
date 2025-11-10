-- CreateTable
CREATE TABLE "abandoned_carts" (
    "id" TEXT NOT NULL,
    "cartSessionId" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerName" TEXT,
    "cartData" JSONB NOT NULL,
    "cartTotal" DECIMAL(10,2) NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "recoveryToken" TEXT NOT NULL,
    "reminderSentAt" TIMESTAMP(3),
    "recoveredAt" TIMESTAMP(3),
    "isRecovered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abandoned_carts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "abandoned_carts_cartSessionId_key" ON "abandoned_carts"("cartSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "abandoned_carts_recoveryToken_key" ON "abandoned_carts"("recoveryToken");

-- CreateIndex
CREATE INDEX "abandoned_carts_vendorStoreId_isRecovered_idx" ON "abandoned_carts"("vendorStoreId", "isRecovered");

-- CreateIndex
CREATE INDEX "abandoned_carts_customerEmail_idx" ON "abandoned_carts"("customerEmail");

-- CreateIndex
CREATE INDEX "abandoned_carts_expiresAt_idx" ON "abandoned_carts"("expiresAt");

-- CreateIndex
CREATE INDEX "abandoned_carts_reminderSentAt_idx" ON "abandoned_carts"("reminderSentAt");

-- AddForeignKey
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
