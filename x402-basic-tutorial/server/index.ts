import { config } from 'dotenv';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { paymentMiddleware } from '@x402/hono';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactAvmScheme } from '@x402/avm/exact/server';
import { ALGORAND_TESTNET_CAIP2, USDC_TESTNET_ASA_ID } from '@x402/avm';

config();

const avmAddress = process.env.AVM_ADDRESS;
const facilitatorUrl = process.env.FACILITATOR_URL;

if (!avmAddress || !facilitatorUrl) {
  console.error('Missing environment variables: AVM_ADDRESS or FACILITATOR_URL');
  process.exit(1);
}

// Initialize the Resource Server
const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
const server = new x402ResourceServer(facilitatorClient);

// Register Network Schemes
const avmServerScheme = new ExactAvmScheme();
server.register(ALGORAND_TESTNET_CAIP2, avmServerScheme);

const app = new Hono();

// Protected Route Middleware
app.use(
  paymentMiddleware(
    {
      'GET /weather': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.005',
            network: ALGORAND_TESTNET_CAIP2,
            payTo: avmAddress,
            extra: { asset: USDC_TESTNET_ASA_ID },
          },
        ],
        description: 'Weather data access',
      },
    },
    server,
  ),
);

// Resource Handler
app.get('/weather', c => {
  return c.json({
    report: {
      weather: 'sunny',
      temperature: 70,
      timestamp: new Date().toISOString(),
    },
  });
});

serve({ fetch: app.fetch, port: 4021 }, () => {
  console.log(`x402 Resource Server listening at http://localhost:4021`);
});
