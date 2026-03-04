import { config } from "dotenv";
import { paymentMiddleware, x402ResourceServer } from "@x402-avm/hono";
import { ExactAvmScheme } from "@x402-avm/avm/exact/server";
import { HTTPFacilitatorClient } from "@x402-avm/core/server";
import { declareDiscoveryExtension } from "@x402-avm/extensions/bazaar";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
config();

const avmAddress = process.env.AVM_ADDRESS;
if (!avmAddress) {
    console.error("Missing required environment variables");
    process.exit(1);
}

const facilitatorUrl = process.env.FACILITATOR_URL;
if (!facilitatorUrl) {
    console.error("❌ FACILITATOR_URL environment variable is required");
    process.exit(1);
}
const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

const accepts = [
    {
        scheme: "exact",
        price: "$0.001",
        network: "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=" as const,
        payTo: avmAddress,
    },
];

const server = new x402ResourceServer(facilitatorClient)
    .register("algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=", new ExactAvmScheme());

const app = new Hono();

app.use(
    paymentMiddleware(
        {
            "GET /weather": {
                accepts,
                description: "Weather data",
                mimeType: "application/json",
                extensions: {
                    ...declareDiscoveryExtension({
                        input: { city: "San Francisco" },
                        inputSchema: {
                            properties: { city: { type: "string", description: "City name" } },
                            required: ["city"],
                        },
                        output: {
                            example: { report: { weather: "sunny", temperature: 70 } },
                        },
                    }),
                },
            },
        },
        server,
    ),
);

app.get("/weather", c => {
    return c.json({
        report: {
            weather: "sunny",
            temperature: 70,
        },
    });
});

serve({
    fetch: app.fetch,
    port: 4021,
});

console.log(`Server listening at http://localhost:4021`);