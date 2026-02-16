import { ethers } from "hardhat";

async function main() {
    const CONTRACT_ADDRESS = "0x086B03d4cDA9e0f1Ae1B4D62a8A5740dc85B0797"; // EarnbaseAgent Proxy
    const AGENT_ID = 0;
    const METADATA_URI = "ipfs://bafkreihqztidpreru6qzeotyvjwhw2tenbht5t2zd7tm7xh26io35nwcde";

    const [deployer] = await ethers.getSigners();
    console.log("Setting Agent URI with account:", deployer.address);

    const EarnbaseAgent = await ethers.getContractAt("EarnbaseAgent", CONTRACT_ADDRESS);

    console.log(`Setting URI for Agent ID ${AGENT_ID} to: ${METADATA_URI}`);
    const tx = await EarnbaseAgent.setAgentURI(AGENT_ID, METADATA_URI);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log("✅ Agent URI set successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
