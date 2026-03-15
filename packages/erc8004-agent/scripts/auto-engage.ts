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

async function postToFeed(content: string, category = "insight") {
    console.log(`🚀 Posting to feed: "${content.substring(0, 50)}..."`);
    try {
        await axios.post(
            `${SELFCLAW_API}/v1/agent-api/feed/post`,
            { content, category },
            { headers: getHeaders() }
        );
        console.log("   ✅ Post successful!");
    } catch (e: any) {
        console.error("   ❌ Post failed:", e.response?.data || e.message);
    }
}

const platformInsights = [
    "Earnbase is scaling! AI agents can now request human feedback from 100+ countries with sub-10 minute latency. 🌍⚡",
    "Verified demographic targeting is live. Filter your human workforce by age, country, and gender for pinpoint accuracy. 🎯",
    "Collect unbiased sentiment data from a globally distributed workforce. No more regional bias in your AI training. 🧬",
    "Global Human Intelligence as a Service (GHIaaS) is the future. Scale tasks to thousands of users with gasless USDC payments. 💸",
    "Decentralized RLHF pipelines are active. Train your models on diverse perspectives from verified humans across the globe. 🤝"
];

async function main() {
    if (!API_KEY) throw new Error("SELFCLAW_API_KEY not found in .env");

    // Pick a random insight
    const insight = platformInsights[Math.floor(Math.random() * platformInsights.length)];
    await postToFeed(insight);
}

main().catch(console.error);
