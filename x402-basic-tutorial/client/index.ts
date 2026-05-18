import { config } from 'dotenv';
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from '@x402/fetch';
import { toClientAvmSigner, ExactAvmScheme, ALGORAND_TESTNET_CAIP2 } from '@x402/avm';
import {
  ed25519SigningKeyFromWrappedSecret,
  type WrappedEd25519Seed,
} from '@algorandfoundation/algokit-utils/crypto';
import { seedFromMnemonic } from '@algorandfoundation/algokit-utils/algo25';

config();

const avmMnemonic = process.env.AVM_MNEMONIC;

if (!avmMnemonic) {
  throw new Error(
    'Missing AVM_MNEMONIC environment variable. Please add it to your .env file.',
  );
}

// Use the hosted x402 resource server
const url = 'https://x402.goplausible.xyz/examples/weather';

// Optional: To test with your local server, uncomment the line below and comment out the hosted URL above
// const url = 'http://localhost:4021/weather';

async function main(): Promise<void> {
  const secretKey = await getSecretKeyFromMnemonic(avmMnemonic);
  // Create the Algorand signer used to authorize payments.
  const avmSigner = toClientAvmSigner(secretKey);

  // Initialize the x402 client.
  const client = new x402Client();

  // Register with network
  client.register(ALGORAND_TESTNET_CAIP2, new ExactAvmScheme(avmSigner));

  console.info(`AVM signer: ${avmSigner.address}`);

  // Wrap fetch so 402 responses trigger payment handling automatically.
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  const response = await fetchWithPayment(url, { method: 'GET' });

  if (response.ok) {
    // Get payment confirmation
    const paymentResponse = new x402HTTPClient(client).getPaymentSettleResponse(name =>
      response.headers.get(name),
    );
    console.log('\n💳 Payment confirmed:', JSON.stringify(paymentResponse, null, 2));

    // Parse the response body
    const responseBody = await response.json();

    // Extract first city from hosted response or local weather
    let weatherData;
    if (responseBody.forecast) {
      const firstCity = Object.keys(responseBody.forecast)[0];
      weatherData = { [firstCity]: responseBody.forecast[firstCity] };
    } else if (responseBody.report) {
      weatherData = responseBody.report;
    } else {
      weatherData = responseBody;
    }

    console.log('\n✅ Resource received:', JSON.stringify(weatherData, null, 2));
  } else {
    console.log(`\nNo payment settled (response status: ${response.status})`);
  }
}

// Build the base64-encoded signing key used by @x402/avm.
// The format is the 32-byte Ed25519 seed concatenated with the 32-byte public key.
async function getSecretKeyFromMnemonic(avmMnemonic: string): Promise<string> {
  const seed = seedFromMnemonic(avmMnemonic);
  const seedCopy = new Uint8Array(seed);
  const wrappedSeed: WrappedEd25519Seed = {
    unwrapEd25519Seed: async () => seed,
    wrapEd25519Seed: async () => {},
  };
  const wrappedSecret = await ed25519SigningKeyFromWrappedSecret(wrappedSeed);

  return Buffer.concat([Buffer.from(seedCopy), Buffer.from(wrappedSecret.ed25519Pubkey)]).toString(
    'base64',
  );
}

main().catch(error => {
  console.error(error?.response?.data?.error ?? error);
  process.exit(1);
});
