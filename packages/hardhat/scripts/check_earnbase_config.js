const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x9Ce99d57348f85c8Ad00593FaAF4E8CD77dd3008";
    const EarnBase = await ethers.getContractAt("EarnBaseV2", contractAddress);

    try {
        const repRegistry = await EarnBase.reputationRegistry();
        console.log("Current reputationRegistry (for recording):", repRegistry);

        const publicAgentId = await EarnBase.publicAgentId();
        console.log("Current publicAgentId:", publicAgentId.toString());
        
        const owner = await EarnBase.owner();
        console.log("EarnBase Owner:", owner);
        
        const authAgent = await EarnBase.authorisedAgent();
        console.log("EarnBase Authorised Agent:", authAgent);

    } catch (e) {
        console.error("Error reading config:", e.message);
    }
}

main();
