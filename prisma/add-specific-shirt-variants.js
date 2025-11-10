const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addSpecificShirtVariants() {
  console.log('Creating: Athletic Performance Shirt with Color + Size variants\n')

  // Get Style Haven store
  const styleHaven = await prisma.vendor_stores.findFirst({
    where: { slug: 'style-haven' }
  })

  if (!styleHaven) {
    console.error('Style Haven store not found')
    return
  }

  // Create ONE product: Athletic Performance Shirt
  const shirt = await prisma.products.create({
    data: {
      id: 'prod-clothing-athletic-shirt-001',
      name: 'Athletic Performance Shirt',
      slug: 'athletic-performance-shirt',
      description: 'Moisture-wicking performance shirt perfect for workouts and active wear. Available in Red and Green, each in Small, Medium, and Large sizes.',
      price: 34.99,
      compareAtPrice: 49.99,
      category: 'CLOTHING',
      vendorStoreId: styleHaven.id,
      sku: 'ATH-SHIRT-001',
      quantity: 180, // Total across all 6 variants
      status: 'ACTIVE',
      hasVariants: true,
      useMultiVariants: true,
      variantTypes: ['Color', 'Size']
    }
  })

  console.log('✅ Created product: Athletic Performance Shirt')

  // Add product image
  await prisma.product_images.create({
    data: {
      id: 'img-athletic-shirt-001',
      productId: shirt.id,
      url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
      altText: 'Athletic Performance Shirt',
      sortOrder: 0
    }
  })

  console.log('✅ Added product image')

  // Define the exact colors and sizes you requested
  const colors = [
    { name: 'Red', code: 'RED', hex: '#DC143C' },
    { name: 'Green', code: 'GRN', hex: '#228B22' }
  ]

  const sizes = [
    { name: 'Small', code: 'S' },
    { name: 'Medium', code: 'M' },
    { name: 'Large', code: 'L' }
  ]

  console.log('\n🎨 Creating variant combinations:')
  console.log('   Colors: Red, Green')
  console.log('   Sizes: Small, Medium, Large')
  console.log('   Total combinations: 2 colors × 3 sizes = 6 variants\n')

  // Create all combinations for this ONE product
  let variantIndex = 0

  for (const color of colors) {
    for (const size of sizes) {
      const variantName = `${color.name} / ${size.name}`
      const sku = `ATH-${color.code}-${size.code}`
      const price = 34.99
      const quantity = 30 // Each combination gets 30 units

      await prisma.product_variants.create({
        data: {
          id: `var-athletic-shirt-${variantIndex}`,
          productId: shirt.id,
          name: variantName,
          value: `${color.code}-${size.code}`,
          price: price,
          sku: sku,
          quantity: quantity,
          sortOrder: variantIndex,
          available: true
        }
      })

      console.log(`   ✓ Created: ${variantName} - $${price} - SKU: ${sku} - Stock: ${quantity}`)
      variantIndex++
    }
  }

  console.log('\n✅ All 6 variant combinations created successfully!')
  console.log('\n📦 ONE PRODUCT WITH 6 VARIANTS:')
  console.log('   Product: Athletic Performance Shirt')
  console.log('   Variants:')
  console.log('      1. Red / Small    - $34.99 - 30 in stock')
  console.log('      2. Red / Medium   - $34.99 - 30 in stock')
  console.log('      3. Red / Large    - $34.99 - 30 in stock')
  console.log('      4. Green / Small  - $34.99 - 30 in stock')
  console.log('      5. Green / Medium - $34.99 - 30 in stock')
  console.log('      6. Green / Large  - $34.99 - 30 in stock')
  console.log('\n   Total stock: 180 units (30 per variant)')
  console.log('\n🌐 Product URL:')
  console.log('   https://stores.stepperslife.com/store/style-haven/products/athletic-performance-shirt')
}

addSpecificShirtVariants()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
