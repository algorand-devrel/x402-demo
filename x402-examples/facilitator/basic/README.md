# x402 Basic Facilitator

Role: Settlement and verification service for x402 payments on Algorand.

## What It Does

The facilitator is the "truth machine" between your resource server and Algorand.

It:
1. Receives a signed payment payload from the server flow.
2. Verifies the payload and submits it to Algorand Testnet.
3. Confirms settlement and returns proof.

It is stateless and does not custody customer funds or merchant keys.

## Endpoints

### POST /verify

Validates payment data and submits the transaction.

Success response:

```json
{
  "success": true,
  "message": "Payment verified",
  "transaction": "TX_ID_HERE"
}
```

### POST /settle

Confirms payment finality and returns settlement details.

Success response:

```json
{
  "success": true,
  "settled": true,
  "transaction": "TX_ID_HERE",
  "network": "algorand:...",
  "payer": "ADDRESS_HERE"
}
```

## Environment

| Variable | Description | Example |
| --- | --- | --- |
| `AVM_MNEMONIC` | Mnemonic used to derive facilitator identity/address | `your mnemonic here` |
| `PORT` | HTTP port for facilitator server | `4022` |

Store `AVM_MNEMONIC` securely.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```env
AVM_MNEMONIC=your_algorand_mnemonic_here
PORT=4022
```

3. Start the facilitator:

```bash
npm start
```

Runs at `http://localhost:4022`.

## Resource Server Integration

```typescript
const facilitatorClient = new HTTPFacilitatorClient({
  url: "http://localhost:4022",
});

const server = new x402ResourceServer(facilitatorClient);
```

During protected requests, the server delegates payment verification/settlement to this facilitator.

## Full Local Flow

Start each service in separate terminals:

1. Facilitator

```bash
cd facilitator/basic
npm start
```

2. Resource server

```bash
cd server/hono
npm start
```

3. Example client

```bash
cd client/fetch
npm start
```

Expected flow: client gets `402`, creates payment, facilitator verifies and settles on Algorand, server returns the protected resource.
