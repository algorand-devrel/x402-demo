# x402 Axios Client

**Library:** @x402/axios  
**Complexity:** Low

## Overview

**What it is:** An x402 wrapper for the Axios library that injects an interceptor to handle 402 Payment Required errors globally. Your existing Axios calls work exactly as before—payment logic is injected transparently.

**When to use:** Best for existing production applications that already use Axios. It allows you to keep your existing `axios.get()`, `axios.post()` calls while adding payment logic automatically without refactoring your codebase.

**Modern Tooling:** This example uses @x402 v2.11.0 and tsx for high-performance TypeScript execution without build steps.

## Quick Start

### Installation

```bash
pnpm install
```

### Configuration

Create a `.env` file in this directory with:

```env
AVM_MNEMONIC=your_algorand_mnemonic_here
RESOURCE_SERVER_URL=https://x402.goplausible.xyz/examples
ENDPOINT_PATH=/weather
```

### Run

```bash
pnpm start
```

## How It Works

The Axios wrapper uses a request interceptor that:

1. Wraps your Axios instance with `wrapAxiosWithPayment()`
2. Automatically catches 402 responses
3. Handles the full payment handshake transparently
4. Retries the request with payment signature
5. Returns the successful response

This means your code doesn't change—payment just works behind the scenes, making it ideal for migrating existing Axios-based projects to paid APIs.
