import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy EarnbaseAgent (Identity Registry)
    const EarnbaseAgent = await ethers.getContractFactory("EarnbaseAgent");
    const agentImpl = await EarnbaseAgent.deploy();
    await agentImpl.waitForDeployment();
    console.log("EarnbaseAgent Implementation deployed to:", await agentImpl.getAddress());

    // Encode initialization data for EarnbaseAgent
    // function initialize() public reinitializer(2) onlyOwner
    const agentInitData = agentImpl.interface.encodeFunctionData("initialize", []);

    // Deploy ERC1967Proxy for Agent
    let ProxyFactory;
    try {
        ProxyFactory = await ethers.getContractFactory("ERC1967Proxy");
    } catch (e) {
        console.log("ERC1967Proxy artifact not found. Ensure @openzeppelin/contracts is installed and compiled.");
        throw e;
    }

    const agentProxy = await ProxyFactory.deploy(await agentImpl.getAddress(), agentInitData);
    await agentProxy.waitForDeployment();
    const agentAddress = await agentProxy.getAddress();
    console.log("EarnbaseAgent Proxy deployed to:", agentAddress);

    // 2. Deploy EarnbaseReputationRegistry
    const EarnbaseReputationRegistry = await ethers.getContractFactory("EarnbaseReputationRegistry");
    const reputationImpl = await EarnbaseReputationRegistry.deploy();
    await reputationImpl.waitForDeployment();
    console.log("EarnbaseReputationRegistry Implementation deployed to:", await reputationImpl.getAddress());

    // Encode initialization data: initialize(address identityRegistry_)
    const reputationInitData = reputationImpl.interface.encodeFunctionData("initialize", [agentAddress]);

    const reputationProxy = await ProxyFactory.deploy(await reputationImpl.getAddress(), reputationInitData);
    await reputationProxy.waitForDeployment();
    const reputationAddress = await reputationProxy.getAddress();
    console.log("EarnbaseReputationRegistry Proxy deployed to:", reputationAddress);

    // 3. Deploy EarnbaseValidationRegistry
    const EarnbaseValidationRegistry = await ethers.getContractFactory("EarnbaseValidationRegistry");
    const validationImpl = await EarnbaseValidationRegistry.deploy();
    await validationImpl.waitForDeployment();
    console.log("EarnbaseValidationRegistry Implementation deployed to:", await validationImpl.getAddress());

    // Encode initialization data: initialize(address identityRegistry_)
    const validationInitData = validationImpl.interface.encodeFunctionData("initialize", [agentAddress]);

    const validationProxy = await ProxyFactory.deploy(await validationImpl.getAddress(), validationInitData);
    await validationProxy.waitForDeployment();
    const validationAddress = await validationProxy.getAddress();
    console.log("EarnbaseValidationRegistry Proxy deployed to:", validationAddress);

    console.log("----------------------------------------------------");
    console.log("Deployment Complete:");
    console.log("EarnbaseAgent (Identity):", agentAddress);
    console.log("EarnbaseReputationRegistry:     ", reputationAddress);
    console.log("EarnbaseValidationRegistry:     ", validationAddress);
    console.log("----------------------------------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
