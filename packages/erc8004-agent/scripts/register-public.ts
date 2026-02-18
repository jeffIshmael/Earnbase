import { ethers } from "hardhat";

async function main() {
    // 1. Canonical Celo Identity Registry Address
    // from 8004scan docs: https://celoscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
    const PUBLIC_REGISTRY_ADDRESS = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

    // 2. Metadata URI (same as your custom agent)
    const METADATA_URI = "ipfs://bafkreihqztidpreru6qzeotyvjwhw2tenbht5t2zd7tm7xh26io35nwcde";

    const [deployer] = await ethers.getSigners();
    console.log("Registering on Public Registry with account:", deployer.address);

    // 3. Connect to the public contract using the EarnbaseAgent interface (compatible ABI)
    const PublicRegistry = await ethers.getContractAt("EarnbaseAgent", PUBLIC_REGISTRY_ADDRESS);

    // 4. Register
    console.log("Sending register transaction...");
    // Use `register(string)` to set URI immediately
    const tx = await PublicRegistry["register(string)"](METADATA_URI);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction failed");

    // 5. Parse Logs for Agent ID
    const event = receipt.logs.find((log: any) => {
        try {
            const parsed = PublicRegistry.interface.parseLog(log);
            return parsed?.name === "Registered";
        } catch (e) {
            return false;
        }
    });

    if (event) {
        const parsed = PublicRegistry.interface.parseLog(event);
        const agentId = parsed?.args[0];
        console.log("-----------------------------------------");
        console.log("✅ Agent Registered on Public Registry!");
        console.log("Public Agent ID:", agentId.toString());
        console.log("Registry:", PUBLIC_REGISTRY_ADDRESS);
        console.log("-----------------------------------------");
        console.log("See it on 8004scan.io shortly!");
    } else {
        console.error("Registered event not found in receipt.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
