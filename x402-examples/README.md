# x402 Examples

Reference implementations of x402 clients, servers, and facilitators. Explore different patterns for integrating x402 into your applications.

## Client Examples

Five client implementations showing different approaches to the x402 payment protocol:

### **fetch/** — Native Fetch API
- **Complexity:** Low
- **Use when:** Building modern JavaScript/TypeScript apps with the native fetch API
- **Key feature:** Transparent 402 handling with async/await

### **axios/** — Axios Interceptor
- **Complexity:** Low
- **Use when:** You already have Axios in your codebase and want to add payment without refactoring
- **Key feature:** Global interceptor injecting payment logic automatically

### **custom/** — Raw Protocol Implementation
- **Complexity:** High
- **Use when:** You need deep understanding of x402 or building custom wallet/hardware integration
- **Key feature:** Step-by-step manual payment flow with full control

### **advanced/** — Enterprise Features
- **Complexity:** High
- **Use when:** You need multi-network support, lifecycle hooks, or payment preferences
- **Key feature:** Builder pattern, network preference selection, lifecycle observers

### **mcp/** — Model Context Protocol
- **Complexity:** Medium
- **Use when:** You want AI agents to autonomously pay for and consume APIs
- **Key feature:** Enables Claude and other LLMs to discover, pay for, and call protected endpoints

## Server & Facilitator

### **server/hono/** — Resource Server
The policy enforcer. Protects your API endpoints with x402 payment requirements. Issues 402 responses with pricing and merchant information. All actual payment verification is delegated to the Facilitator.

### **facilitator/basic/** — Settlement Service
The truth machine. Verifies payment signatures, submits transactions to Algorand, and confirms on-chain settlement. Stateless and trustless—never holds keys or funds.

## Testing Clients

**Requirements:**
- Algorand TestNet account with ALGO and USDC
- Environment variables configured (see each client's README)

**Basic Setup:**

1. **Start the server** (in one terminal):
   ```bash
   cd server/hono
   pnpm install
   pnpm start
   ```

2. **Run your client** (in another terminal):
   ```bash
   cd client/fetch  # or axios, custom, advanced, mcp
   pnpm install
   pnpm start
   ```

3. **Optional: Run the Facilitator** (in a third terminal):
   ```bash
   cd facilitator/basic
   pnpm install
   pnpm start
   ```

**Important:** Make sure your client and server are pointing to the correct endpoints in their `.env` files, or hardcoded in.