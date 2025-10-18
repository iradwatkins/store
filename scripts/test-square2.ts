import { SquareClient } from 'square';

async function testSquareConnection() {
  console.log('Testing Square Connection...\n');

  const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: process.env.SQUARE_ENVIRONMENT || 'https://connect.squareupsandbox.com',
  });

  try {
    console.log('Test 1: Fetching Locations...');
    const locationsResult = await client.locations.list();

    if (locationsResult.locations && locationsResult.locations.length > 0) {
      console.log('Locations found:', locationsResult.locations.length);
      locationsResult.locations.forEach((loc) => {
        console.log(`- ${loc.name} (ID: ${loc.id})`);
      });
    }

    console.log('\nTest 2: Verifying Location ID...');
    const locationId = process.env.SQUARE_LOCATION_ID!;
    const locationResult = await client.locations.get({ locationId });

    if (locationResult.location) {
      console.log('Location verified:');
      console.log(`Name: ${locationResult.location.name}`);
      console.log(`Status: ${locationResult.location.status}`);
    }

    console.log('\nAll Square tests completed successfully!');
  } catch (error: any) {
    console.error('Square API Error:', error.message);
    process.exit(1);
  }
}

testSquareConnection();
