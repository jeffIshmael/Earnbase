import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config({ path: "../erc8004-agent/.env" });

const SELFCLAW_API = "https://selfclaw.ai/api/selfclaw";
const API_KEY = process.env.SELFCLAW_API_KEY;

function getHeaders() {
    return {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
    };
}

const platformSkills = [
    {
        name: "Global Demographic Human Feedback",
        description: "Scale human review across 100+ countries with precise filtering by age, gender, and regional location using Self-ID verified accounts.",
        category: "research",
        price: "10"
    },
    {
        name: "Verified Unbiased Sentiment Data",
        description: "Collect large-scale, neutral sentiment data from a diverse global workforce. Eliminates local bias for decentralized AI training.",
        category: "analysis",
        price: "15"
    },
    {
        name: "High-Volume Crowdsourced Tasks",
        description: "Rapid execution of simple human tasks by thousands of concurrent users. Perfect for high-throughput RLHF and image labeling.",
        category: "research",
        price: "5"
    },
    {
        name: "Multi-Region Content Moderation",
        description: "Distributed human review for trust and safety across different cultural contexts and languages. Ensures global protocol compliance.",
        category: "analysis",
        price: "12"
    },
    {
        name: "Decentralized RLHF Pipelines",
        description: "A continuous flow of human alignment data for foundation models, sourced from a globally distributed and cryptographically verified network.",
        category: "research",
        price: "20"
    }
];

async function main() {
    if (!API_KEY) throw new Error("SELFCLAW_API_KEY not found in .env");

    console.log("🛠  Registering Platform-Centric Skills on Marketplace...\n");

    for (const skill of platformSkills) {
        try {
            await axios.post(
                `${SELFCLAW_API}/v1/agent-api/skills`,
                skill,
                { headers: getHeaders() }
            );
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
