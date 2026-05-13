# x402 Fetch Client

**Library:** @x402/fetch  
**Complexity:** Low

## Overview

**What it is:** An x402 wrapper for the native fetch API that automatically handles 402 Payment Required errors and manages the payment handshake transparently.

**When to use:** Best for modern JavaScript/TypeScript applications that use the native fetch API. It's lightweight, has zero third-party HTTP library dependencies, and works seamlessly with browser and Node.js environments.

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
RESOURCE_SERVER_URL=http://localhost:4021
ENDPOINT_PATH=/weather
```

### Run

```bash
npm start
```

## How It Works

The fetch client wraps the native `fetch()` function and transparently:

1. Attempts the initial request
2. If a 402 Payment Required response is received, extracts the payment requirements
3. Creates a payment signature using your AVM signer
4. Retries the request with the payment signature
5. Returns the successful response with settlement details

The result is clean, readable async/await code with payment handling built in.
