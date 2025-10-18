const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function setup() {
  console.log('🚀 Creating test data...\n');

  // User
  const user = await prisma.user.create({
    data: {
      email: 'testvendor@stepperslife.com',
      name: 'Test Vendor',
      role: 'STORE_OWNER',
      emailVerified: new Date(),
    }
  });
  console.log('✅ User:', user.email);

  // Store registry
  const storeRegistry = await prisma.store.create({
    data: {
      name: 'Test Store',
      slug: 'test-vendor-store',
      ownerId: user.id,
      isActive: true,
    }
  });

  // Vendor store
  const vendorStore = await prisma.vendorStore.create({
    data: {
      storeId: storeRegistry.id,
      userId: user.id,
      name: 'Test Store',
      slug: 'test-vendor-store',
      email: 'testvendor@stepperslife.com',
      description: 'Test store for reviews',
      isActive: true,
    }
  });
  console.log('✅ VendorStore:', vendorStore.slug);

  // Product
  const product = await prisma.product.create({
    data: {
      vendorStoreId: vendorStore.id,
      name: 'Test Stepping Shoes',
      slug: 'test-stepping-shoes',
      description: 'Premium stepping shoes',
      price: 99.99,
      category: 'SHOES',
      status: 'ACTIVE',
      publishedAt: new Date(),
      quantity: 100,
    }
  });
  console.log('✅ Product:', product.name);

  // Customer
  const customer = await prisma.user.create({
    data: {
      email: 'testcustomer@stepperslife.com',
      name: 'Test Customer',
      role: 'USER',
      emailVerified: new Date(),
    }
  });

  // Order
  const order = await prisma.storeOrder.create({
    data: {
      orderNumber: `TEST-${Date.now()}`,
      vendorStoreId: vendorStore.id,
      customerId: customer.id,
      customerEmail: customer.email,
      customerName: customer.name,
      shippingAddress: {street: '123 Test', city: 'Chicago', state: 'IL', zip: '60601'},
      billingAddress: {street: '123 Test', city: 'Chicago', state: 'IL', zip: '60601'},
      subtotal: 99.99,
      shippingCost: 10.00,
      taxAmount: 9.00,
      total: 118.99,
      platformFee: 7.00,
      vendorPayout: 111.99,
      paymentStatus: 'PAID',
      fulfillmentStatus: 'FULFILLED',
      status: 'PAID',
      paidAt: new Date(),
      shippedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      items: {
        create: {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        }
      }
    },
    include: { items: true }
  });
  console.log('✅ Order:', order.orderNumber);

  // Review
  const review = await prisma.productReview.create({
    data: {
      productId: product.id,
      orderItemId: order.items[0].id,
      vendorStoreId: vendorStore.id,
      customerId: customer.id,
      rating: 5,
      title: 'Amazing stepping shoes!',
      review: 'These are the best stepping shoes I have purchased. Quality is outstanding!',
      customerName: customer.name,
      customerEmail: customer.email,
      isVerifiedPurchase: true,
      status: 'PUBLISHED',
    }
  });
  console.log('✅ Review:', review.title);

  // Update aggregates
  await prisma.product.update({
    where: { id: product.id },
    data: { averageRating: 5, reviewCount: 1 }
  });

  await prisma.vendorStore.update({
    where: { id: vendorStore.id },
    data: { averageRating: 5, totalReviews: 1 }
  });

  console.log('\n✅ Test data created!');
  console.log(`Visit: https://stores.stepperslife.com/store/${vendorStore.slug}/products/${product.slug}`);
  
  await prisma.$disconnect();
}

setup().catch(console.error);
