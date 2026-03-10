import { x402Client } from "@x402-avm/fetch";
import { ExactAvmScheme } from "@x402-avm/avm/exact/client";
import algosdk from "algosdk";

export async function runHooksExample(
    avmMnemonic: string,
    url: string,
): Promise<void> {
    console.log("🔧 Creating client with payment lifecycle hooks...\n");

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

    const client = new x402Client()
        .register("algorand:*", new ExactAvmScheme(avmSigner))
        .onBeforePaymentCreation(async context => {
            console.log("🔍 [BeforePaymentCreation] Creating payment for:");
            console.log(`   Network: ${context.selectedRequirements.network}`);
            console.log(`   Scheme: ${context.selectedRequirements.scheme}`);
            console.log();
        })
        .onAfterPaymentCreation(async context => {
            console.log("✅ [AfterPaymentCreation] Payment created successfully");
            console.log(`   Version: ${context.paymentPayload.x402Version}`);
            console.log();
        })
        .onPaymentCreationFailure(async context => {
            console.log(`❌ [OnPaymentCreationFailure] Payment creation failed: ${context.error}`);
            console.log();
        });

    const { wrapFetchWithPayment } = await import("@x402-avm/fetch");
    const fetchWithPayment = wrapFetchWithPayment(fetch, client);

    console.log(`🌐 Making request to: ${url}\n`);
    const response = await fetchWithPayment(url, { method: "GET" });
    const body = await response.json();

    console.log("✅ Request completed successfully with hooks\n");
    console.log("Response body:", body);

    // Extract payment response from headers
    const { x402HTTPClient } = await import("@x402-avm/fetch");
    const paymentResponse = new x402HTTPClient(client).getPaymentSettleResponse(name =>
        response.headers.get(name),
    );
    if (paymentResponse) {
        console.log("\n💰 Payment Details:", paymentResponse);
    }
}
