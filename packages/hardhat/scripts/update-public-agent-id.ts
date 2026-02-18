import { ethers } from "hardhat";

async function main() {
    // The deployed EarnBase V2 Proxy
    const EARNBASE_PROXY = "0xaA558aC98127c78f2125c8DE83eA87e4ac843AFb";
    const NEW_PUBLIC_AGENT_ID = 130;

    const [deployer] = await ethers.getSigners();
    console.log("Updating EarnBase V2 with account:", deployer.address);
    console.log("Proxy Address:", EARNBASE_PROXY);
    console.log("New Public Agent ID:", NEW_PUBLIC_AGENT_ID);

    // Connect to the deployed contract
    const EarnBase = await ethers.getContractAt("EarnBaseV2", EARNBASE_PROXY);

    // Check current owner
    const owner = await EarnBase.owner();
    console.log("Contract owner:", owner);

    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.error("❌ Error: You are not the owner of this contract");
        console.error(`   Owner: ${owner}`);
        console.error(`   Your address: ${deployer.address}`);
        return;
    }

    // Get current public agent ID
    const currentAgentId = await EarnBase.publicAgentId();
    console.log("Current Public Agent ID:", currentAgentId.toString());

    if (currentAgentId.toString() === NEW_PUBLIC_AGENT_ID.toString()) {
        console.log("✅ Agent ID is already set to", NEW_PUBLIC_AGENT_ID);
        return;
    }

    // Update the public agent ID
    console.log("\nUpdating public agent ID...");
    const tx = await EarnBase.setPublicAgentId(NEW_PUBLIC_AGENT_ID);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log("✅ Public Agent ID updated successfully!");

    // Verify the update
    const updatedAgentId = await EarnBase.publicAgentId();
    console.log("Updated Public Agent ID:", updatedAgentId.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
