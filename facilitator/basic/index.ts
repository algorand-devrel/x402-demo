import { x402Facilitator } from "@x402-avm/core/facilitator";
import {
    type PaymentPayload,
    type PaymentRequirements,
    type SettleResponse,
    type VerifyResponse,
} from "@x402-avm/core/types";
import { toFacilitatorAvmSigner } from "@x402-avm/avm";
import { ExactAvmScheme } from "@x402-avm/avm/exact/facilitator";
import { config } from "dotenv";
import express from "express";
import { seedFromMnemonic } from "@algorandfoundation/algokit-utils/algo25";
import { ed25519SigningKeyFromWrappedSecret, type WrappedEd25519Seed } from "@algorandfoundation/algokit-utils/crypto";

config();

// Configuration
const PORT = process.env.PORT || "4022";

// Validate required environment variables
if (!process.env.AVM_MNEMONIC) {
    console.error("❌ AVM_MNEMONIC environment variable is required");
    process.exit(1);
}

// Initialize the AVM signer from private key
const secretKey = await getSecretKeyFromMnemonic(process.env.AVM_MNEMONIC as string);
const avmSigner = toFacilitatorAvmSigner(secretKey);
console.info(`AVM Facilitator account: ${avmSigner.getAddresses()[0]}`);

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

// Register EVM, SVM, and AVM schemes
facilitator.register("algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=", new ExactAvmScheme(avmSigner)); // Algorand Testnet

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
    console.log(`🚀 Facilitator listening on http://localhost:${PORT}`);
    console.log();
});


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