-- Add Multi-Payment Processor Support
-- Date: 2025-10-10
-- Purpose: Allow vendors to choose PayPal, Square, Cash, or Stripe (pick 1 primary + 1 backup)

-- Add new payment processor enum values
ALTER TYPE "PaymentProcessor" ADD VALUE IF NOT EXISTS 'PAYPAL';
ALTER TYPE "PaymentProcessor" ADD VALUE IF NOT EXISTS 'SQUARE';
ALTER TYPE "PaymentProcessor" ADD VALUE IF NOT EXISTS 'CASH';

-- Add payment processor fields to vendor_stores
ALTER TABLE "vendor_stores"
ADD COLUMN IF NOT EXISTS "primaryPaymentProcessor" "PaymentProcessor" DEFAULT 'STRIPE',
ADD COLUMN IF NOT EXISTS "secondaryPaymentProcessor" "PaymentProcessor",
ADD COLUMN IF NOT EXISTS "paypalEmail" TEXT,
ADD COLUMN IF NOT EXISTS "paypalMerchantId" TEXT,
ADD COLUMN IF NOT EXISTS "squareAccessToken" TEXT,
ADD COLUMN IF NOT EXISTS "squareLocationId" TEXT,
ADD COLUMN IF NOT EXISTS "acceptsCash" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "cashInstructions" TEXT;

-- Create index for payment processor queries
CREATE INDEX IF NOT EXISTS "vendor_stores_payment_processor_idx"
ON "vendor_stores" ("primaryPaymentProcessor", "isActive");

-- Add comment
COMMENT ON COLUMN "vendor_stores"."primaryPaymentProcessor" IS 'Primary payment method (required)';
COMMENT ON COLUMN "vendor_stores"."secondaryPaymentProcessor" IS 'Backup payment method (optional)';
COMMENT ON COLUMN "vendor_stores"."acceptsCash" IS 'Whether vendor accepts cash payments';
COMMENT ON COLUMN "vendor_stores"."cashInstructions" IS 'Instructions for cash payment (pickup location, etc.)';
