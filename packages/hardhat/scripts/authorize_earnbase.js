const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    const EARNBASE_CONTRACT = "0x9Ce99d57348f85c8Ad00593FaAF4E8CD77dd3008";
    const CUSTOM_REPUTATION_REGISTRY = "0xa544587E29161AEAD04E161d2E82E319c62e9800";

    console.log(`Authorizing EarnBase (${EARNBASE_CONTRACT}) in Custom Registry (${CUSTOM_REPUTATION_REGISTRY})...`);

    // Minimal ABI for setAuthorizedCaller
    const abi = [
        "function setAuthorizedCaller(address caller, bool allowed)",
        "function owner() view returns (address)"
    ];

    const registry = await ethers.getContractAt(abi, CUSTOM_REPUTATION_REGISTRY);

    const owner = await registry.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.error(`ERROR: Current deployer (${deployer.address}) is not the owner of the registry (${owner}). Please switch to the owner account.`);
        return;
    }

    const tx = await registry.setAuthorizedCaller(EARNBASE_CONTRACT, true);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log("✅ EarnBase successfully authorized in Custom Reputation Registry!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
