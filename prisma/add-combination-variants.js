const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addCombinationVariants() {
  console.log('Adding combination variant products (Color + Size)...\n')

  // Get Style Haven store
  const styleHaven = await prisma.vendor_stores.findFirst({
    where: { slug: 'style-haven' }
  })

  if (!styleHaven) {
    console.error('Style Haven store not found')
    return
  }

  // Create a new product: Classic T-Shirt with Color + Size combinations
  const tshirt = await prisma.products.create({
    data: {
      id: 'prod-clothing-tshirt-001',
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-t-shirt',
      description: 'Soft, breathable cotton t-shirt. Available in multiple colors and sizes. Perfect for everyday wear.',
      price: 24.99,
      compareAtPrice: 35.00,
      category: 'CLOTHING',
      vendorStoreId: styleHaven.id,
      sku: 'TSH-001',
      quantity: 200, // Total across all variants
      status: 'ACTIVE',
      hasVariants: true,
      useMultiVariants: true,
      variantTypes: ['Color', 'Size']
    }
  })

  console.log('✅ Created product: Premium Cotton T-Shirt')

  // Add product image
  await prisma.product_images.create({
    data: {
      id: 'img-tshirt-001',
      productId: tshirt.id,
      url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      altText: 'Premium Cotton T-Shirt',
      sortOrder: 0
    }
  })

  console.log('✅ Added product image')

  // Define color and size options
  const colors = [
    { name: 'White', hex: '#FFFFFF', stock: 50 },
    { name: 'Black', hex: '#000000', stock: 50 },
    { name: 'Navy', hex: '#001F3F', stock: 50 },
    { name: 'Gray', hex: '#808080', stock: 50 }
  ]

  const sizes = [
    { name: 'Small', abbr: 'S' },
    { name: 'Medium', abbr: 'M' },
    { name: 'Large', abbr: 'L' },
    { name: 'X-Large', abbr: 'XL' }
  ]

  // Create variant combinations (Color × Size = 16 variants)
  let variantIndex = 0
  for (const color of colors) {
    for (const size of sizes) {
      // Calculate stock per combination
      const stockPerCombo = Math.floor(color.stock / sizes.length)

      // Price adjustments for XL
      const priceAdjustment = size.abbr === 'XL' ? 2.00 : 0
      const variantPrice = 24.99 + priceAdjustment

      await prisma.product_variants.create({
        data: {
          id: `var-tshirt-001-${variantIndex}`,
          productId: tshirt.id,
          name: `${color.name} / ${size.name}`,
          value: `${color.name}-${size.abbr}`,
          price: variantPrice,
          sku: `TSH-${color.name.toUpperCase().substring(0, 3)}-${size.abbr}`,
          quantity: stockPerCombo,
          sortOrder: variantIndex,
          available: true
        }
      })

      variantIndex++
    }
  }

  console.log(`✅ Created ${variantIndex} combination variants (4 colors × 4 sizes)`)

  // Create another example: Polo Shirt
  const polo = await prisma.products.create({
    data: {
      id: 'prod-clothing-polo-001',
      name: 'Classic Polo Shirt',
      slug: 'classic-polo-shirt',
      description: 'Timeless polo shirt in premium pique cotton. Professional yet casual. Multiple color and size options.',
      price: 45.00,
      compareAtPrice: 65.00,
      category: 'CLOTHING',
      vendorStoreId: styleHaven.id,
      sku: 'POLO-001',
      quantity: 120,
      status: 'ACTIVE',
      hasVariants: true,
      useMultiVariants: true,
      variantTypes: ['Color', 'Size']
    }
  })

  console.log('✅ Created product: Classic Polo Shirt')

  // Add product image for polo
  await prisma.product_images.create({
    data: {
      id: 'img-polo-001',
      productId: polo.id,
      url: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800',
      altText: 'Classic Polo Shirt',
      sortOrder: 0
    }
  })

  console.log('✅ Added product image')

  // Polo colors (fewer options)
  const poloColors = [
    { name: 'White', stock: 40 },
    { name: 'Navy', stock: 40 },
    { name: 'Forest Green', stock: 40 }
  ]

  // Create polo variant combinations
  variantIndex = 0
  for (const color of poloColors) {
    for (const size of sizes) {
      const stockPerCombo = Math.floor(color.stock / sizes.length)
      const priceAdjustment = size.abbr === 'XL' ? 3.00 : 0
      const variantPrice = 45.00 + priceAdjustment

      await prisma.product_variants.create({
        data: {
          id: `var-polo-001-${variantIndex}`,
          productId: polo.id,
          name: `${color.name} / ${size.name}`,
          value: `${color.name}-${size.abbr}`,
          price: variantPrice,
          sku: `POLO-${color.name.toUpperCase().replace(' ', '').substring(0, 3)}-${size.abbr}`,
          quantity: stockPerCombo,
          sortOrder: variantIndex,
          available: true
        }
      })

      variantIndex++
    }
  }

  console.log(`✅ Created ${variantIndex} combination variants for Polo (3 colors × 4 sizes)`)

  // Summary
  const totalVariants = await prisma.product_variants.count()
  const productsWithVariants = await prisma.products.count({
    where: { hasVariants: true }
  })

  console.log('\n📊 Summary:')
  console.log(`   Total products with variants: ${productsWithVariants}`)
  console.log(`   Total variants in database: ${totalVariants}`)
  console.log('\n🎨 Combination Variant Products:')
  console.log('   1. Premium Cotton T-Shirt - 16 variants (4 colors × 4 sizes)')
  console.log('   2. Classic Polo Shirt - 12 variants (3 colors × 4 sizes)')
  console.log('\n✅ Combination variants created successfully!')
}

addCombinationVariants()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
