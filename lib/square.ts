import { SquareClient } from 'square';

// Initialize Square client with latest API version 2025-09-24
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENVIRONMENT || 'https://connect.squareupsandbox.com',
  // Use latest Square API version for all requests
  squareVersion: '2025-09-24',
});

export default squareClient;
