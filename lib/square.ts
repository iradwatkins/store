import { SquareClient } from 'square';

// Initialize Square client
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENVIRONMENT || 'https://connect.squareupsandbox.com',
});

export default squareClient;
