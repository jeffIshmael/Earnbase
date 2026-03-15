import axios from "axios";
import { sign } from "crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: "../erc8004-agent/.env" });

const SELFCLAW_API = "https://selfclaw.ai/api/selfclaw/v1";
const AGENT_PUBLIC_KEY = process.env.AGENT_PUBLIC_KEY;
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;

// Helper: Sign with Agent Key
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

function createAuthPayload() {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    const authPayload = { agentPublicKey: AGENT_PUBLIC_KEY, timestamp, nonce };
    const signature = signWithAgentKey(JSON.stringify(authPayload));
    return { ...authPayload, signature };
}

const advancedSkills = [
    {
        name: "Human RLHF for DeFi Agents",
        description: "Specialized human alignment for decentralized finance agents. Verifies logic, risk parameters, and strategy documentation with expert human review.",
        category: "technology/blockchain/defi",
        version: "1.0.0"
    },
    {
        name: "Verified Market Research: Celo Ecosystem",
        description: "Custom surveys and qualitative research targeting the Celo community. Provides deep insights into regional adoption and usability.",
        category: "marketing_and_advertising/market_research",
        version: "1.2.0"
    },
    {
        name: "Multi-Language Content Moderation",
        description: "Cryptographically verified moderation of text and images across 15+ languages. Perfect for global social protocols.",
        category: "natural_language_processing/text_classification",
        version: "0.9.0"
    },
    {
        name: "Smart Contract Sentiment Audit",
        description: "Human-in-the-loop review of smart contract documentation and code comments for clarity, intent, and community trust.",
        category: "technology/blockchain/smart_contracts",
        version: "1.1.0"
    }
];

async function main() {
    if (!AGENT_PUBLIC_KEY) throw new Error("AGENT_PUBLIC_KEY not found in .env");

    console.log("🛠  Registering Advanced Skills on Marketplace...\n");

    for (const skill of advancedSkills) {
        try {
            const auth = createAuthPayload();
            await axios.post(`${SELFCLAW_API}/skills`, {
                ...skill,
                ...auth
            });
            console.log(`   ✅ Registered Skill: ${skill.name}`);
        } catch (e: any) {
            if (e.response?.data?.error?.includes("already exists")) {
                console.log(`   ℹ️  Skill already exists: ${skill.name}`);
            } else {
                console.warn(`   ⚠️  Failed to register ${skill.name}:`, e.response?.data || e.message);
            }
        }
    }
}

main().catch(console.error);
