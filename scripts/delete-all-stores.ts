import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAllStores() {
  try {
    console.log('🗑️  Starting to delete all stores...')

    // Delete all related data in order
    console.log('Deleting product reviews...')
    const reviewsDeleted = await prisma.product_reviews.deleteMany({})
    console.log(`✅ Deleted ${reviewsDeleted.count} product reviews`)

    console.log('Deleting order items...')
    const orderItemsDeleted = await prisma.store_order_items.deleteMany({})
    console.log(`✅ Deleted ${orderItemsDeleted.count} order items`)

    console.log('Deleting orders...')
    const ordersDeleted = await prisma.store_orders.deleteMany({})
    console.log(`✅ Deleted ${ordersDeleted.count} orders`)

    console.log('Deleting product variants...')
    const variantsDeleted = await prisma.product_variants.deleteMany({})
    console.log(`✅ Deleted ${variantsDeleted.count} product variants`)

    console.log('Deleting product images...')
    const imagesDeleted = await prisma.product_images.deleteMany({})
    console.log(`✅ Deleted ${imagesDeleted.count} product images`)

    console.log('Deleting products...')
    const productsDeleted = await prisma.products.deleteMany({})
    console.log(`✅ Deleted ${productsDeleted.count} products`)

    console.log('Deleting stores...')
    const storesDeleted = await prisma.vendor_stores.deleteMany({})
    console.log(`✅ Deleted ${storesDeleted.count} stores`)

    console.log('Downgrading store owners to regular users...')
    const usersUpdated = await prisma.user.updateMany({
      where: {
        role: 'STORE_OWNER'
      },
      data: {
        role: 'USER'
      }
    })
    console.log(`✅ Downgraded ${usersUpdated.count} users from STORE_OWNER to USER`)

    console.log('\n✅ All stores and related data have been deleted successfully!')
    console.log('\nSummary:')
    console.log(`  - ${storesDeleted.count} stores`)
    console.log(`  - ${productsDeleted.count} products`)
    console.log(`  - ${variantsDeleted.count} variants`)
    console.log(`  - ${imagesDeleted.count} images`)
    console.log(`  - ${ordersDeleted.count} orders`)
    console.log(`  - ${orderItemsDeleted.count} order items`)
    console.log(`  - ${reviewsDeleted.count} reviews`)
    console.log(`  - ${usersUpdated.count} users downgraded`)

  } catch (error) {
    console.error('❌ Error deleting stores:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllStores()
  .then(() => {
    console.log('\n🎉 Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
