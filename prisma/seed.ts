import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { logger } from '../lib/logger'

const prisma = new PrismaClient()

async function main() {
  logger.info('Starting database seed')

  // Create test users
  logger.info('Creating users')
  const defaultPassword = process.env.SEED_USER_PASSWORD || 'dev-password-123'
  const password = await bcrypt.hash(defaultPassword, 10)

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

  logger.info('Created users', { count: 3 })

  // Create vendor stores
  logger.info('Creating vendor stores')

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

  logger.info('Created vendor stores', { count: 2 })

  // Create products for store 1
  logger.info('Creating products')

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

  logger.info('Created products', { count: 6 })

  // Create multi-variant test products
  logger.info('Creating multi-variant test products')
  
  const multiVariantProduct1 = await prisma.product.create({
    data: {
      vendorStoreId: store1.id,
      name: 'Multi-Variant T-Shirt',
      slug: 'multi-variant-t-shirt',
      description: 'A test t-shirt with multiple size and color combinations for testing the multi-variant system.',
      price: 25.99,
      compareAtPrice: 35.99,
      sku: 'MVP-TSH-001',
      category: 'CLOTHING',
      status: 'ACTIVE',
      trackInventory: true,
      quantity: 0, // Will be managed per variant combination
      
      // NEW MULTI-VARIANT SYSTEM
      useMultiVariants: true,
      variantTypes: ['SIZE', 'COLOR'],
      
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
            thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
            medium: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
            large: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
            altText: 'Multi-variant t-shirt',
            sortOrder: 0,
          },
        ],
      },
    },
  })

  // Create variant options for the multi-variant product
  const sizeOptions = [
    { type: 'SIZE', value: 'small', displayName: 'Small', sortOrder: 0 },
    { type: 'SIZE', value: 'medium', displayName: 'Medium', sortOrder: 1 },
    { type: 'SIZE', value: 'large', displayName: 'Large', sortOrder: 2 },
    { type: 'SIZE', value: 'xl', displayName: 'XL', sortOrder: 3 },
  ]

  const colorOptions = [
    { type: 'COLOR', value: 'red', displayName: 'Red', hexColor: '#DC2626', sortOrder: 0 },
    { type: 'COLOR', value: 'blue', displayName: 'Blue', hexColor: '#2563EB', sortOrder: 1 },
    { type: 'COLOR', value: 'black', displayName: 'Black', hexColor: '#000000', sortOrder: 2 },
    { type: 'COLOR', value: 'white', displayName: 'White', hexColor: '#FFFFFF', sortOrder: 3 },
  ]

  // Create variant options
  for (const option of [...sizeOptions, ...colorOptions]) {
    await prisma.variantOption.create({
      data: {
        productId: multiVariantProduct1.id,
        type: option.type,
        value: option.value,
        displayName: option.displayName,
        hexColor: option.hexColor || null,
        sortOrder: option.sortOrder,
        isActive: true,
      },
    })
  }

  // Create variant combinations (Size × Color = 16 combinations)
  const combinations = []
  for (const size of sizeOptions) {
    for (const color of colorOptions) {
      const combinationKey = `${size.value}:${color.value}`
      const basePrice = 25.99
      const priceVariation = Math.random() * 5 // Random price variation up to $5
      const quantity = Math.floor(Math.random() * 20) + 5 // Random inventory 5-25

      combinations.push({
        productId: multiVariantProduct1.id,
        combinationKey,
        optionValues: {
          SIZE: size.value,
          COLOR: color.value
        },
        sku: `MVP-TSH-001-${size.value.toUpperCase()}-${color.value.toUpperCase()}`,
        price: Number((basePrice + priceVariation).toFixed(2)),
        compareAtPrice: Number((basePrice + priceVariation + 10).toFixed(2)),
        quantity,
        available: true,
        inStock: quantity > 0,
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        sortOrder: (size.sortOrder * 10) + color.sortOrder,
      })
    }
  }

  // Create all variant combinations
  for (const combination of combinations) {
    await prisma.variantCombination.create({
      data: combination,
    })
  }

  logger.info('Created multi-variant test products')
  logger.info('Multi-Variant T-Shirt created', { combinations: combinations.length })

  // Update store totals
  await prisma.vendorStore.update({
    where: { id: store1.id },
    data: { totalProducts: 4 }, // 3 regular + 1 multi-variant
  })

  await prisma.vendorStore.update({
    where: { id: store2.id },
    data: { totalProducts: 3 },
  })

  logger.info('Updated store totals')

  logger.info('Seed completed successfully')
  logger.info('Seed Summary:')
  logger.info('Users created: 3 (2 vendors + 1 customer)')
  logger.info('Vendor Stores created: 2')
  logger.info('Products created: 7 (6 regular + 1 multi-variant with 16 combinations)')
  logger.info('Test Credentials:')
  logger.info('Vendor 1 credentials', { email: 'vendor1@stepperslife.com', password: defaultPassword })
  logger.info('Vendor 2 credentials', { email: 'vendor2@stepperslife.com', password: defaultPassword })
  logger.info('Customer credentials', { email: 'customer@stepperslife.com', password: defaultPassword })
  logger.info('Tip: Set SEED_USER_PASSWORD environment variable to customize the password')
  logger.info('Stores:')
  logger.info('Store URL: https://stores.stepperslife.com/store/steppers-paradise')
  logger.info('Store URL: https://stores.stepperslife.com/store/dance-elegance')
}

main()
  .catch((e) => {
    logger.error('Seed failed', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
