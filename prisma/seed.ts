import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create test users
  console.log('Creating users...')
  const password = await bcrypt.hash('password123', 10)

  const vendor1 = await prisma.user.create({
    data: {
      email: 'vendor1@stepperslife.com',
      name: 'John Vendor',
      emailVerified: new Date(),
      accounts: {
        create: {
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: 'vendor1',
          password: password,
        },
      },
    },
  })

  const vendor2 = await prisma.user.create({
    data: {
      email: 'vendor2@stepperslife.com',
      name: 'Jane Seller',
      emailVerified: new Date(),
      accounts: {
        create: {
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: 'vendor2',
          password: password,
        },
      },
    },
  })

  const customer = await prisma.user.create({
    data: {
      email: 'customer@stepperslife.com',
      name: 'Customer Test',
      emailVerified: new Date(),
      accounts: {
        create: {
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: 'customer1',
          password: password,
        },
      },
    },
  })

  console.log(`✓ Created ${3} users`)

  // Create vendor stores
  console.log('Creating vendor stores...')

  const store1 = await prisma.vendorStore.create({
    data: {
      userId: vendor1.id,
      name: 'Steppers Paradise',
      slug: 'steppers-paradise',
      tagline: 'Your one-stop shop for stepping gear',
      description: 'We specialize in high-quality stepping shoes, apparel, and accessories for the Chicago stepping community.',
      email: 'contact@steppersparadise.com',
      phone: '+1 (312) 555-0100',
      isActive: true,
      platformFeePercent: 7.0,
    },
  })

  const store2 = await prisma.vendorStore.create({
    data: {
      userId: vendor2.id,
      name: 'Dance Elegance',
      slug: 'dance-elegance',
      tagline: 'Elegant apparel for steppers',
      description: 'Premium dance wear and accessories designed specifically for Chicago stepping enthusiasts.',
      email: 'hello@danceelegance.com',
      phone: '+1 (312) 555-0200',
      isActive: true,
      platformFeePercent: 7.0,
    },
  })

  console.log(`✓ Created ${2} vendor stores`)

  // Create products for store 1
  console.log('Creating products...')

  const product1 = await prisma.product.create({
    data: {
      vendorStoreId: store1.id,
      name: 'Premium Stepping Shoes - Black',
      slug: 'premium-stepping-shoes-black',
      description: 'Professional-grade stepping shoes with superior comfort and style. Features genuine leather construction, cushioned insoles, and non-slip soles perfect for smooth gliding on the dance floor.',
      price: 129.99,
      compareAtPrice: 179.99,
      sku: 'STEP-SHOE-BLK-001',
      quantity: 25,
      category: 'SHOES',
      status: 'ACTIVE',
      trackInventory: true,
      lowStockThreshold: 5,
    },
  })

  const product2 = await prisma.product.create({
    data: {
      vendorStoreId: store1.id,
      name: 'Classic Stepping Dress Shirt',
      slug: 'classic-stepping-dress-shirt',
      description: 'Elegant dress shirt perfect for stepping events. Made from breathable, wrinkle-resistant fabric with a modern slim fit.',
      price: 59.99,
      compareAtPrice: 89.99,
      sku: 'STEP-SHIRT-WHT-001',
      quantity: 50,
      category: 'CLOTHING',
      status: 'ACTIVE',
      trackInventory: true,
      lowStockThreshold: 10,
    },
  })

  const product3 = await prisma.product.create({
    data: {
      vendorStoreId: store1.id,
      name: 'Stepping Accessories Kit',
      slug: 'stepping-accessories-kit',
      description: 'Complete accessories kit including a premium tie, pocket square, and cufflinks. Perfect for completing your stepping outfit.',
      price: 39.99,
      sku: 'STEP-ACC-KIT-001',
      quantity: 30,
      category: 'ACCESSORIES',
      status: 'ACTIVE',
      trackInventory: true,
      lowStockThreshold: 5,
    },
  })

  // Create products for store 2
  const product4 = await prisma.product.create({
    data: {
      vendorStoreId: store2.id,
      name: 'Elegant Evening Gown',
      slug: 'elegant-evening-gown',
      description: 'Stunning evening gown designed for stepping competitions and events. Features flowing fabric and elegant draping.',
      price: 199.99,
      compareAtPrice: 299.99,
      sku: 'DANCE-GOWN-BLK-001',
      quantity: 15,
      category: 'CLOTHING',
      status: 'ACTIVE',
      trackInventory: true,
      lowStockThreshold: 3,
    },
  })

  const product5 = await prisma.product.create({
    data: {
      vendorStoreId: store2.id,
      name: "Women's Dance Heels - Red",
      slug: 'womens-dance-heels-red',
      description: 'Gorgeous red dance heels with cushioned footbed and ankle strap for stability. Perfect heel height for stepping.',
      price: 89.99,
      sku: 'DANCE-HEEL-RED-001',
      quantity: 20,
      category: 'SHOES',
      status: 'ACTIVE',
      trackInventory: true,
      lowStockThreshold: 5,
    },
  })

  const product6 = await prisma.product.create({
    data: {
      vendorStoreId: store2.id,
      name: 'Rhinestone Clutch Purse',
      slug: 'rhinestone-clutch-purse',
      description: 'Elegant rhinestone-embellished clutch purse. Perfect accessory for stepping events and competitions.',
      price: 49.99,
      sku: 'DANCE-CLUTCH-001',
      quantity: 35,
      category: 'ACCESSORIES',
      status: 'ACTIVE',
      trackInventory: true,
      lowStockThreshold: 8,
    },
  })

  console.log(`✓ Created ${6} products`)

  // Update store totals
  await prisma.vendorStore.update({
    where: { id: store1.id },
    data: { totalProducts: 3 },
  })

  await prisma.vendorStore.update({
    where: { id: store2.id },
    data: { totalProducts: 3 },
  })

  console.log('✓ Updated store totals')

  console.log('\n✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Users: 3 (2 vendors + 1 customer)`)
  console.log(`   - Vendor Stores: 2`)
  console.log(`   - Products: 6`)
  console.log('\n🔑 Test Credentials:')
  console.log('   Vendor 1: vendor1@stepperslife.com / password123')
  console.log('   Vendor 2: vendor2@stepperslife.com / password123')
  console.log('   Customer: customer@stepperslife.com / password123')
  console.log('\n🏪 Stores:')
  console.log('   - https://stores.stepperslife.com/store/steppers-paradise')
  console.log('   - https://stores.stepperslife.com/store/dance-elegance')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
