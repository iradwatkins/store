-- AlterTable
ALTER TABLE "abandoned_carts"
ADD COLUMN IF NOT EXISTS "secondReminderSentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "thirdReminderSentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "discountCode" TEXT,
ADD COLUMN IF NOT EXISTS "discountPercent" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS "discountCodeUsed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex (IF NOT EXISTS for PostgreSQL 9.5+)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'abandoned_carts_discountCode_key') THEN
        CREATE UNIQUE INDEX "abandoned_carts_discountCode_key" ON "abandoned_carts"("discountCode");
    END IF;
END $$;

-- CreateIndex
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'abandoned_carts_discountCode_idx') THEN
        CREATE INDEX "abandoned_carts_discountCode_idx" ON "abandoned_carts"("discountCode");
    END IF;
END $$;
