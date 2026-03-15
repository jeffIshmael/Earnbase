const { ethers } = require("ethers");
require("dotenv").config({ path: "../erc8004-agent/.env" });

async function main() {
    const pk = process.env.PRIVATE_KEY;
    if (!pk) {
        console.log("No PRIVATE_KEY found");
        return;
    }
    const wallet = new ethers.Wallet(pk);
    console.log("Wallet address for PRIVATE_KEY:", wallet.address);
}

main();
