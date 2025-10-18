const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  const store = await prisma.vendorStore.findUnique({
    where: {
      slug: 'test-vendor-store',
      isActive: true
    }
  })
  console.log('Store found:', !!store, store?.name)

  if (store) {
    const product = await prisma.product.findFirst({
      where: {
        slug: 'test-stepping-shoes',
        vendorStoreId: store.id,
        status: 'ACTIVE'
      },
      include: {
        vendorStore: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })
    console.log('Product found:', !!product)
    console.log('Product has vendorStore:', !!product?.vendorStore)
    console.log('VendorStore name:', product?.vendorStore?.name)
    console.log('Full product:', JSON.stringify(product, null, 2))
  }

  await prisma.$disconnect()
}

test().catch(console.error)
