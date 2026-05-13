# x402 Custom Client

**Library:** @x402/core  
**Complexity:** High

## Overview

**What it is:** A bare-bones implementation using @x402/core that manually parses HTTP headers and constructs payment signatures step-by-step. No convenience wrappers—full control over the payment flow.

**When to use:** Use this to deeply understand the inner workings of the x402 protocol, or if you're building a custom wallet, hardware integration, or specialized payment client where you need to control the UX and logic at every step. This is the "unboxed" view of x402.

**Modern Tooling:** This example uses @x402 v2.11.0 and tsx for high-performance TypeScript execution without build steps.

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in this directory with:

```env
AVM_MNEMONIC=your_algorand_mnemonic_here
SERVER_URL=http://localhost:4021
```

### Run

```bash
npm start
```

## How It Works

The custom client demonstrates the raw x402 protocol flow:

1. **Initial Request** — Makes a fetch request to the resource server
2. **Parse Payment Requirements** — If 402, extracts and decodes the `PAYMENT-REQUIRED` header
3. **Select Payment Option** — Chooses which payment option to fulfill
4. **Create Payment Payload** — Constructs a signed payment transaction
5. **Encode Payment Signature** — Wraps the signature into the `PAYMENT-SIGNATURE` header
6. **Retry with Payment** — Sends the request again with the signature
7. **Verify Settlement** — Decodes the response `PAYMENT-RESPONSE` header for proof

This example is educational and serves as a reference implementation for anyone building custom x402 integrations.
