# x402 Hono Resource Server

Role: Policy layer that turns API endpoints into paid endpoints using x402 middleware.

## What It Does

This server defines:
1. Which routes are paid.
2. How much each route costs.
3. Which wallet receives payment.

It does not settle payments directly. It delegates verification and settlement to the facilitator.

## Define Paid Routes

```typescript
const accepts = [
  {
    scheme: "exact",
    price: "$0.005",
    network: "algorand:...",
    payTo: avmAddress,
  },
];

app.use(
  paymentMiddleware(
    {
      "GET /weather": { accepts, description: "Weather data" },
    },
    server,
  ),
);
```

## Request Flow

1. Client calls a protected route.
2. Server returns `402 Payment Required` with payment requirements.
3. Client signs and resends with `x-402-payment-signature`.
4. Middleware asks facilitator to verify/settle.
5. Server returns the protected resource with payment proof.

## Environment

| Variable | Description | Example |
| --- | --- | --- |
| `AVM_ADDRESS` | Wallet address that receives payment | `AAAAA...` |
| `FACILITATOR_URL` | URL of facilitator service | `https://facilitator.goplausible.xyz` |
| `PORT` | HTTP port for this server | `4021` |

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```env
AVM_ADDRESS=your_algorand_address_here
FACILITATOR_URL=https://facilitator.goplausible.xyz
PORT=4021
```

3. Start the server:

```bash
npm start
```

Runs at `http://localhost:4021`.

By default, you can use the hosted facilitator via `FACILITATOR_URL=https://facilitator.goplausible.xyz`.

If you want to run the full local end-to-end flow with your own facilitator, see `x402-examples/facilitator/basic/README.md`.
