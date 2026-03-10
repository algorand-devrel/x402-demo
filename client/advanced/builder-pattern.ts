import { x402Client, wrapFetchWithPayment, x402HTTPClient } from "@x402-avm/fetch";
import { ExactAvmScheme } from "@x402-avm/avm/exact/client";
import algosdk from "algosdk";

/**
 * Builder Pattern Example
 *
 * This demonstrates how to configure the x402Client using the builder pattern,
 * chaining .register() calls to map network patterns to mechanism schemes.
 *
 * Use this approach when you need:
 * - Different signers for different networks (e.g., separate keys for mainnet vs testnet)
 * - Fine-grained control over which networks are supported
 * - Custom scheme configurations per network
 *
 * @param evmPrivateKey - The EVM private key for signing
 * @param svmPrivateKey - The SVM private key for signing
 * @param url - The URL to make the request to
 */
export async function runBuilderPatternExample(
    avmMnemonic: string,
    url: string,
): Promise<void> {
    console.log("🔧 Creating client with builder pattern...\n");


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
    const algorandTestnetSigner = avmSigner; // Could be a different signer for testnet

    // Builder pattern allows fine-grained control over network registration
    // More specific patterns (e.g., "eip155:1") take precedence over wildcards (e.g., "eip155:*")
    const client = new x402Client()
        .register("algorand:*", new ExactAvmScheme(avmSigner)) // All Algorand networks
        .register("algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=", new ExactAvmScheme(algorandTestnetSigner)); // Testnet override

    const fetchWithPayment = wrapFetchWithPayment(fetch, client);

    console.log(`🌐 Making request to: ${url}\n`);
    const response = await fetchWithPayment(url, { method: "GET" });
    const body = await response.json();

    console.log("✅ Request completed\n");
    console.log("Response body:", body);

    if (response.ok) {
        const paymentResponse = new x402HTTPClient(client).getPaymentSettleResponse(name =>
            response.headers.get(name),
        );
        if (paymentResponse) {
            console.log("\n💰 Payment Details:", paymentResponse);
        }
    }
}
