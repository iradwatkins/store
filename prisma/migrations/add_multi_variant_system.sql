-- ============================================
-- Multi-Variant System Migration
-- Created: 2025-10-16
-- Purpose: Add support for multi-dimensional product variants
--          (Size + Color + Material, etc.) and product add-ons
-- ============================================

-- Step 1: Add new columns to products table
-- These fields enable the new multi-variant system while maintaining backward compatibility

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "variantTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "useMultiVariants" BOOLEAN NOT NULL DEFAULT false;

-- Create index for filtering new vs old variant system
CREATE INDEX IF NOT EXISTS "products_useMultiVariants_idx" ON "products"("useMultiVariants");

-- Step 2: Create VariantOption table
-- Stores individual variant options (e.g., "Large", "Red", "Sterling Silver")

CREATE TABLE IF NOT EXISTS "variant_options" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "hexColor" TEXT,
    "imageUrl" TEXT,
    "icon" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_options_pkey" PRIMARY KEY ("id")
);

-- Create indexes for variant_options
CREATE INDEX IF NOT EXISTS "variant_options_productId_type_idx" ON "variant_options"("productId", "type");
CREATE INDEX IF NOT EXISTS "variant_options_productId_isActive_idx" ON "variant_options"("productId", "isActive");

-- Add foreign key constraint
ALTER TABLE "variant_options"
  ADD CONSTRAINT "variant_options_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 3: Create VariantCombination table
-- Stores generated combinations of variant options

CREATE TABLE IF NOT EXISTS "variant_combinations" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "combinationKey" TEXT NOT NULL,
    "optionValues" JSONB NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(10,2),
    "compareAtPrice" DECIMAL(10,2),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "inventoryTracked" BOOLEAN NOT NULL DEFAULT true,
    "lowStockThreshold" INTEGER,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_combinations_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on combination key per product
CREATE UNIQUE INDEX IF NOT EXISTS "variant_combinations_productId_combinationKey_key"
  ON "variant_combinations"("productId", "combinationKey");

-- Create indexes for variant_combinations
CREATE INDEX IF NOT EXISTS "variant_combinations_productId_available_idx"
  ON "variant_combinations"("productId", "available");
CREATE INDEX IF NOT EXISTS "variant_combinations_productId_inStock_idx"
  ON "variant_combinations"("productId", "inStock");

-- Add foreign key constraint
ALTER TABLE "variant_combinations"
  ADD CONSTRAINT "variant_combinations_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Create ProductAddon table
-- Stores optional add-ons (gift wrapping, engraving, etc.)

CREATE TABLE IF NOT EXISTS "product_addons" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "maxQuantity" INTEGER,
    "requiredForVariants" JSONB,
    "excludedForVariants" JSONB,
    "imageUrl" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_addons_pkey" PRIMARY KEY ("id")
);

-- Create indexes for product_addons
CREATE INDEX IF NOT EXISTS "product_addons_productId_isActive_idx"
  ON "product_addons"("productId", "isActive");
CREATE INDEX IF NOT EXISTS "product_addons_storeId_isActive_idx"
  ON "product_addons"("storeId", "isActive");

-- Add foreign key constraint (nullable productId for store-wide addons)
ALTER TABLE "product_addons"
  ADD CONSTRAINT "product_addons_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Migration Notes:
--
-- BACKWARD COMPATIBILITY:
-- - Old ProductVariant table remains unchanged
-- - Products with variantType (SIZE or COLOR) continue working
-- - New system only activates when useMultiVariants = true
--
-- NEXT STEPS:
-- 1. Run this migration: psql -U stepperslife -d stepperslife_store -f add_multi_variant_system.sql
-- 2. Verify tables created: \dt variant_*; \dt product_addons;
-- 3. Test with a new product using multi-variants
-- 4. Optionally migrate existing products using migration script
--
-- ROLLBACK (if needed):
-- DROP TABLE IF EXISTS "product_addons" CASCADE;
-- DROP TABLE IF EXISTS "variant_combinations" CASCADE;
-- DROP TABLE IF EXISTS "variant_options" CASCADE;
-- ALTER TABLE "products" DROP COLUMN IF EXISTS "variantTypes";
-- ALTER TABLE "products" DROP COLUMN IF EXISTS "useMultiVariants";
-- ============================================
