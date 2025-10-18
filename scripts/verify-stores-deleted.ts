import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDeletion() {
  try {
    const storeCount = await prisma.vendorStore.count()
    const productCount = await prisma.product.count()
    const storeOwnerCount = await prisma.user.count({
      where: { role: 'STORE_OWNER' }
    })

    console.log('📊 Database Verification:')
    console.log(`  - Stores: ${storeCount}`)
    console.log(`  - Products: ${productCount}`)
    console.log(`  - Store Owners: ${storeOwnerCount}`)

    if (storeCount === 0 && productCount === 0 && storeOwnerCount === 0) {
      console.log('\n✅ All stores have been successfully deleted!')
    } else {
      console.log('\n⚠️  Some data still exists')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDeletion()
