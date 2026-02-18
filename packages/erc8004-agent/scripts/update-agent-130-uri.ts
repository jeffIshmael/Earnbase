import { ethers } from "hardhat";

async function main() {
    // The Public ERC-8004 Identity Registry on Celo Mainnet
    const REGISTRY_ADDRESS = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
    const AGENT_ID = 130; // Your Agent ID

    // Updated metadata URI - IPFS hosted
    const METADATA_URI = "ipfs://bafkreic3dx234sw2cldjy5ae72guyjw42bjbzd3deno4l5qay5hb7eqphi";

    // Option 2: Upload to IPFS and use that URI
    // const METADATA_URI = "ipfs://bafkrei..."; // Replace with actual IPFS hash

    const [deployer] = await ethers.getSigners();
    console.log("Updating Agent 130 metadata with account:", deployer.address);
    console.log("Agent ID:", AGENT_ID);
    console.log("New Metadata URI:", METADATA_URI);

    // Connect to the public ERC-8004 registry
    // We'll use the EarnbaseAgent ABI since it implements the same interface
    const Registry = await ethers.getContractAt("EarnbaseAgent", REGISTRY_ADDRESS);

    // Check current owner
    try {
        const currentOwner = await Registry.ownerOf(AGENT_ID);
        console.log("Current owner of Agent 130:", currentOwner);

        if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
            console.error("❌ Error: You are not the owner of Agent 130");
            console.error(`   Owner: ${currentOwner}`);
            console.error(`   Your address: ${deployer.address}`);
            return;
        }
    } catch (e) {
        console.error("❌ Error: Could not verify ownership. Agent might not exist.");
        return;
    }

    // Update the metadata URI
    console.log("\nSending transaction to update metadata...");
    const tx = await Registry.setAgentURI(AGENT_ID, METADATA_URI);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log("✅ Agent 130 metadata URI updated successfully!");
    console.log("\n📋 Next Steps:");
    console.log("1. Verify on 8004scan: https://www.8004scan.io/agents/celo/130");
    console.log("2. The metadata should update within a few minutes");
    console.log("3. Selfclaw will fetch the updated data from the registry");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
