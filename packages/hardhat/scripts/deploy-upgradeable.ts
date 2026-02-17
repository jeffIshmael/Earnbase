import { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Params for Celo Mainnet
    const USDC_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";

    // Our Custom Agents (Deployed previously)
    const CUSTOM_AGENT_PROXY = "0xC2F56072284dEB638191acb1206520da04Fc5B43";
    const CUSTOM_REPUTATION_PROXY = "0xa544587E29161AEAD04E161d2E82E319c62e9800";

    // Public Registry (for 8004scan visibility)
    const PUBLIC_REPUTATION_REGISTRY = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";
    const PUBLIC_AGENT_ID = 120; // Your confirmed Public ID

    console.log("Deploying EarnBaseV2 (UUPS)...");

    // Deploy Proxy
    const EarnBaseV2 = await ethers.getContractFactory("EarnBaseV2");
    const earnBase = await upgrades.deployProxy(EarnBaseV2, [
        deployer.address, // owner
        USDC_ADDRESS,
        deployer.address, // AUTHORISED_AGENT (Owner first, update later)
        CUSTOM_AGENT_PROXY, // FEEDBACK_AGENT (The automated agent)
        CUSTOM_REPUTATION_PROXY, // REPUTATION_REGISTRY
        PUBLIC_REPUTATION_REGISTRY,
        PUBLIC_AGENT_ID
    ], { initializer: 'initialize', kind: 'uups' });

    await earnBase.waitForDeployment();
    const address = await earnBase.getAddress();

    console.log("EarnBaseV2 Proxy deployed to:", address);

    // Get Implementation Address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(address);
    console.log("Implementation deployed to:", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// npx hardhat run scripts/deploy-upgradeable.ts --network celo