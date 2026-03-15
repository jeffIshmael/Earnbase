import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const REGISTRY_ADDRESS = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

    console.log("Checking transactions for address:", deployer.address);
    console.log("Registry Address:", REGISTRY_ADDRESS);

    // This is a simple check, we can't easily fetch full history without an indexer,
    // but we can check the nonce or just confirm the URI again.

    const Registry = await ethers.getContractAt("EarnbaseAgent", REGISTRY_ADDRESS);
    const uri = await Registry.tokenURI(130);
    console.log("Current on-chain URI (confirmed):", uri);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
