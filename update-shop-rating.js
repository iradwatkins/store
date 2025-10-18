const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateShopAggregates(vendorStoreId) {
  const aggregates = await prisma.productReview.aggregate({
    where: {
      vendorStoreId,
      status: "PUBLISHED",
    },
    _avg: {
      rating: true,
    },
    _count: {
      id: true,
    },
  })

  const ratingDistribution = await prisma.productReview.groupBy({
    by: ["rating"],
    where: {
      vendorStoreId,
      status: "PUBLISHED",
    },
    _count: {
      rating: true,
    },
  })

  const distribution = {
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0,
  }

  ratingDistribution.forEach((item) => {
    if (item.rating === 5) distribution.fiveStars = item._count.rating
    if (item.rating === 4) distribution.fourStars = item._count.rating
    if (item.rating === 3) distribution.threeStars = item._count.rating
    if (item.rating === 2) distribution.twoStars = item._count.rating
    if (item.rating === 1) distribution.oneStar = item._count.rating
  })

  // Upsert ShopRating
  await prisma.shopRating.upsert({
    where: { vendorStoreId },
    create: {
      vendorStoreId,
      averageRating: aggregates._avg.rating || 0,
      totalReviews: aggregates._count.id,
      ...distribution,
    },
    update: {
      averageRating: aggregates._avg.rating || 0,
      totalReviews: aggregates._count.id,
      ...distribution,
      lastCalculated: new Date(),
    },
  })

  console.log('✅ Updated ShopRating:', {
    averageRating: aggregates._avg.rating,
    totalReviews: aggregates._count.id,
    distribution
  })

  // Update VendorStore aggregates
  await prisma.vendorStore.update({
    where: { id: vendorStoreId },
    data: {
      averageRating: aggregates._avg.rating || null,
      totalReviews: aggregates._count.id,
    },
  })
}

async function main() {
  const store = await prisma.vendorStore.findFirst({
    where: { slug: 'test-vendor-store' }
  })

  if (!store) {
    console.error('Store not found!')
    return
  }

  await updateShopAggregates(store.id)
  await prisma.$disconnect()
}

main().catch(console.error)
