import { x402Facilitator } from "@x402-avm/core/facilitator";
import type {
    PaymentPayload,
    PaymentRequirements,
    SettleResponse,
    VerifyResponse,
} from "@x402-avm/core/types";
import { DEFAULT_ALGOD_TESTNET } from "@x402-avm/avm";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/facilitator";
import algosdk from "algosdk";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const PORT = process.env.PORT || "4022";


const avmMnemonic = process.env.AVM_MNEMONIC as string;
const { addr, sk } = algosdk.mnemonicToSecretKey(avmMnemonic);
console.info(`AVM Facilitator account: ${addr}`);

const algodClient = new algosdk.Algodv2("", DEFAULT_ALGOD_TESTNET, "");

const avmSigner = {
    getAddresses: () => [addr.toString()] as readonly string[],

    signTransaction: async (txn: Uint8Array, _senderAddress: string) => {
        const decoded = algosdk.decodeUnsignedTransaction(txn);
        const signed = algosdk.signTransaction(decoded, sk);
        return signed.blob;
    },

    getAlgodClient: (_network: string) => algodClient,

    simulateTransactions: async (txns: Uint8Array[], _network: string) => {
        const request = new algosdk.modelsv2.SimulateRequest({
            txnGroups: [
                new algosdk.modelsv2.SimulateRequestTransactionGroup({
                    txns: txns.map(txn => algosdk.decodeSignedTransaction(txn)),
                }),
            ],
            allowUnnamedResources: true,
        });
        return await algodClient.simulateTransactions(request).do();
    },

    sendTransactions: async (signedTxns: Uint8Array[], _network: string) => {
        const response = await algodClient.sendRawTransaction(signedTxns).do();
        return response.txid;
    },

    waitForConfirmation: async (txId: string, _network: string, waitRounds: number = 4) => {
        return await algosdk.waitForConfirmation(algodClient, txId, waitRounds);
    },
};

const facilitator = new x402Facilitator()
    .onBeforeVerify(async (context) => {
        console.log("Before verify", context);
    })
    .onAfterVerify(async (context) => {
        console.log("After verify", context);
    })
    .onVerifyFailure(async (context) => {
        console.log("Verify failure", context);
    })
    .onBeforeSettle(async (context) => {
        console.log("Before settle", context);
    })
    .onAfterSettle(async (context) => {
        console.log("After settle", context);
    })
    .onSettleFailure(async (context) => {
        console.log("Settle failure", context);
    });

registerExactAvmScheme(facilitator, {
    signer: avmSigner,
    networks: "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=", // Algorand Testnet
});

// Initialize Express app
const app = express();
app.use(express.json());

/**
 * POST /verify
 * Verify a payment against requirements
 *
 * Note: Payment tracking and bazaar discovery are handled by lifecycle hooks
 */
app.post("/verify", async (req, res) => {
    try {
        const { paymentPayload, paymentRequirements } = req.body as {
            paymentPayload: PaymentPayload;
            paymentRequirements: PaymentRequirements;
        };

        if (!paymentPayload || !paymentRequirements) {
            return res.status(400).json({
                error: "Missing paymentPayload or paymentRequirements",
            });
        }

        // Hooks will automatically:
        // - Track verified payment (onAfterVerify)
        // - Extract and catalog discovery info (onAfterVerify)
        const response: VerifyResponse = await facilitator.verify(
            paymentPayload,
            paymentRequirements,
        );

        res.json(response);
    } catch (error) {
        console.error("Verify error:", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * POST /settle
 * Settle a payment on-chain
 *
 * Note: Verification validation and cleanup are handled by lifecycle hooks
 */
app.post("/settle", async (req, res) => {
    try {
        const { paymentPayload, paymentRequirements } = req.body;

        if (!paymentPayload || !paymentRequirements) {
            return res.status(400).json({
                error: "Missing paymentPayload or paymentRequirements",
            });
        }

        // Hooks will automatically:
        // - Validate payment was verified (onBeforeSettle - will abort if not)
        // - Check verification timeout (onBeforeSettle)
        // - Clean up tracking (onAfterSettle / onSettleFailure)
        const response: SettleResponse = await facilitator.settle(
            paymentPayload as PaymentPayload,
            paymentRequirements as PaymentRequirements,
        );

        res.json(response);
    } catch (error) {
        console.error("Settle error:", error);

        // Check if this was an abort from hook
        if (
            error instanceof Error &&
            error.message.includes("Settlement aborted:")
        ) {
            // Return a proper SettleResponse instead of 500 error
            return res.json({
                success: false,
                errorReason: error.message.replace("Settlement aborted: ", ""),
                network: req.body?.paymentPayload?.network || "unknown",
            } as SettleResponse);
        }

        res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * GET /supported
 * Get supported payment kinds and extensions
 */
app.get("/supported", async (req, res) => {
    try {
        const response = facilitator.getSupported();
        res.json(response);
    } catch (error) {
        console.error("Supported error:", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// Start the server
app.listen(parseInt(PORT), () => {
    console.log("Facilitator listening");
});
