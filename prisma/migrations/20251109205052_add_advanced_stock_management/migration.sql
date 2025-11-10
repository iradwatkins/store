-- AlterTable
ALTER TABLE "products" ADD COLUMN     "quantityAvailable" INTEGER,
ADD COLUMN     "quantityCommitted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quantityOnHold" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "variant_combinations" ADD COLUMN     "quantityAvailable" INTEGER,
ADD COLUMN     "quantityCommitted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quantityOnHold" INTEGER NOT NULL DEFAULT 0;
