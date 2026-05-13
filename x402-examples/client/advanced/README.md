# x402 Advanced Client

**Library:** @x402/fetch  
**Complexity:** High

## Overview

**What it is:** Demonstrates enterprise-grade features including multi-network support (CAIP-2 network identifiers), complex signer configurations, network preference selection, and payment lifecycle hooks.

**When to use:** Use this for:
- Cross-chain and multi-currency applications
- Enterprise payment flows with fallback networks
- Custom payment selection logic based on preferences
- Applications that need to observe and react to payment lifecycle events
- Projects requiring fine-grained control over which networks are supported where

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

Run a specific pattern:

```bash
# Builder Pattern - Register multiple networks with specific signers
pnpm start -- builder-pattern

# Hooks Pattern - Observe payment lifecycle events
pnpm start -- hooks

# Preferred Network - Implement custom network selection logic
pnpm start -- preferred-network
```

## Advanced Features

### 1. **Builder Pattern** (`builder-pattern.ts`)
Chain `.register()` calls to map network patterns to different signers. More specific patterns (e.g., `algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=`) take precedence over wildcards (e.g., `algorand:*`).

### 2. **Lifecycle Hooks** (`hooks.ts`)
Subscribe to payment events with hooks like:
- `onBeforePaymentCreation()` — Before creating a payment
- `onAfterPaymentCreation()` — After successful payment
- `onPaymentCreationFailure()` — On error

Perfect for logging, analytics, or custom business logic.

### 3. **Preferred Network Selection** (`preferred-network.ts`)
Implement custom logic to select which payment option the client prefers from the server's offerings. Useful for prioritizing cheaper networks, specific chains, or fallback strategies.

These patterns can be combined to build sophisticated payment infrastructure for complex applications.
