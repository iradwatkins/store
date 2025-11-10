const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addVariants() {
  console.log('Adding product variants...\n')

  // Classic Denim Jacket - Size variants
  const denimJacket = await prisma.products.findUnique({ where: { id: 'prod-clothing-001' } })
  if (denimJacket) {
    const sizes = [
      { name: 'Size', value: 'Small', price: 89.99, sku: 'CDJ-S', quantity: 10 },
      { name: 'Size', value: 'Medium', price: 89.99, sku: 'CDJ-M', quantity: 15 },
      { name: 'Size', value: 'Large', price: 89.99, sku: 'CDJ-L', quantity: 12 },
      { name: 'Size', value: 'X-Large', price: 89.99, sku: 'CDJ-XL', quantity: 8 },
    ]

    for (const [index, variant] of sizes.entries()) {
      await prisma.product_variants.create({
        data: {
          id: `var-clothing-001-${index}`,
          productId: denimJacket.id,
          name: variant.name,
          value: variant.value,
          price: variant.price,
          sku: variant.sku,
          quantity: variant.quantity,
          sortOrder: index,
        }
      })
    }
    console.log('✅ Added size variants to Classic Denim Jacket')
  }

  // Casual Chino Pants - Size + Color variants
  const chinoPants = await prisma.products.findUnique({ where: { id: 'prod-clothing-003' } })
  if (chinoPants) {
    const variants = [
      { name: 'Size', value: 'Small', price: 55.00, sku: 'CCP-S-KHAKI', quantity: 15 },
      { name: 'Size', value: 'Medium', price: 55.00, sku: 'CCP-M-KHAKI', quantity: 20 },
      { name: 'Size', value: 'Large', price: 55.00, sku: 'CCP-L-KHAKI', quantity: 25 },
      { name: 'Size', value: 'X-Large', price: 55.00, sku: 'CCP-XL-KHAKI', quantity: 20 },
    ]

    for (const [index, variant] of variants.entries()) {
      await prisma.product_variants.create({
        data: {
          id: `var-clothing-003-${index}`,
          productId: chinoPants.id,
          name: variant.name,
          value: variant.value,
          price: variant.price,
          sku: variant.sku,
          quantity: variant.quantity,
          sortOrder: index,
        }
      })
    }
    console.log('✅ Added variants to Casual Chino Pants')
  }

  // Merino Wool Sweater - Size + Color
  const woolSweater = await prisma.products.findUnique({ where: { id: 'prod-clothing-004' } })
  if (woolSweater) {
    const variants = [
      { name: 'Size', value: 'Small', color: 'Navy', price: 95.00, sku: 'MWS-S-NAVY', quantity: 8 },
      { name: 'Size', value: 'Medium', color: 'Navy', price: 95.00, sku: 'MWS-M-NAVY', quantity: 12 },
      { name: 'Size', value: 'Large', color: 'Navy', price: 95.00, sku: 'MWS-L-NAVY', quantity: 10 },
      { name: 'Size', value: 'X-Large', color: 'Navy', price: 95.00, sku: 'MWS-XL-NAVY', quantity: 5 },
    ]

    for (const [index, variant] of variants.entries()) {
      await prisma.product_variants.create({
        data: {
          id: `var-clothing-004-${index}`,
          productId: woolSweater.id,
          name: variant.name,
          value: variant.value,
          price: variant.price,
          sku: variant.sku,
          quantity: variant.quantity,
          sortOrder: index,
        }
      })
    }
    console.log('✅ Added variants to Merino Wool Sweater')
  }

  // Baseball Cap - Size + Color
  const baseballCap = await prisma.products.findUnique({ where: { id: 'prod-hat-002' } })
  if (baseballCap) {
    const variants = [
      { name: 'Color', value: 'Black', price: 32.00, sku: 'BC-BLACK', quantity: 30 },
      { name: 'Color', value: 'Navy', price: 32.00, sku: 'BC-NAVY', quantity: 25 },
      { name: 'Color', value: 'Red', price: 32.00, sku: 'BC-RED', quantity: 20 },
      { name: 'Color', value: 'Gray', price: 32.00, sku: 'BC-GRAY', quantity: 25 },
    ]

    for (const [index, variant] of variants.entries()) {
      await prisma.product_variants.create({
        data: {
          id: `var-hat-002-${index}`,
          productId: baseballCap.id,
          name: variant.name,
          value: variant.value,
          price: variant.price,
          sku: variant.sku,
          quantity: variant.quantity,
          sortOrder: index,
        }
      })
    }
    console.log('✅ Added color variants to Baseball Cap')
  }

  // Wide Brim Sun Hat - Size
  const sunHat = await prisma.products.findUnique({ where: { id: 'prod-hat-003' } })
  if (sunHat) {
    const variants = [
      { name: 'Size', value: 'Small (21")', price: 45.00, sku: 'SH-S', quantity: 15 },
      { name: 'Size', value: 'Medium (22")', price: 45.00, sku: 'SH-M', quantity: 20 },
      { name: 'Size', value: 'Large (23")', price: 45.00, sku: 'SH-L', quantity: 15 },
      { name: 'Size', value: 'X-Large (24")', price: 45.00, sku: 'SH-XL', quantity: 10 },
    ]

    for (const [index, variant] of variants.entries()) {
      await prisma.product_variants.create({
        data: {
          id: `var-hat-003-${index}`,
          productId: sunHat.id,
          name: variant.name,
          value: variant.value,
          price: variant.price,
          sku: variant.sku,
          quantity: variant.quantity,
          sortOrder: index,
        }
      })
    }
    console.log('✅ Added size variants to Wide Brim Sun Hat')
  }

  // Add a few more products with variants
  const products = await prisma.products.findMany({
    where: {
      id: {
        in: ['prod-jewelry-001', 'prod-jewelry-005', 'prod-pet-004']
      }
    }
  })

  // Diamond Solitaire Necklace - Chain Length
  const necklace = products.find(p => p.id === 'prod-jewelry-001')
  if (necklace) {
    const variants = [
      { name: 'Chain Length', value: '16 inches', price: 1250.00, sku: 'DSN-16', quantity: 3 },
      { name: 'Chain Length', value: '18 inches', price: 1250.00, sku: 'DSN-18', quantity: 5 },
      { name: 'Chain Length', value: '20 inches', price: 1275.00, sku: 'DSN-20', quantity: 4 },
    ]

    for (const [index, variant] of variants.entries()) {
      await prisma.product_variants.create({
        data: {
          id: `var-jewelry-001-${index}`,
          productId: necklace.id,
          name: variant.name,
          value: variant.value,
          price: variant.price,
          sku: variant.sku,
          quantity: variant.quantity,
          sortOrder: index,
        }
      })
    }
    console.log('✅ Added chain length variants to Diamond Solitaire Necklace')
  }

  // Gemstone Pendant - Stone Type
  const pendant = products.find(p => p.id === 'prod-jewelry-005')
  if (pendant) {
    const variants = [
      { name: 'Stone', value: 'Amethyst', price: 95.00, sku: 'GP-AMETHYST', quantity: 10 },
      { name: 'Stone', value: 'Emerald', price: 110.00, sku: 'GP-EMERALD', quantity: 8 },
      { name: 'Stone', value: 'Sapphire', price: 120.00, sku: 'GP-SAPPHIRE', quantity: 7 },
      { name: 'Stone', value: 'Ruby', price: 115.00, sku: 'GP-RUBY', quantity: 9 },
    ]

    for (const [index, variant] of variants.entries()) {
      await prisma.product_variants.create({
        data: {
          id: `var-jewelry-005-${index}`,
          productId: pendant.id,
          name: variant.name,
          value: variant.value,
          price: variant.price,
          sku: variant.sku,
          quantity: variant.quantity,
          sortOrder: index,
        }
      })
    }
    console.log('✅ Added stone variants to Gemstone Pendant')
  }

  // Adjustable Dog Collar - Size
  const dogCollar = products.find(p => p.id === 'prod-pet-004')
  if (dogCollar) {
    const variants = [
      { name: 'Size', value: 'Small (10-14")', price: 16.50, sku: 'DC-S', quantity: 40 },
      { name: 'Size', value: 'Medium (14-18")', price: 16.50, sku: 'DC-M', quantity: 50 },
      { name: 'Size', value: 'Large (18-24")', price: 18.50, sku: 'DC-L', quantity: 35 },
      { name: 'Size', value: 'X-Large (24-30")', price: 20.50, sku: 'DC-XL', quantity: 25 },
    ]

    for (const [index, variant] of variants.entries()) {
      await prisma.product_variants.create({
        data: {
          id: `var-pet-004-${index}`,
          productId: dogCollar.id,
          name: variant.name,
          value: variant.value,
          price: variant.price,
          sku: variant.sku,
          quantity: variant.quantity,
          sortOrder: index,
        }
      })
    }
    console.log('✅ Added size variants to Adjustable Dog Collar')
  }

  console.log('\n✅ All variants added successfully!')

  // Show summary
  const totalVariants = await prisma.product_variants.count()
  console.log(`\nTotal variants in database: ${totalVariants}`)
}

addVariants()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
