# x402 Basic Tutorial

This folder follows the [x402 on Algorand tutorial](https://dev.algorand.co/resources/x402-on-algorand/) from the Algorand Developer Portal.

## Structure

- **client/** — Client that pays for API access
- **server/** — Resource server that charges for endpoints

## Quick Start

### 1. Prerequisites

- Node.js LTS or newer with npm
- Algorand TestNet account with ALGO and USDC
- See [Setup section](https://dev.algorand.co/resources/x402-on-algorand/#setup) in the tutorial

### 2. Test with Hosted Services (Simplest)

1. Add your mnemonic to `client/.env`
2. Run the client:
   ```bash
   cd client
   npm install
   npm start
   ```

The client will connect to the hosted resource server and facilitator automatically.

### 3. Run Locally (Full Control)

#### Start the server:
```bash
cd server
npm install
npm start
```

#### In client/index.ts, uncomment the local URL:
```typescript
// const url = 'https://x402.goplausible.xyz/examples/weather';
const url = 'http://localhost:4021/weather';
```

#### Start the client:
```bash
cd client
npm start
```

### 4. Self-Hosted Facilitator (Advanced)

To run your own facilitator for complete control, see the [x402-examples/facilitator/basic](../x402-examples/facilitator/basic) folder for setup instructions.

## Learn More

- [x402 Protocol](https://x402.org/)
- [Algorand Developer Portal](https://dev.algorand.co/)
- [x402 Examples Repository](https://github.com/algorand-devrel/x402-examples)
