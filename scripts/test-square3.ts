import dotenv from 'dotenv';
dotenv.config();

import { SquareClient } from 'square';

async function testSquare() {
  console.log('Testing Square API 2025-09-24...\n');

  const token = process.env.SQUARE_ACCESS_TOKEN || '';
  console.log('Token loaded:', token.substring(0, 20) + '...');

  const client = new SquareClient({
    token,
    environment: 'https://connect.squareupsandbox.com',
    squareVersion: '2025-09-24',
  });

  const result = await client.locations.list();
  console.log('Locations:', result.locations?.length);
  result.locations?.forEach(loc => {
    console.log('  -', loc.name, loc.id);
  });
}

testSquare().catch(e => console.error('Error:', e.message, e.errors));
