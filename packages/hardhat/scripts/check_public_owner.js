const { ethers } = require("hardhat");

async function main() {
    const publicRegistryAddress = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";
    const abi = ["function owner() view returns (address)"];
    const registry = await ethers.getContractAt(abi, publicRegistryAddress);

    try {
        const owner = await registry.owner();
        console.log("Public Registry Owner:", owner);
    } catch (e) {
        console.error("Error reading public owner:", e.message);
    }
}

main();
