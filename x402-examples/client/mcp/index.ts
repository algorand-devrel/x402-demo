/**
 * x402 MCP Server - Model Context Protocol integration with x402 payments.
 * Allows AI agents to autonomously call paid APIs and manage their own payment flows.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { config } from "dotenv";
import { x402Client, wrapAxiosWithPayment } from "@x402/axios";
import { toClientAvmSigner } from "@x402/avm";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import { seedFromMnemonic } from "@algorandfoundation/algokit-utils/algo25";
import { ed25519SigningKeyFromWrappedSecret, type WrappedEd25519Seed } from "@algorandfoundation/algokit-utils/crypto";

config();

const avmMnemonic = process.env.AVM_MNEMONIC as string;
const baseURL = process.env.RESOURCE_SERVER_URL || "http://localhost:4021";
const endpointPath = process.env.ENDPOINT_PATH || "/weather";

if (!avmMnemonic) {
    throw new Error("AVM_MNEMONIC must be provided");
}

/**
 * Create axios client with x402 payment support.
 */
async function createClient() {
    const client = new x402Client();

    const secretKey = await getSecretKeyFromMnemonic(avmMnemonic);
    const avmSigner = toClientAvmSigner(secretKey);
    client.register("algorand:*", new ExactAvmScheme(avmSigner));

    return wrapAxiosWithPayment(axios.create({ baseURL }), client);
}

/**
 * Initialize and run the MCP server with payment-enabled tools.
 */
async function main() {
    const api = await createClient();

    // Create an MCP server
    const server = new McpServer({
        name: "x402 MCP Client Demo",
        version: "2.0.0",
    });

    // Add a tool to get data from the resource server
    server.tool(
        "get-data-from-resource-server",
        "Get data from the resource server",
        {},
        async () => {
            const res = await api.get(endpointPath);
            return {
                content: [{ type: "text", text: JSON.stringify(res.data) }],
            };
        },
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

async function getSecretKeyFromMnemonic(mnemonic: string): Promise<string> {
    const seed = seedFromMnemonic(mnemonic);
    const seedCopy = new Uint8Array(seed);
    const wrappedSeed: WrappedEd25519Seed = {
        unwrapEd25519Seed: async () => seed,
        wrapEd25519Seed: async () => { },
    }
    const wrappedSecret = await ed25519SigningKeyFromWrappedSecret(wrappedSeed)
    return Buffer.concat([
        Buffer.from(seedCopy),
        Buffer.from(wrappedSecret.ed25519Pubkey),
    ]).toString('base64');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
