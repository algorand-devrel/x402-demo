import { config } from "dotenv";
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from "@x402-avm/fetch";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/client";
import algosdk from "algosdk";

config();

const avmMnemonic = process.env.AVM_MNEMONIC as string;
const baseURL = process.env.RESOURCE_SERVER_URL || "http://localhost:4021";
const endpointPath = process.env.ENDPOINT_PATH || "/weather";
const url = `${baseURL}${endpointPath}`;

async function main(): Promise<void> {
    const { addr, sk } = algosdk.mnemonicToSecretKey(avmMnemonic);
    const avmSigner = {
        address: addr.toString(),
        signTransactions: async (txns: Uint8Array[], indexesToSign?: number[]) => {
            return txns.map((txn, i) => {
                if (indexesToSign && !indexesToSign.includes(i)) return null;
                const decoded = algosdk.decodeUnsignedTransaction(txn);
                const signed = algosdk.signTransaction(decoded, sk);
                return signed.blob;
            });
        },
    };

    const client = new x402Client();
    registerExactAvmScheme(client, { signer: avmSigner });
    console.info(`AVM signer: ${addr}`);

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