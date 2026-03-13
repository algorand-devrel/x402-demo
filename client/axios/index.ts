import { config } from "dotenv";
import { x402Client, wrapAxiosWithPayment, x402HTTPClient } from "@x402-avm/axios";
import { toClientAvmSigner } from "@x402-avm/avm";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/client";
import axios from "axios";
import { seedFromMnemonic } from "@algorandfoundation/algokit-utils/algo25";
import { ed25519SigningKeyFromWrappedSecret, type WrappedEd25519Seed } from "@algorandfoundation/algokit-utils/crypto";

config();

const avmMnemonic = process.env.AVM_MNEMONIC as string;
const baseURL = process.env.RESOURCE_SERVER_URL || "http://localhost:4021";
const endpointPath = process.env.ENDPOINT_PATH || "/weather";
const url = `${baseURL}${endpointPath}`;

async function main(): Promise<void> {

    const secretKey = await getSecretKeyFromMnemonic(avmMnemonic);
    const avmSigner = toClientAvmSigner(secretKey);

    const client = new x402Client();
    registerExactAvmScheme(client, { signer: avmSigner });
    console.info(`AVM signer: ${avmSigner.address}`);

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
    console.error(error?.response?.data?.error ?? error);
    process.exit(1);
});
