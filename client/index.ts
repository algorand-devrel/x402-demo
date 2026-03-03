import { config } from "dotenv";
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from "@x402-avm/fetch";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/client";
import algosdk from "algosdk";

config();

const avmPrivateKey = process.env.AVM_PRIVATE_KEY as string;
const baseURL = process.env.RESOURCE_SERVER_URL || "http://localhost:4021";
const endpointPath = process.env.ENDPOINT_PATH || "/weather";
const url = `${baseURL}${endpointPath}`;

async function main(): Promise<void> {
    const secretKey = Buffer.from(avmPrivateKey, "base64");
    if (secretKey.length !== 64) {
        throw new Error("AVM_PRIVATE_KEY must be a Base64-encoded 64-byte key");
    }
    const address = algosdk.encodeAddress(secretKey.slice(32));
    const avmSigner = {
        address,
        signTransactions: async (txns: Uint8Array[], indexesToSign?: number[]) => {
            return txns.map((txn, i) => {
                if (indexesToSign && !indexesToSign.includes(i)) return null;
                const decoded = algosdk.decodeUnsignedTransaction(txn);
                const signed = algosdk.signTransaction(decoded, secretKey);
                return signed.blob;
            });
        },
    };

    const client = new x402Client();
    registerExactAvmScheme(client, { signer: avmSigner });
    console.info(`AVM signer: ${address}`);

    const fetchWithPayment = wrapFetchWithPayment(fetch, client);

    console.log(`Making request to: ${url}\n`);
    const response = await fetchWithPayment(url, { method: "GET" });
    const body = await response.json();
    console.log("Response body:", body);

    if (response.ok) {
        const paymentResponse = new x402HTTPClient(client).getPaymentSettleResponse(name =>
            response.headers.get(name),
        );
        console.log("\nPayment response:", JSON.stringify(paymentResponse, null, 2));
    } else {
        console.log(`\nNo payment settled (response status: ${response.status})`);
    }
}

main().catch(error => {
    console.error(error?.response?.data?.error ?? error);
    process.exit(1);
});