import axios from "axios";
import { sign } from "crypto";
import * as dotenv from "dotenv";

dotenv.config();

const SELFCLAW_API = "https://selfclaw.ai/api/selfclaw/v1";
const AGENT_PUBLIC_KEY = process.env.AGENT_PUBLIC_KEY;
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;

// Helper: Sign with Agent Key (Ed25519)
function signWithAgentKey(data: string): string {
    if (!AGENT_PRIVATE_KEY) throw new Error("AGENT_PRIVATE_KEY not found in .env");

    const privateKeyDer = Buffer.from(AGENT_PRIVATE_KEY, "base64");
    const privateKey = require("crypto").createPrivateKey({
        key: privateKeyDer,
        format: "der",
        type: "pkcs8"
    });

    const signature = sign(null, Buffer.from(data), privateKey);
    return signature.toString("base64");
}

// Helper: Create Auth Payload
function createAuthPayload() {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    const authPayload = {
        agentPublicKey: AGENT_PUBLIC_KEY,
        timestamp,
        nonce
    };
    const signature = signWithAgentKey(JSON.stringify(authPayload));

    return {
        ...authPayload,
        signature
    };
}

async function main() {
    if (!AGENT_PUBLIC_KEY) throw new Error("AGENT_PUBLIC_KEY not found in .env");

    console.log("🔧 Updating Agent 130 Profile...\n");

    // 1. Register Services
    console.log("1️⃣  Registering Services...");

    const services = [
        {
            name: "MCP",
            endpoint: "https://earnbase.vercel.app/.well-known/mcp.json",
            version: "2025-06-18",
            description: "Model Context Protocol endpoint for AI agent integration"
        },
        {
            name: "A2A",
            endpoint: "https://earnbase.vercel.app/.well-known/agent-card.json",
            version: "0.3.0",
            description: "Agent-to-Agent communication endpoint"
        }
    ];

    for (const service of services) {
        try {
            const auth = createAuthPayload();
            const response = await axios.post(
                `${SELFCLAW_API}/services`,
                {
                    ...service,
                    ...auth
                }
            );
            console.log(`   ✅ Registered ${service.name} service`);
        } catch (e: any) {
            if (e.response?.data?.error?.includes("already exists")) {
                console.log(`   ℹ️  ${service.name} service already registered`);
            } else {
                console.warn(`   ⚠️  Failed to register ${service.name}:`, e.response?.data || e.message);
            }
        }
    }

    // 2. Update Agent Profile/Metadata
    console.log("\n2️⃣  Updating Agent Metadata...");
    try {
        const auth = createAuthPayload();

        // Try to update agent name and description
        const updateResponse = await axios.put(
            `${SELFCLAW_API}/agent`,
            {
                agentName: "Earnbase Human Feedback Agent",
                description: "Autonomous ERC-8004 agent providing Human Feedback as a Service (HFaaS). Enables AI agents to request structured human feedback using gasless USDC payments, without managing human infrastructure, payouts, or moderation.",
                agentUri: "https://earnbase.vercel.app/.well-known/agent-card.json",
                ...auth
            }
        );
        console.log("   ✅ Agent metadata updated");
    } catch (e: any) {
        console.warn("   ⚠️  Metadata update failed (may require dashboard):", e.response?.data || e.message);
        console.log("   💡 You may need to update the agent name via the Selfclaw dashboard");
    }

    // 3. Log Revenue (to boost reputation score)
    console.log("\n3️⃣  Optional: Log Initial Revenue...");
    console.log("   ℹ️  Skipping - you can log revenue as you earn it via the API");

    // 4. Summary
    console.log("\n✅ Agent 130 Update Complete!");
    console.log("\n📋 Next Steps:");
    console.log("1. Visit https://selfclaw.ai/dashboard to verify the updates");
    console.log("2. Link your token (0x6F614202fA8557225DBbAC16FB30fb252feC7B89) via the dashboard");
    console.log("3. Request liquidity sponsorship");
    console.log("\n🔗 Agent Profile: https://selfclaw.ai/agent/" + AGENT_PUBLIC_KEY);
    console.log("🔗 8004scan: https://www.8004scan.io/agents/celo/130");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
