import { ethers } from "hardhat";

async function main() {
    const REGISTRY_ADDRESS = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
    const AGENT_ID = 130;

    console.log("Checking current metadata URI for Agent 130...");

    // Connect to the registry
    const Registry = await ethers.getContractAt("EarnbaseAgent", REGISTRY_ADDRESS);

    try {
        const uri = await Registry.tokenURI(AGENT_ID);
        console.log("Current Agent URI:", uri);

        const owner = await Registry.ownerOf(AGENT_ID);
        console.log("Current Owner:", owner);
    } catch (e: any) {
        console.error("Error fetching agent info:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
