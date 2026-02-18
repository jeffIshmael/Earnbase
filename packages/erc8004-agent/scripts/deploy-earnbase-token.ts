import { ethers } from "hardhat";

const TOKEN_NAME = "Earnbase Token";
const TOKEN_SYMBOL = "EARN";
const TOKEN_SUPPLY = "10000000"; // 10 Million

async function main() {
    console.log("🚀 Deploying Earnbase Token (Independent)...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    // Note: Assuming this deployer is the wallet linked to Agent 120 (or intended to be)

    const EarnbaseToken = await ethers.getContractFactory("EarnbaseToken");
    const token = await EarnbaseToken.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_SUPPLY);
    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();
    console.log("-----------------------------------------");
    console.log(`✅ Earnbase Token Deployed!`);
    console.log(`Address: ${tokenAddress}`);
    console.log("-----------------------------------------");
    console.log("Use this address to link/sponsor your token on the Selfclaw Dashboard.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
