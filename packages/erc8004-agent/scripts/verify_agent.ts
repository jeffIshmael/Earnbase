
import { ethers } from "hardhat";

async function main() {
    const contractAddress = "0x4D0b621583d7f971B9a66909e4C452EdDde0b336";
    const EarnbaseAgent = await ethers.getContractFactory("EarnbaseAgent");
    const agentContract = EarnbaseAgent.attach(contractAddress);

    console.log("Verifying Agent 0 on contract:", contractAddress);

    try {
        const owner = await agentContract.ownerOf(0);
        console.log("Owner of Token ID 0:", owner);
    } catch (e: any) {
        console.log("ownerOf(0) failed:", e.message);
    }

    try {
        const uri = await agentContract.tokenURI(0);
        console.log("Token URI for ID 0:", uri);
    } catch (e: any) {
        console.log("tokenURI(0) failed:", e.message);
    }

    try {
        const caps = await agentContract.getCapabilities();
        console.log("Capabilities:", caps);
    } catch (e:any) {
        console.log("getCapabilities failed:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
