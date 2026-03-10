import { x402Client, type PaymentRequirements } from "@x402-avm/fetch";
import { ExactAvmScheme } from "@x402-avm/avm/exact/client";
import algosdk from "algosdk";
import { x402HTTPClient, wrapFetchWithPayment } from "@x402-avm/fetch";

export async function runPreferredNetworkExample(
    avmMnemonic: string,
    url: string,
): Promise<void> {
    console.log("🎯 Creating client with preferred network selection...\n");


    // Define network preference order (most preferred first)
    const networkPreferences = ["algorand:"];

    /**
     * Custom selector that picks payment options based on preference order.
     *
     * NOTE: By the time this selector is called, `options` has already been
     * filtered to only include options that BOTH the server offers AND the
     * client has registered support for. So fallback to options[0] means
     * "first mutually-supported option" (which preserves server's preference order).
     *
     * @param _x402Version - The x402 protocol version
     * @param options - Array of mutually supported payment options
     * @returns The selected payment requirement based on network preference
     */
    const preferredNetworkSelector = (
        _x402Version: number,
        options: PaymentRequirements[],
    ): PaymentRequirements => {
        console.log("📋 Mutually supported payment options (server offers + client supports):");
        options.forEach((opt, i) => {
            console.log(`   ${i + 1}. ${opt.network} (${opt.scheme})`);
        });
        console.log();

        // Try each preference in order
        for (const preference of networkPreferences) {
            const match = options.find(opt => opt.network.startsWith(preference));
            if (match) {
                console.log(`✨ Selected preferred network: ${match.network}`);
                return match;
            }
        }

        // Fallback to first mutually-supported option (server's top preference among what we support)
        console.log(`⚠️  No preferred network available, falling back to: ${options[0]?.network}`);
        return options[0];
    };

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

    const client = new x402Client(preferredNetworkSelector)
        .register("algorand:*", new ExactAvmScheme(avmSigner));

    const fetchWithPayment = wrapFetchWithPayment(fetch, client);

    console.log(`🌐 Making request to: ${url}\n`);
    const response = await fetchWithPayment(url, { method: "GET" });
    const body = await response.json();

    console.log("✅ Request completed successfully\n");
    console.log("Response body:", body);

    // Extract payment response from headers
    const paymentResponse = new x402HTTPClient(client).getPaymentSettleResponse(name =>
        response.headers.get(name),
    );
    if (paymentResponse) {
        console.log("\n💰 Payment Details:", paymentResponse);
    }
}
