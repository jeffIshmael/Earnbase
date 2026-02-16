
import { ethers } from "hardhat";

async function main() {
    console.log("Deploying EarnBaseV2 (Dual Feedback)...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Params for Celo Mainnet
    const USDC_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";

    // Our Custom Agents (Deployed previously)
    const CUSTOM_AGENT_PROXY = "0xC2F56072284dEB638191acb1206520da04Fc5B43";
    const CUSTOM_REPUTATION_PROXY = "0xa544587E29161AEAD04E161d2E82E319c62e9800";

    // Public Registry (for 8004scan visibility)
    const PUBLIC_REPUTATION_REGISTRY = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";
    const PUBLIC_AGENT_ID = 120; // Your confirmed Public ID

    // Deploy EarnBaseV2
    // constructor(address _usdc, address _agent, address _reputation, address _publicReputation, uint256 _publicId)
    const EarnBase = await ethers.getContractFactory("EarnBaseV2"); // Note: Contract name in file is EarnBaseV2
    const earnbase = await EarnBase.deploy(
        USDC_ADDRESS,
        CUSTOM_AGENT_PROXY,
        CUSTOM_REPUTATION_PROXY,
        PUBLIC_REPUTATION_REGISTRY,
        PUBLIC_AGENT_ID
    );

    // Wait for deployment
    await earnbase.waitForDeployment();
    const earnbaseAddress = await earnbase.getAddress();

    console.log("----------------------------------------------------------------");
    console.log("✅ EarnBaseV2 Deployed Successfully!");
    console.log("Contract Address:", earnbaseAddress);
    console.log("----------------------------------------------------------------");
    console.log("Configuration:");
    console.log("- Custom Agent (Internal):", CUSTOM_AGENT_PROXY);
    console.log("- Custom Reputation (Internal):", CUSTOM_REPUTATION_PROXY);
    console.log("- Public Reputation (External):", PUBLIC_REPUTATION_REGISTRY);
    console.log("- Public Agent ID:", PUBLIC_AGENT_ID);
    console.log("----------------------------------------------------------------");
    console.log("IMPORTANT: Update your React App's `EARNBASE_ADDRESS` with this new address.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// npx hardhat run scripts/deploy-dual-feedback.ts --network celo
