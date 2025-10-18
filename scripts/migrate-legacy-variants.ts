/**
 * Legacy Variant Migration Script
 *
 * Purpose: Migrate products from old single-variant system (SIZE or COLOR only)
 *          to new multi-variant system (SIZE + COLOR + MATERIAL, etc.)
 *
 * Usage:
 *   # Dry run (preview changes without applying)
 *   npx tsx scripts/migrate-legacy-variants.ts --dry-run
 *
 *   # Migrate specific product
 *   npx tsx scripts/migrate-legacy-variants.ts --product-id <id>
 *
 *   # Migrate all products for a store
 *   npx tsx scripts/migrate-legacy-variants.ts --store-id <id>
 *
 *   # Migrate ALL products (use with caution)
 *   npx tsx scripts/migrate-legacy-variants.ts --all
 */

import { PrismaClient, VariantType } from '@prisma/client'

const prisma = new PrismaClient()

interface MigrationStats {
  productsProcessed: number
  productsSkipped: number
  productsMigrated: number
  variantsMigrated: number
  errors: Array<{ productId: string; error: string }>
}

interface MigrationOptions {
  dryRun: boolean
  productId?: string
  storeId?: string
  migrateAll: boolean
}

/**
 * Convert old ProductVariant to new VariantOption and VariantCombination
 */
async function migrateProduct(productId: string, dryRun: boolean): Promise<{
  success: boolean
  variantsMigrated: number
  error?: string
}> {
  try {
    // Fetch product with old variants
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
      },
    })

    if (!product) {
      return { success: false, variantsMigrated: 0, error: 'Product not found' }
    }

    // Skip if already using multi-variants
    if (product.useMultiVariants) {
      return { success: false, variantsMigrated: 0, error: 'Already using multi-variants' }
    }

    // Skip if no variants
    if (!product.variantType || product.variants.length === 0) {
      return { success: false, variantsMigrated: 0, error: 'No variants to migrate' }
    }

    console.log(`\n📦 Product: ${product.name} (${product.id})`)
    console.log(`   Old variant type: ${product.variantType}`)
    console.log(`   Variants to migrate: ${product.variants.length}`)

    if (dryRun) {
      console.log(`   [DRY RUN] Would migrate ${product.variants.length} variants`)
      return { success: true, variantsMigrated: product.variants.length }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create VariantOptions for each unique variant value
      const variantType = product.variantType as string
      const uniqueValues = [...new Set(product.variants.map((v) => v.value))]

      const variantOptions = []
      for (let i = 0; i < uniqueValues.length; i++) {
        const value = uniqueValues[i]
        const option = await tx.variantOption.create({
          data: {
            productId: product.id,
            type: variantType,
            value: value,
            displayName: value,
            sortOrder: i,
            isActive: true,
          },
        })
        variantOptions.push(option)
      }

      console.log(`   ✅ Created ${variantOptions.length} variant options`)

      // Step 2: Create VariantCombinations for each old variant
      const combinations = []
      for (const oldVariant of product.variants) {
        const combination = await tx.variantCombination.create({
          data: {
            productId: product.id,
            combinationKey: `${variantType}:${oldVariant.value}`,
            optionValues: {
              [variantType]: oldVariant.value,
            },
            sku: oldVariant.sku,
            price: oldVariant.price,
            quantity: oldVariant.quantity,
            available: oldVariant.available,
            inStock: oldVariant.quantity > 0,
            imageUrl: oldVariant.imageUrl,
            sortOrder: oldVariant.sortOrder,
          },
        })
        combinations.push(combination)
      }

      console.log(`   ✅ Created ${combinations.length} variant combinations`)

      // Step 3: Update product to use new multi-variant system
      await tx.product.update({
        where: { id: product.id },
        data: {
          variantTypes: [variantType],
          useMultiVariants: true,
          // Keep old variantType for reference
        },
      })

      console.log(`   ✅ Updated product to use multi-variant system`)

      return combinations.length
    })

    return { success: true, variantsMigrated: result }
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`)
    return {
      success: false,
      variantsMigrated: 0,
      error: error.message,
    }
  }
}

/**
 * Main migration function
 */
async function runMigration(options: MigrationOptions): Promise<MigrationStats> {
  const stats: MigrationStats = {
    productsProcessed: 0,
    productsSkipped: 0,
    productsMigrated: 0,
    variantsMigrated: 0,
    errors: [],
  }

  console.log('🚀 Legacy Variant Migration')
  console.log('=' .repeat(60))

  if (options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n')
  }

  // Build query filter
  const where: any = {
    useMultiVariants: false,
    variantType: {
      in: ['SIZE', 'COLOR'],
    },
    variants: {
      some: {},
    },
  }

  if (options.productId) {
    where.id = options.productId
  } else if (options.storeId) {
    where.vendorStoreId = options.storeId
  } else if (!options.migrateAll) {
    console.error('❌ Error: Must specify --product-id, --store-id, or --all')
    process.exit(1)
  }

  // Fetch products to migrate
  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      variantType: true,
      _count: {
        select: {
          variants: true,
        },
      },
    },
  })

  console.log(`Found ${products.length} products to migrate\n`)

  if (products.length === 0) {
    console.log('✅ No products need migration')
    return stats
  }

  // Migrate each product
  for (const product of products) {
    stats.productsProcessed++

    const result = await migrateProduct(product.id, options.dryRun)

    if (result.success) {
      stats.productsMigrated++
      stats.variantsMigrated += result.variantsMigrated
    } else {
      stats.productsSkipped++
      if (result.error) {
        stats.errors.push({
          productId: product.id,
          error: result.error,
        })
      }
    }
  }

  return stats
}

/**
 * Print migration summary
 */
function printSummary(stats: MigrationStats, dryRun: boolean) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 Migration Summary')
  console.log('='.repeat(60))
  console.log(`Products processed: ${stats.productsProcessed}`)
  console.log(`Products migrated:  ${stats.productsMigrated}`)
  console.log(`Products skipped:   ${stats.productsSkipped}`)
  console.log(`Variants migrated:  ${stats.variantsMigrated}`)

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors (${stats.errors.length}):`)
    stats.errors.forEach((err) => {
      console.log(`   - ${err.productId}: ${err.error}`)
    })
  }

  if (dryRun) {
    console.log('\n⚠️  This was a dry run. No changes were made.')
    console.log('   Remove --dry-run to apply the migration.')
  } else {
    console.log('\n✅ Migration complete!')
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2)

  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    migrateAll: args.includes('--all'),
  }

  const productIdIndex = args.indexOf('--product-id')
  if (productIdIndex !== -1 && args[productIdIndex + 1]) {
    options.productId = args[productIdIndex + 1]
  }

  const storeIdIndex = args.indexOf('--store-id')
  if (storeIdIndex !== -1 && args[storeIdIndex + 1]) {
    options.storeId = args[storeIdIndex + 1]
  }

  return options
}

/**
 * Main entry point
 */
async function main() {
  try {
    const options = parseArgs()

    // Show help if no valid options
    if (!options.productId && !options.storeId && !options.migrateAll) {
      console.log('Legacy Variant Migration Script')
      console.log('\nUsage:')
      console.log('  npx tsx scripts/migrate-legacy-variants.ts [options]')
      console.log('\nOptions:')
      console.log('  --dry-run              Preview changes without applying')
      console.log('  --product-id <id>      Migrate specific product')
      console.log('  --store-id <id>        Migrate all products for a store')
      console.log('  --all                  Migrate ALL products (use with caution)')
      console.log('\nExamples:')
      console.log('  # Dry run for all products')
      console.log('  npx tsx scripts/migrate-legacy-variants.ts --dry-run --all')
      console.log('\n  # Migrate specific product')
      console.log('  npx tsx scripts/migrate-legacy-variants.ts --product-id abc123')
      console.log('\n  # Migrate all products for a store')
      console.log('  npx tsx scripts/migrate-legacy-variants.ts --store-id xyz789')
      process.exit(0)
    }

    const stats = await runMigration(options)
    printSummary(stats, options.dryRun)

    await prisma.$disconnect()
    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Run the migration
main()
