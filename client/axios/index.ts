import { config } from "dotenv";
import { x402Client, wrapAxiosWithPayment, x402HTTPClient } from "@x402-avm/axios";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/client";
import algosdk from "algosdk";
import axios from "axios";

config();

const avmMnemonic = process.env.AVM_MNEMONIC as string;
const baseURL = process.env.RESOURCE_SERVER_URL || "http://localhost:4021";
const endpointPath = process.env.ENDPOINT_PATH || "/weather";
const url = `${baseURL}${endpointPath}`;

async function main(): Promise<void> {
    const { addr, sk } = algosdk.mnemonicToSecretKey(avmMnemonic);
    const address = addr.toString();
    const avmSigner = {
        address,
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
    console.info(`AVM signer: ${address}`);

    const api = wrapAxiosWithPayment(axios.create(), client);

    console.log(`Making request to: ${url}\n`);
    const response = await api.get(url);
    const body = response.data;
    console.log("Response body:", body);

    if (response.status < 400) {
        const paymentResponse = new x402HTTPClient(client).getPaymentSettleResponse(
            name => response.headers[name.toLowerCase()],
        );
        console.log("\nPayment response:", paymentResponse);
    } else {
        console.log(`\nNo payment settled (response status: ${response.status})`);
    }
}

main().catch(error => {
    console.error(error?.response?.data?.error ?? error);
    process.exit(1);
});
