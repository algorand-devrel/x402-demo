import { config } from "dotenv";
import { runHooksExample } from "./hooks";
import { runPreferredNetworkExample } from "./preferred-network";
import { runBuilderPatternExample } from "./builder-pattern";

config();

const avmMnemonic = process.env.AVM_MNEMONIC as string;
const baseURL = process.env.RESOURCE_SERVER_URL || "http://localhost:4021";
const endpointPath = process.env.ENDPOINT_PATH || "/weather";
const url = `${baseURL}${endpointPath}`;

async function main(): Promise<void> {
    const pattern = process.argv[2] || "builder-pattern";

    console.log(`\n🚀 Running advanced example: ${pattern}\n`);

    if (!avmMnemonic) {
        console.error("❌ AVM_MNEMONIC environment variable is required");
        process.exit(1);
    }

    switch (pattern) {
        case "builder-pattern":
            await runBuilderPatternExample(avmMnemonic, url);
            break;

        case "hooks":
            await runHooksExample(avmMnemonic, url);
            break;

        case "preferred-network":
            await runPreferredNetworkExample(avmMnemonic, url);
            break;

        default:
            console.error(`Unknown pattern: ${pattern}`);
            console.error("Available patterns: builder-pattern, hooks, preferred-network");
            process.exit(1);
    }
}

main().catch(error => {
    console.error(error?.response?.data?.error ?? error);
    process.exit(1);
});
