import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Account: ${deployer.address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} CELO`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
