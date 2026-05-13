# x402 MCP Client

**Library:** @x402/axios  
**Complexity:** Medium

## Overview

**What it is:** Implements the **Model Context Protocol (MCP)**, allowing AI agents (like Claude or other LLMs) to independently discover, pay for, and consume data API resources using Algorand tokens—without human intervention.

**When to use:** This is the future of agentic workflows. Use this if you want:
- AI agents to autonomously call paid APIs
- LLMs to manage their own API budgets
- Transparent, verifiable AI spending on blockchain
- Cost-efficient agent-driven applications
- Integration with AI tools and Claude Desktop

This unlocks new possibilities where AI systems can directly participate in the web's economy.

**Modern Tooling:** This example uses @x402 v2.11.0 and tsx for high-performance TypeScript execution without build steps.

## Quick Start

### 1. Installation & Configuration

```bash
npm install
```

Create a `.env` file in this directory with:

```env
AVM_MNEMONIC=your_algorand_mnemonic_here
RESOURCE_SERVER_URL=http://localhost:4021
ENDPOINT_PATH=/weather
```

### 2. Start the Resource Server

In a separate terminal:

```bash
cd ../server/hono
npm install
npm start
```

The server is now listening on `http://localhost:4021/weather`

### 3. Configure Claude Desktop

Claude Desktop needs to know where this MCP server is. It looks for config at `~/.claude/claude.json` (a file in your home directory).

**Steps:**

1. **Copy the template** — Open `claude-template.json` in this folder
2. **Create/Edit** — Open (or create) a file called `claude.json` in your home directory at `~/.claude/claude.json`
3. **Paste & Replace** — Copy the template content into that file, then replace this path:
   ```
   /REPLACE_WITH_FULL_PATH_TO_x402-examples/client/mcp
   ```
   with the actual full path to this mcp directory.

### 4. Restart Claude Desktop

Quit and reopen Claude Desktop to load the new MCP configuration.

### 5. Ask Claude to Call the Tool

In Claude, type something like:

```
Please use the "get-data-from-resource-server" tool to fetch weather data for me.
```

Claude will:
- Call the MCP tool you registered
- Trigger an HTTP request to the protected endpoint
- Automatically pay the 402 requirement
- Return the data to you

**That's it!** The payment happens transparently in the background.

## How It Works

The MCP server exposes tools that Claude or other MCP clients can call:

1. **Tool Registration** — Registers MCP tools (e.g., `get-data-from-resource-server`)
2. **Autonomous Requests** — When Claude calls the tool, it triggers an HTTP request to the resource server
3. **Automatic Payment** — If the server returns 402 Payment Required, payment is created and settled transparently on Algorand
4. **Response to Claude** — The AI receives the data and can reason about it

From Claude's perspective, it's just calling a tool. The payment infrastructure is invisible.