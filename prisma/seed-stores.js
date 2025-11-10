const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create vendor users for each store
  const vendors = []

  const vendorData = [
    { name: 'Style Haven Owner', email: 'clothing@example.com', storeName: 'Style Haven' },
    { name: 'Paws & Claws Owner', email: 'petstore@example.com', storeName: 'Paws & Claws' },
    { name: 'Glamour Beauty Owner', email: 'beauty@example.com', storeName: 'Glamour Beauty' },
    { name: 'Modern Living Owner', email: 'furniture@example.com', storeName: 'Modern Living' },
    { name: 'Hat Emporium Owner', email: 'hats@example.com', storeName: 'Hat Emporium' },
    { name: 'Sparkle Jewels Owner', email: 'jewelry@example.com', storeName: 'Sparkle Jewels' },
  ]

  // Create users and stores
  for (const vendor of vendorData) {
    const hashedPassword = await bcrypt.hash('password123', 10)

    const user = await prisma.user.upsert({
      where: { email: vendor.email },
      update: {},
      create: {
        id: `user-${vendor.email}`,
        name: vendor.name,
        email: vendor.email,
        password: hashedPassword,
        role: 'STORE_OWNER',
      },
    })

    vendors.push({ user, storeName: vendor.storeName })
    console.log(`✓ Created vendor: ${vendor.name}`)
  }

  // Store 1: Style Haven (Clothing Store)
  const clothingStore = await prisma.vendor_stores.create({
    data: {
      id: 'store-clothing',
      userId: vendors[0].user.id,
      storeId: 'clothing-001',
      name: 'Style Haven',
      slug: 'style-haven',
      tagline: 'Where Fashion Meets Comfort',
      description: 'Premium clothing for the modern individual. From casual wear to formal attire.',
      email: 'contact@stylehaven.com',
      phone: '555-0101',
      isActive: true,
      platformFeePercent: 10,
    },
  })

  const clothingProducts = [
    {
      id: 'prod-clothing-001',
      name: 'Classic Denim Jacket',
      slug: 'classic-denim-jacket',
      description: 'Timeless denim jacket with vintage wash. Perfect for layering.',
      price: 89.99,
      compareAtPrice: 120.00,
      sku: 'CLT-JKT-001',
      quantity: 45,
      category: 'CLOTHING',
      images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'],
    },
    {
      id: 'prod-clothing-002',
      name: 'Silk Blend Dress Shirt',
      slug: 'silk-blend-dress-shirt',
      description: 'Elegant silk blend dress shirt for formal occasions.',
      price: 65.00,
      sku: 'CLT-SHT-002',
      quantity: 60,
      category: 'CLOTHING',
      images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800'],
    },
    {
      id: 'prod-clothing-003',
      name: 'Casual Chino Pants',
      slug: 'casual-chino-pants',
      description: 'Comfortable chino pants for everyday wear. Available in multiple colors.',
      price: 55.00,
      compareAtPrice: 75.00,
      sku: 'CLT-PNT-003',
      quantity: 80,
      category: 'CLOTHING',
      images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800'],
    },
    {
      id: 'prod-clothing-004',
      name: 'Merino Wool Sweater',
      slug: 'merino-wool-sweater',
      description: 'Premium merino wool sweater. Soft, warm, and breathable.',
      price: 95.00,
      sku: 'CLT-SWT-004',
      quantity: 35,
      category: 'CLOTHING',
      images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'],
    },
    {
      id: 'prod-clothing-005',
      name: 'Summer Linen Shorts',
      slug: 'summer-linen-shorts',
      description: 'Lightweight linen shorts perfect for summer.',
      price: 42.00,
      sku: 'CLT-SRT-005',
      quantity: 70,
      category: 'CLOTHING',
      images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800'],
    },
  ]

  for (const product of clothingProducts) {
    const { images, ...productData } = product
    await prisma.products.create({
      data: {
        ...productData,
        vendorStoreId: clothingStore.id,
        status: 'ACTIVE',
        trackInventory: true,
        lowStockThreshold: 10,
        product_images: {
          create: images.map((url, idx) => ({
            id: `img-${product.id}-${idx}`,
            url,
            sortOrder: idx,
          })),
        },
      },
    })
  }
  console.log(`✓ Created ${clothingProducts.length} products for Style Haven`)

  // Store 2: Paws & Claws (Pet Store)
  const petStore = await prisma.vendor_stores.create({
    data: {
      id: 'store-pets',
      userId: vendors[1].user.id,
      storeId: 'pets-001',
      name: 'Paws & Claws',
      slug: 'paws-and-claws',
      tagline: 'Everything Your Pet Needs',
      description: 'Quality pet supplies, toys, and accessories for dogs, cats, and more.',
      email: 'contact@pawsandclaws.com',
      phone: '555-0102',
      isActive: true,
      platformFeePercent: 10,
    },
  })

  const petProducts = [
    {
      id: 'prod-pet-001',
      name: 'Premium Dog Food (25lb)',
      slug: 'premium-dog-food-25lb',
      description: 'Grain-free premium dog food with real chicken. Supports healthy digestion.',
      price: 68.00,
      sku: 'PET-FD-001',
      quantity: 120,
      category: 'PET_SUPPLIES',
      images: ['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800'],
    },
    {
      id: 'prod-pet-002',
      name: 'Interactive Cat Toy Set',
      slug: 'interactive-cat-toy-set',
      description: 'Set of 5 interactive toys to keep your cat entertained for hours.',
      price: 24.99,
      sku: 'PET-TOY-002',
      quantity: 85,
      category: 'PET_SUPPLIES',
      images: ['https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800'],
    },
    {
      id: 'prod-pet-003',
      name: 'Orthopedic Dog Bed',
      slug: 'orthopedic-dog-bed',
      description: 'Memory foam dog bed with washable cover. Perfect for senior dogs.',
      price: 79.99,
      compareAtPrice: 110.00,
      sku: 'PET-BED-003',
      quantity: 40,
      category: 'PET_SUPPLIES',
      images: ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800'],
    },
    {
      id: 'prod-pet-004',
      name: 'Adjustable Dog Collar',
      slug: 'adjustable-dog-collar',
      description: 'Durable nylon collar with reflective stitching. Multiple sizes available.',
      price: 16.50,
      sku: 'PET-COL-004',
      quantity: 150,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800'],
    },
    {
      id: 'prod-pet-005',
      name: 'Automatic Pet Feeder',
      slug: 'automatic-pet-feeder',
      description: 'Programmable pet feeder with portion control and timer.',
      price: 54.99,
      sku: 'PET-FDR-005',
      quantity: 55,
      category: 'PET_SUPPLIES',
      images: ['https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800'],
    },
  ]

  for (const product of petProducts) {
    const { images, ...productData } = product
    await prisma.products.create({
      data: {
        ...productData,
        vendorStoreId: petStore.id,
        status: 'ACTIVE',
        trackInventory: true,
        lowStockThreshold: 15,
        product_images: {
          create: images.map((url, idx) => ({
            id: `img-${product.id}-${idx}`,
            url,
            sortOrder: idx,
          })),
        },
      },
    })
  }
  console.log(`✓ Created ${petProducts.length} products for Paws & Claws`)

  // Store 3: Glamour Beauty (Beauty Store)
  const beautyStore = await prisma.vendor_stores.create({
    data: {
      id: 'store-beauty',
      userId: vendors[2].user.id,
      storeId: 'beauty-001',
      name: 'Glamour Beauty',
      slug: 'glamour-beauty',
      tagline: 'Elevate Your Natural Beauty',
      description: 'Premium skincare, makeup, and beauty products from top brands.',
      email: 'contact@glamourbeauty.com',
      phone: '555-0103',
      isActive: true,
      platformFeePercent: 12,
    },
  })

  const beautyProducts = [
    {
      id: 'prod-beauty-001',
      name: 'Vitamin C Serum',
      slug: 'vitamin-c-serum',
      description: 'Brightening serum with 20% Vitamin C. Reduces dark spots and evens skin tone.',
      price: 45.00,
      sku: 'BTY-SRM-001',
      quantity: 90,
      category: 'BATH_AND_BEAUTY',
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800'],
    },
    {
      id: 'prod-beauty-002',
      name: 'Luxury Face Mask Set',
      slug: 'luxury-face-mask-set',
      description: 'Set of 5 hydrating sheet masks infused with hyaluronic acid.',
      price: 28.00,
      sku: 'BTY-MSK-002',
      quantity: 110,
      category: 'BATH_AND_BEAUTY',
      images: ['https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800'],
    },
    {
      id: 'prod-beauty-003',
      name: 'Matte Lipstick Collection',
      slug: 'matte-lipstick-collection',
      description: 'Long-lasting matte lipsticks in 10 stunning shades.',
      price: 32.00,
      compareAtPrice: 45.00,
      sku: 'BTY-LIP-003',
      quantity: 75,
      category: 'BATH_AND_BEAUTY',
      images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800'],
    },
    {
      id: 'prod-beauty-004',
      name: 'Eyeshadow Palette - Nude',
      slug: 'eyeshadow-palette-nude',
      description: '12-shade neutral eyeshadow palette perfect for everyday looks.',
      price: 42.00,
      sku: 'BTY-EYE-004',
      quantity: 65,
      category: 'BATH_AND_BEAUTY',
      images: ['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800'],
    },
    {
      id: 'prod-beauty-005',
      name: 'Organic Face Cleanser',
      slug: 'organic-face-cleanser',
      description: 'Gentle foaming cleanser with natural ingredients. Suitable for all skin types.',
      price: 26.00,
      sku: 'BTY-CLN-005',
      quantity: 95,
      category: 'BATH_AND_BEAUTY',
      images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800'],
    },
  ]

  for (const product of beautyProducts) {
    const { images, ...productData } = product
    await prisma.products.create({
      data: {
        ...productData,
        vendorStoreId: beautyStore.id,
        status: 'ACTIVE',
        trackInventory: true,
        lowStockThreshold: 20,
        product_images: {
          create: images.map((url, idx) => ({
            id: `img-${product.id}-${idx}`,
            url,
            sortOrder: idx,
          })),
        },
      },
    })
  }
  console.log(`✓ Created ${beautyProducts.length} products for Glamour Beauty`)

  // Store 4: Modern Living (Furniture Store)
  const furnitureStore = await prisma.vendor_stores.create({
    data: {
      id: 'store-furniture',
      userId: vendors[3].user.id,
      storeId: 'furniture-001',
      name: 'Modern Living',
      slug: 'modern-living',
      tagline: 'Contemporary Furniture for Every Space',
      description: 'Stylish and functional furniture pieces to transform your home.',
      email: 'contact@modernliving.com',
      phone: '555-0104',
      isActive: true,
      platformFeePercent: 15,
    },
  })

  const furnitureProducts = [
    {
      id: 'prod-furniture-001',
      name: 'Mid-Century Modern Sofa',
      slug: 'mid-century-modern-sofa',
      description: 'Elegant 3-seater sofa with tufted cushions and solid wood legs.',
      price: 899.00,
      compareAtPrice: 1200.00,
      sku: 'FRN-SFA-001',
      quantity: 15,
      category: 'HOME_AND_LIVING',
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
    },
    {
      id: 'prod-furniture-002',
      name: 'Industrial Dining Table',
      slug: 'industrial-dining-table',
      description: 'Solid wood dining table with metal frame. Seats 6 comfortably.',
      price: 650.00,
      sku: 'FRN-TBL-002',
      quantity: 20,
      category: 'HOME_AND_LIVING',
      images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800'],
    },
    {
      id: 'prod-furniture-003',
      name: 'Ergonomic Office Chair',
      slug: 'ergonomic-office-chair',
      description: 'Adjustable office chair with lumbar support and breathable mesh.',
      price: 285.00,
      sku: 'FRN-CHR-003',
      quantity: 35,
      category: 'HOME_AND_LIVING',
      images: ['https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800'],
    },
    {
      id: 'prod-furniture-004',
      name: 'Scandinavian Bookshelf',
      slug: 'scandinavian-bookshelf',
      description: 'Minimalist 5-tier bookshelf with clean lines and oak finish.',
      price: 320.00,
      compareAtPrice: 420.00,
      sku: 'FRN-SHF-004',
      quantity: 25,
      category: 'HOME_AND_LIVING',
      images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800'],
    },
    {
      id: 'prod-furniture-005',
      name: 'Velvet Accent Chair',
      slug: 'velvet-accent-chair',
      description: 'Luxurious velvet chair with gold legs. Perfect for reading nooks.',
      price: 380.00,
      sku: 'FRN-ACC-005',
      quantity: 30,
      category: 'HOME_AND_LIVING',
      images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'],
    },
  ]

  for (const product of furnitureProducts) {
    const { images, ...productData} = product
    await prisma.products.create({
      data: {
        ...productData,
        vendorStoreId: furnitureStore.id,
        status: 'ACTIVE',
        trackInventory: true,
        lowStockThreshold: 5,
        product_images: {
          create: images.map((url, idx) => ({
            id: `img-${product.id}-${idx}`,
            url,
            sortOrder: idx,
          })),
        },
      },
    })
  }
  console.log(`✓ Created ${furnitureProducts.length} products for Modern Living`)

  // Store 5: Hat Emporium (Hat Store)
  const hatStore = await prisma.vendor_stores.create({
    data: {
      id: 'store-hats',
      userId: vendors[4].user.id,
      storeId: 'hats-001',
      name: 'Hat Emporium',
      slug: 'hat-emporium',
      tagline: 'Top Off Your Look in Style',
      description: 'Premium headwear for every occasion. From classic to contemporary.',
      email: 'contact@hatemporium.com',
      phone: '555-0105',
      isActive: true,
      platformFeePercent: 10,
    },
  })

  const hatProducts = [
    {
      id: 'prod-hat-001',
      name: 'Classic Fedora',
      slug: 'classic-fedora',
      description: 'Timeless wool felt fedora with grosgrain ribbon band.',
      price: 68.00,
      sku: 'HAT-FED-001',
      quantity: 50,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800'],
    },
    {
      id: 'prod-hat-002',
      name: 'Baseball Cap - Premium',
      slug: 'baseball-cap-premium',
      description: 'Structured cotton baseball cap with embroidered logo.',
      price: 32.00,
      sku: 'HAT-CAP-002',
      quantity: 100,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800'],
    },
    {
      id: 'prod-hat-003',
      name: 'Wide Brim Sun Hat',
      slug: 'wide-brim-sun-hat',
      description: 'Elegant straw sun hat with UPF 50+ protection.',
      price: 45.00,
      compareAtPrice: 60.00,
      sku: 'HAT-SUN-003',
      quantity: 60,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=800'],
    },
    {
      id: 'prod-hat-004',
      name: 'Wool Beanie',
      slug: 'wool-beanie',
      description: 'Cozy merino wool beanie. Perfect for cold weather.',
      price: 28.00,
      sku: 'HAT-BNE-004',
      quantity: 120,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800'],
    },
    {
      id: 'prod-hat-005',
      name: 'Panama Hat',
      slug: 'panama-hat',
      description: 'Hand-woven Ecuadorian panama hat with leather trim.',
      price: 95.00,
      sku: 'HAT-PAN-005',
      quantity: 35,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800'],
    },
  ]

  for (const product of hatProducts) {
    const { images, ...productData } = product
    await prisma.products.create({
      data: {
        ...productData,
        vendorStoreId: hatStore.id,
        status: 'ACTIVE',
        trackInventory: true,
        lowStockThreshold: 15,
        product_images: {
          create: images.map((url, idx) => ({
            id: `img-${product.id}-${idx}`,
            url,
            sortOrder: idx,
          })),
        },
      },
    })
  }
  console.log(`✓ Created ${hatProducts.length} products for Hat Emporium`)

  // Store 6: Sparkle Jewels (Jewelry Store)
  const jewelryStore = await prisma.vendor_stores.create({
    data: {
      id: 'store-jewelry',
      userId: vendors[5].user.id,
      storeId: 'jewelry-001',
      name: 'Sparkle Jewels',
      slug: 'sparkle-jewels',
      tagline: 'Timeless Elegance, Modern Design',
      description: 'Handcrafted jewelry pieces that make a statement.',
      email: 'contact@sparklejewels.com',
      phone: '555-0106',
      isActive: true,
      platformFeePercent: 12,
    },
  })

  const jewelryProducts = [
    {
      id: 'prod-jewelry-001',
      name: 'Diamond Solitaire Necklace',
      slug: 'diamond-solitaire-necklace',
      description: '0.5ct diamond solitaire on 18k white gold chain.',
      price: 1250.00,
      sku: 'JWL-NCK-001',
      quantity: 12,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800'],
    },
    {
      id: 'prod-jewelry-002',
      name: 'Sterling Silver Bracelet',
      slug: 'sterling-silver-bracelet',
      description: 'Elegant twisted rope design sterling silver bracelet.',
      price: 85.00,
      sku: 'JWL-BRC-002',
      quantity: 45,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800'],
    },
    {
      id: 'prod-jewelry-003',
      name: 'Pearl Stud Earrings',
      slug: 'pearl-stud-earrings',
      description: 'Classic freshwater pearl studs with 14k gold posts.',
      price: 120.00,
      compareAtPrice: 160.00,
      sku: 'JWL-EAR-003',
      quantity: 38,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'],
    },
    {
      id: 'prod-jewelry-004',
      name: 'Rose Gold Ring Set',
      slug: 'rose-gold-ring-set',
      description: 'Set of 3 delicate rose gold stacking rings.',
      price: 165.00,
      sku: 'JWL-RNG-004',
      quantity: 30,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800'],
    },
    {
      id: 'prod-jewelry-005',
      name: 'Gemstone Pendant',
      slug: 'gemstone-pendant',
      description: 'Natural amethyst pendant on sterling silver chain.',
      price: 95.00,
      sku: 'JWL-PND-005',
      quantity: 40,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800'],
    },
  ]

  for (const product of jewelryProducts) {
    const { images, ...productData } = product
    await prisma.products.create({
      data: {
        ...productData,
        vendorStoreId: jewelryStore.id,
        status: 'ACTIVE',
        trackInventory: true,
        lowStockThreshold: 10,
        product_images: {
          create: images.map((url, idx) => ({
            id: `img-${product.id}-${idx}`,
            url,
            sortOrder: idx,
          })),
        },
      },
    })
  }
  console.log(`✓ Created ${jewelryProducts.length} products for Sparkle Jewels`)

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log('  - 6 vendor users created')
  console.log('  - 6 stores created')
  console.log('  - 30 products created (5 per store)')
  console.log('  - 30 product images added')
  console.log('\n💡 Login credentials for all vendors:')
  console.log('  Password: password123')
  console.log('\n📧 Vendor emails:')
  vendorData.forEach(v => console.log(`  - ${v.email} (${v.storeName})`))
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
