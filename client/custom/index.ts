import { config } from "dotenv";
import { x402Client } from "@x402-avm/core/client";
import {
    decodePaymentRequiredHeader,
    decodePaymentResponseHeader,
    encodePaymentSignatureHeader,
} from "@x402-avm/core/http";
import { ExactAvmScheme } from "@x402-avm/avm/exact/client";
import algosdk from "algosdk";
import type { PaymentRequirements } from "@x402-avm/core/types";

config();

const avmMnemonic = process.env.AVM_MNEMONIC as string;
const baseURL = process.env.SERVER_URL || "http://localhost:4021";
const url = `${baseURL}/weather`;

async function makeRequestWithPayment(client: x402Client, url: string): Promise<void> {
    console.log(`\n🌐 Making initial request to: ${url}\n`);

    // Step 1: Make initial request
    let response = await fetch(url);
    console.log(`📥 Initial response status: ${response.status}\n`);

    // Step 2: Handle 402 Payment Required
    if (response.status === 402) {
        console.log("💳 Payment required! Processing...\n");

        // Decode payment requirements from PAYMENT-REQUIRED header
        const paymentRequiredHeader = response.headers.get("PAYMENT-REQUIRED");
        if (!paymentRequiredHeader) {
            throw new Error("Missing PAYMENT-REQUIRED header");
        }
        const paymentRequired = decodePaymentRequiredHeader(paymentRequiredHeader);

        const requirements: PaymentRequirements[] = Array.isArray(paymentRequired.accepts)
            ? paymentRequired.accepts
            : [paymentRequired.accepts];

        console.log("📋 Payment requirements:");
        requirements.forEach((req, i) => {
            console.log(`   ${i + 1}. ${req.network} / ${req.scheme} - ${req.amount}`);
        });

        // Step 3: Create and encode payment
        console.log("\n🔐 Creating payment...\n");
        const paymentPayload = await client.createPaymentPayload(paymentRequired);
        const paymentHeader = encodePaymentSignatureHeader(paymentPayload);

        // Step 4: Retry with PAYMENT-SIGNATURE header
        console.log("🔄 Retrying with payment...\n");
        response = await fetch(url, {
            headers: { "PAYMENT-SIGNATURE": paymentHeader },
        });
        console.log(`📥 Response status: ${response.status}\n`);
    }

    // Step 5: Handle success
    if (response.status === 200) {
        console.log("✅ Success!\n");
        console.log("Response:", await response.json());

        // Decode settlement from PAYMENT-RESPONSE header
        const settlementHeader = response.headers.get("PAYMENT-RESPONSE");
        if (settlementHeader) {
            const settlement = decodePaymentResponseHeader(settlementHeader);
            console.log("\n💰 Settlement:");
            console.log(`   Transaction: ${settlement.transaction}`);
            console.log(`   Network: ${settlement.network}`);
            console.log(`   Payer: ${settlement.payer}`);
        }
    } else {
        throw new Error(`Unexpected status: ${response.status}`);
    }
}

async function main(): Promise<void> {
    console.log("\n🔧 Custom x402 Client (v2 Protocol)\n");
    if (!avmMnemonic) {
        console.error("❌ AVM_MNEMONIC environment variable is required");
        process.exit(1);
    }
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
    console.info(`AVM signer: ${address}`);

    const selectPayment = (_version: number, requirements: PaymentRequirements[]) => {
        const selected = requirements[0];
        console.log(`🎯 Selected: ${selected.network} / ${selected.scheme}`);
        return selected;
    };

    const client = new x402Client(selectPayment)
        .register("algorand:*", new ExactAvmScheme(avmSigner));

    console.log("✅ Client ready\n");

    await makeRequestWithPayment(client, url);
    console.log("\n🎉 Done!");
}

main().catch(error => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
});
