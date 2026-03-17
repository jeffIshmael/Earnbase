import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";

const contractAddress = "0x9Ce99d57348f85c8Ad00593FaAF4E8CD77dd3008";
const abi = [
    {
        "inputs": [],
        "name": "publicReputationRegistry",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "publicAgentId",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "authorisedAgent",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

async function checkState() {
    const client = createPublicClient({
        chain: celo,
        transport: http()
    });

    try {
        const registry = await client.readContract({
            address: contractAddress,
            abi,
            functionName: "publicReputationRegistry"
        });

        const agentId = await client.readContract({
            address: contractAddress,
            abi,
            functionName: "publicAgentId"
        });

        const authAgent = await client.readContract({
            address: contractAddress,
            abi,
            functionName: "authorisedAgent"
        });

        console.log("Contract Address:", contractAddress);
        console.log("Public Reputation Registry:", registry);
        console.log("Public Agent ID:", agentId.toString());
        console.log("Authorised Agent:", authAgent);
    } catch (error) {
        console.error("Error reading contract:", error);
    }
}

checkState().catch(console.error);
