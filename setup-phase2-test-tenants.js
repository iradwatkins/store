const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupPhase2TestData() {
  console.log('🚀 Creating Phase 2 Multi-Tenancy Test Data...\n');

  // Create test users for tenant owners
  const nikeOwner = await prisma.user.upsert({
    where: { email: 'nike@stepperslife.com' },
    update: {},
    create: {
      email: 'nike@stepperslife.com',
      name: 'Nike Admin',
      role: 'STORE_OWNER',
      emailVerified: new Date(),
    }
  });
  console.log('✅ User (Nike Owner):', nikeOwner.email);

  const adidasOwner = await prisma.user.upsert({
    where: { email: 'adidas@stepperslife.com' },
    update: {},
    create: {
      email: 'adidas@stepperslife.com',
      name: 'Adidas Admin',
      role: 'STORE_OWNER',
      emailVerified: new Date(),
    }
  });
  console.log('✅ User (Adidas Owner):', adidasOwner.email);

  const localShopOwner = await prisma.user.upsert({
    where: { email: 'localshop@stepperslife.com' },
    update: {},
    create: {
      email: 'localshop@stepperslife.com',
      name: 'Local Shop Owner',
      role: 'STORE_OWNER',
      emailVerified: new Date(),
    }
  });
  console.log('✅ User (Local Shop Owner):', localShopOwner.email);

  // Create Tenant 1: Nike Store (PRO plan)
  const nikeTenant = await prisma.tenant.upsert({
    where: { slug: 'nike' },
    update: {},
    create: {
      name: 'Nike Store',
      slug: 'nike',
      ownerId: nikeOwner.id,
      subscriptionPlan: 'PRO',
      subscriptionStatus: 'ACTIVE',
      maxProducts: 500,
      maxOrders: 1000,
      maxStorageGB: 10.0,
      platformFeePercent: 3.0,
      currentProducts: 0,
      currentOrders: 0,
      currentStorageGB: 0,
      primaryColor: '#FF5733',
      isActive: true,
    }
  });
  console.log('✅ Tenant (PRO):', nikeTenant.name, `- https://${nikeTenant.slug}.stepperslife.com`);

  // Create Tenant 2: Adidas Store (STARTER plan)
  const adidasTenant = await prisma.tenant.upsert({
    where: { slug: 'adidas' },
    update: {},
    create: {
      name: 'Adidas Store',
      slug: 'adidas',
      ownerId: adidasOwner.id,
      subscriptionPlan: 'STARTER',
      subscriptionStatus: 'ACTIVE',
      maxProducts: 50,
      maxOrders: 100,
      maxStorageGB: 1.0,
      platformFeePercent: 5.0,
      currentProducts: 0,
      currentOrders: 0,
      currentStorageGB: 0,
      primaryColor: '#2E86DE',
      isActive: true,
    }
  });
  console.log('✅ Tenant (STARTER):', adidasTenant.name, `- https://${adidasTenant.slug}.stepperslife.com`);

  // Create Tenant 3: Local Shop (TRIAL plan)
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 days from now

  const localShopTenant = await prisma.tenant.upsert({
    where: { slug: 'localshop' },
    update: {},
    create: {
      name: 'Chicago Local Shop',
      slug: 'localshop',
      ownerId: localShopOwner.id,
      subscriptionPlan: 'TRIAL',
      subscriptionStatus: 'TRIAL',
      maxProducts: 10,
      maxOrders: 20,
      maxStorageGB: 0.5,
      platformFeePercent: 7.0,
      currentProducts: 0,
      currentOrders: 0,
      currentStorageGB: 0,
      trialEndsAt: trialEndsAt,
      primaryColor: '#10b981',
      isActive: true,
    }
  });
  console.log('✅ Tenant (TRIAL):', localShopTenant.name, `- https://${localShopTenant.slug}.stepperslife.com`);

  // Link existing vendor stores to tenants (if they exist)
  const existingStores = await prisma.vendorStore.findMany({
    take: 3,
    orderBy: { createdAt: 'asc' }
  });

  if (existingStores.length > 0) {
    // Assign first store to Nike tenant
    if (existingStores[0]) {
      await prisma.vendorStore.update({
        where: { id: existingStores[0].id },
        data: { tenantId: nikeTenant.id }
      });
      console.log(`✅ Linked store "${existingStores[0].name}" to Nike tenant`);
    }

    // Assign second store to Adidas tenant (if exists)
    if (existingStores[1]) {
      await prisma.vendorStore.update({
        where: { id: existingStores[1].id },
        data: { tenantId: adidasTenant.id }
      });
      console.log(`✅ Linked store "${existingStores[1].name}" to Adidas tenant`);
    }

    // Assign third store to Local Shop tenant (if exists)
    if (existingStores[2]) {
      await prisma.vendorStore.update({
        where: { id: existingStores[2].id },
        data: { tenantId: localShopTenant.id }
      });
      console.log(`✅ Linked store "${existingStores[2].name}" to Local Shop tenant`);
    }
  }

  // Create sample subscription history for Nike (simulate past payments)
  const subscriptionHistory = await prisma.subscriptionHistory.create({
    data: {
      tenantId: nikeTenant.id,
      plan: 'PRO',
      amount: 79.00,
      stripePriceId: 'price_test_pro_monthly',
      stripeInvoiceId: 'in_test_' + Date.now(),
      status: 'paid',
      billingPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      billingPeriodEnd: new Date(),
    }
  });
  console.log('✅ Subscription History:', subscriptionHistory.plan, `- $${subscriptionHistory.amount}`);

  // Create sample usage records
  await prisma.usageRecord.createMany({
    data: [
      {
        tenantId: nikeTenant.id,
        metric: 'products',
        quantity: 5,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        tenantId: nikeTenant.id,
        metric: 'orders',
        quantity: 12,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        tenantId: adidasTenant.id,
        metric: 'products',
        quantity: 3,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        tenantId: localShopTenant.id,
        metric: 'products',
        quantity: 2,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ]
  });
  console.log('✅ Usage Records: 4 sample records created');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Phase 2 Multi-Tenancy Test Data Created Successfully!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log('  • 3 Tenants Created:');
  console.log(`    - Nike Store (PRO): https://nike.stepperslife.com`);
  console.log(`    - Adidas Store (STARTER): https://adidas.stepperslife.com`);
  console.log(`    - Chicago Local Shop (TRIAL): https://localshop.stepperslife.com`);
  console.log('  • 3 Tenant Owners Created');
  console.log('  • 1 Subscription History Record');
  console.log('  • 4 Usage Records');

  if (existingStores.length > 0) {
    console.log(`  • ${Math.min(existingStores.length, 3)} Vendor Stores Linked to Tenants`);
  }

  console.log('\n🧪 Test API Endpoints:');
  console.log('  GET  https://stores.stepperslife.com/api/tenants');
  console.log('  GET  https://stores.stepperslife.com/api/tenants/' + nikeTenant.id);
  console.log('  GET  https://stores.stepperslife.com/api/tenants/check-slug?slug=test');

  console.log('\n📝 Test Credentials:');
  console.log('  Nike Owner: nike@stepperslife.com');
  console.log('  Adidas Owner: adidas@stepperslife.com');
  console.log('  Local Shop Owner: localshop@stepperslife.com');

  console.log('\n⚠️  Note: Subdomain routing is not yet implemented.');
  console.log('   Tenants are created but subdomain.stepperslife.com URLs won\'t work until middleware is added.');

  await prisma.$disconnect();
}

setupPhase2TestData().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
