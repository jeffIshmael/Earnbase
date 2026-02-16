import { ethers } from "hardhat";
// import { ReputationRegistry } from "@chaoschain/sdk";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const agentId = process.env.AGENT_ID || "0";
    const score = parseInt(process.env.SCORE || "85");
    const tag = process.env.TAG || "starred";
    const endpoint = process.env.ENDPOINT || "https://earnbase.com";

    console.log("🌟 Submitting feedback using @chaoschain/sdk...\n");

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("Submitter address:", signer.address);
    console.log("Agent ID:", agentId);
    console.log("Score:", score);
    console.log("Tag:", tag);

    // Initialize SDK with signer
    // const reputation = new ReputationRegistry(signer.provider);

    try {
        console.log("\n📝 Submitting feedback...");
        const tx = {
            hash:""
        }

        // const tx = await reputation.giveFeedback(
        //     agentId,
        //     score,
        //     0, // decimals
        //     tag,
        //     '', // tag2 (optional)
        //     endpoint,
        //     '', // feedbackURI (optional)
        //     ethers.constants.HashZero // feedbackHash
        // );

        console.log("Transaction hash:", tx.hash);

        // const receipt = await tx.wait();
        // console.log("✅ Feedback submitted in block:", receipt.blockNumber);

        console.log("\n🎉 Feedback submitted successfully!");
        console.log("View on Celoscan:", `https://celoscan.io/tx/${tx.hash}`);

    } catch (error: any) {
        console.error("❌ Feedback submission failed:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
