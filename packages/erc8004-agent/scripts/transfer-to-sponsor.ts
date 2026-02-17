import { ethers } from "hardhat";

async function main() {
    const TOKEN_ADDRESS = "0x6F614202fA8557225DBbAC16FB30fb252feC7B89";
    const SPONSOR_WALLET = "0x5451bC61a58FfD5B6684a7EA1E2Ef0FDbd4ccBE6";
    const AMOUNT = ethers.parseEther("100000"); // 100,000 EARN tokens

    const [deployer] = await ethers.getSigners();
    console.log("Transferring tokens with account:", deployer.address);
    console.log("Token:", TOKEN_ADDRESS);
    console.log("Sponsor Wallet:", SPONSOR_WALLET);
    console.log("Amount:", ethers.formatEther(AMOUNT), "EARN");

    // Connect to the token contract
    const Token = await ethers.getContractAt("EarnbaseToken", TOKEN_ADDRESS);

    // Check current balance
    const balance = await Token.balanceOf(deployer.address);
    console.log("\nYour current balance:", ethers.formatEther(balance), "EARN");

    if (balance < AMOUNT) {
        console.error("❌ Insufficient balance!");
        console.error(`   Required: ${ethers.formatEther(AMOUNT)} EARN`);
        console.error(`   Available: ${ethers.formatEther(balance)} EARN`);
        return;
    }

    // Transfer tokens to sponsor wallet
    console.log("\nTransferring tokens to sponsor wallet...");
    const tx = await Token.transfer(SPONSOR_WALLET, AMOUNT);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log("✅ Tokens transferred successfully!");

    // Verify transfer
    const newBalance = await Token.balanceOf(deployer.address);
    const sponsorBalance = await Token.balanceOf(SPONSOR_WALLET);
    console.log("\n📊 Updated Balances:");
    console.log("   Your balance:", ethers.formatEther(newBalance), "EARN");
    console.log("   Sponsor balance:", ethers.formatEther(sponsorBalance), "EARN");

    console.log("\n📋 Next Step:");
    console.log("Run: npx ts-node scripts/register-token-and-sponsor.ts");
    console.log("This will complete the sponsorship request and create your Uniswap pool!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
