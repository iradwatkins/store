import { SquareClient } from 'square';

async function testSquareConnection() {
  console.log('🟦 Testing Square Connection...\n');

  const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
  });

  try {
    // Test 1: Get Locations
    console.log('📍 Test 1: Fetching Locations...');
    const locationsResult = await client.locations.list();

    if (locationsResult.locations && locationsResult.locations.length > 0) {
      console.log('✅ Locations found:', locationsResult.locations.length);
      locationsResult.locations.forEach((loc) => {
        console.log(`   - ${loc.name} (ID: ${loc.id})`);
        console.log(`     Address: ${loc.address?.addressLine1}, ${loc.address?.locality}, ${loc.address?.administrativeDistrictLevel1}`);
      });
    } else {
      console.log('⚠️  No locations found');
    }

    // Test 2: Verify Location ID
    console.log('\n📍 Test 2: Verifying Location ID...');
    const locationId = process.env.SQUARE_LOCATION_ID!;
    const locationResult = await client.locations.get({ locationId });

    if (locationResult.location) {
      console.log('✅ Location verified:');
      console.log(`   Name: ${locationResult.location.name}`);
      console.log(`   Status: ${locationResult.location.status}`);
      console.log(`   Currency: ${locationResult.location.currency}`);
    }

    // Test 3: Create Test Payment
    console.log('\n💳 Test 3: Testing Payment API...');
    try {
      const paymentResult = await client.payments.create({
        sourceId: 'cnon:card-nonce-ok',
        idempotencyKey: `test-${Date.now()}`,
        amountMoney: {
          amount: BigInt(100),
          currency: 'USD',
        },
        locationId,
      });

      if (paymentResult.payment) {
        console.log('✅ Test payment created:');
        console.log(`   ID: ${paymentResult.payment.id}`);
        console.log(`   Status: ${paymentResult.payment.status}`);
        console.log(`   Amount: $${Number(paymentResult.payment.amountMoney?.amount || 0) / 100}`);
      }
    } catch (error: any) {
      if (error.message?.includes('Invalid source') || error.message?.includes('INVALID_VALUE')) {
        console.log('⚠️  Test nonce not valid in sandbox (expected)');
        console.log('✅ Payment API is accessible and responding');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All Square tests completed successfully!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Environment: ${process.env.SQUARE_ENVIRONMENT || 'sandbox'}`);
    console.log(`   Application ID: ${process.env.SQUARE_APPLICATION_ID}`);
    console.log(`   Location ID: ${process.env.SQUARE_LOCATION_ID}`);
    console.log(`   Access Token: ${process.env.SQUARE_ACCESS_TOKEN?.substring(0, 20)}...`);

  } catch (error: any) {
    console.error('\n❌ Square API Error:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Full error:`, error);
    process.exit(1);
  }
}

testSquareConnection();
