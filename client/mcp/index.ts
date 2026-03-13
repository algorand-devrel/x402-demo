/**
 * MCP Server with x402 Payment Integration
 *
 * This example demonstrates how to create an MCP server that can make
 * paid API requests using the x402 protocol with EVM, SVM, and AVM support.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { config } from "dotenv";
import { x402Client, wrapAxiosWithPayment } from "@x402-avm/axios";
import { toClientAvmSigner } from "@x402-avm/avm";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/client";
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
 * Creates an axios client configured with x402 payment support for EVM, SVM, and AVM.
 *
 * @returns A wrapped axios instance that handles 402 payment flows automatically.
 */
async function createClient() {
    const client = new x402Client();

    const secretKey = await getSecretKeyFromMnemonic(avmMnemonic);
    const avmSigner = toClientAvmSigner(secretKey);
    registerExactAvmScheme(client, { signer: avmSigner });

    return wrapAxiosWithPayment(axios.create({ baseURL }), client);
}

/**
 * Initializes and starts the MCP server with x402 payment-enabled tools.
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
