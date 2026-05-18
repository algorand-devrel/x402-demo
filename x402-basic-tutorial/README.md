# x402 Basic Tutorial

This folder follows the [x402 on Algorand tutorial](https://dev.algorand.co/resources/x402-on-algorand/) from the Algorand Developer Portal.

## Structure

- **client/** — Client that pays for API access
- **server/** — Resource server that charges for endpoints

## Quick Start


### 1. Prerequisites

- Node.js LTS or newer with pnpm
- Algorand TestNet account with ALGO and USDC
- See [Setup section](https://dev.algorand.co/resources/x402-on-algorand/#setup) in the tutorial

**Note:** On first run, you may need to approve esbuild for pnpm. If you see a build error, run:

```bash
pnpm approve-builds
```

as described in the x402 dev portal tutorial above.

### 2. Test with Hosted Services (Simplest)

1. Add your mnemonic to `client/.env`
2. Run the client:
   ```bash
   cd client
   pnpm install
   pnpm start
   ```

The client will connect to the hosted resource server and facilitator automatically.

### 3. Run Locally (Full Control)

#### Start the server:
```bash
cd server
pnpm install
pnpm start
```

#### In client/index.ts, uncomment the local URL:
```typescript
// const url = 'https://x402.goplausible.xyz/examples/weather';
const url = 'http://localhost:4021/weather';
```

#### Start the client:
```bash
cd client
pnpm start
```

### 4. Self-Hosted Facilitator (Advanced)

To run your own facilitator for complete control, see the [x402-examples/facilitator/basic](../x402-examples/facilitator/basic) folder for setup instructions.

## Learn More

- [x402 Protocol](https://x402.org/)
- [Algorand Developer Portal](https://dev.algorand.co/)
- [x402 Examples Repository](https://github.com/algorand-devrel/x402-examples)
