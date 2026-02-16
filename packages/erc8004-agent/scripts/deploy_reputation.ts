
import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const identityRegistryAddress = "0x4D0b621583d7f971B9a66909e4C452EdDde0b336";

    console.log("Deploying ReputationRegistry with account:", deployer.address);

    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    const reputation = await ReputationRegistry.deploy(deployer.address);

    await reputation.waitForDeployment();

    const deployedAddress = await reputation.getAddress();
    console.log("ReputationRegistry deployed to:", deployedAddress);

    console.log("Initializing with Identity Registry:", identityRegistryAddress);
    const tx = await reputation.initialize(identityRegistryAddress);
    await tx.wait();
    console.log("Initialized.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
