import { ethers } from "hardhat";

async function main() {
    const CONTRACT_ADDRESS = "0x086B03d4cDA9e0f1Ae1B4D62a8A5740dc85B0797"; // EarnbaseAgent Proxy

    const [deployer] = await ethers.getSigners();
    console.log("Registering agent with account:", deployer.address);

    const EarnbaseAgent = await ethers.getContractAt("EarnbaseAgent", CONTRACT_ADDRESS);

    // Call register(string) with empty URI
    console.log("Sending register transaction...");
    const tx = await EarnbaseAgent["register(string)"]("");
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction failed");

    // Parse Registered event
    const event = receipt.logs.find((log: any) => {
        try {
            const parsed = EarnbaseAgent.interface.parseLog(log);
            return parsed?.name === "Registered";
        } catch (e) {
            return false;
        }
    });

    if (event) {
        const parsed = EarnbaseAgent.interface.parseLog(event);
        const agentId = parsed?.args[0];
        console.log("-----------------------------------------");
        console.log("✅ Agent Registered Successfully!");
        console.log("Agent ID:", agentId.toString());
        console.log("Owner:", parsed?.args[2]);
        console.log("-----------------------------------------");
        console.log(`NEXT STEP: Update 'agentId' in agent-registration.json to ${agentId}, host the file, and call setAgentURI.`);
    } else {
        console.error("Registered event not found in receipt.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
