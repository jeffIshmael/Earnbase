const { ethers } = require("hardhat");

async function main() {
    const customRegistryAddress = "0xa544587E29161AEAD04E161d2E82E319c62e9800";
    
    // Minimal ABI for owner() and authorized callers check
    const abi = [
        "function owner() view returns (address)",
        "function setAuthorizedCaller(address caller, bool allowed)",
        // Note: _authorizedCallers is private in the contract state but we can call it if there's a getter or just try set.
    ];
    
    const registry = await ethers.getContractAt(abi, customRegistryAddress);

    try {
        const owner = await registry.owner();
        console.log("Custom Registry Owner:", owner);
    } catch (e) {
        console.error("Error reading owner:", e.message);
    }
}

main();
