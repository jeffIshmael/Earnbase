import { getAgentSmartWallet } from "./agentWallet";
import { publicClient } from "./SmartAccount";
import { contractAddress, contractAbi, USDCAddress } from "./constants";
import { parseUnits, encodeFunctionData, formatUnits } from "viem";

const erc20Abi = [
    {
        "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export async function completeAgentTaskOnchain(
    formattedRequestId: `0x${string}`,
    resultsCID: string,
    merkleRoot: `0x${string}`,
    tags: string[] = ["hfaas", "verified-human", "task-completed"]
) {
    try {
        const { smartAccountClient } = await getAgentSmartWallet();

        console.log(`Submitting Smart Account completeRequest to Celo for AgentRequest: ${formattedRequestId}`);

        const hash = await smartAccountClient.writeContract({
            address: contractAddress as `0x${string}`,
            abi: contractAbi,
            functionName: "completeRequest",
            args: [
                formattedRequestId,
                resultsCID,
                merkleRoot,
                BigInt(600),           // avgLatencySeconds (low latency is better for score)
                BigInt(100),           // completionRate (100% success)
                BigInt(100),           // agentScore (0-100 scale, using max)
                tags                   // tags
            ],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (!receipt) {
            throw new Error("Unable to retrieve completion transaction receipt.");
        }

        return receipt.transactionHash;
    } catch (error) {
        console.error("Error completing agent task on-chain via smart account:", error);
        throw error;
    }
}

// publish task to the platform
export async function publishAgentTaskOnchain(
    formattedRequestId: `0x${string}`,
    amount: string,
    participants: number
) {
    try {
        const { smartAccountClient } = await getAgentSmartWallet();

        console.log(`Submitting Smart Account batch (approve + createRequest) to Celo for AgentRequest: ${formattedRequestId}`);
        const amountInWei = parseUnits(amount, 6);

        // Encode the approve call
        const approveData = encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [contractAddress as `0x${string}`, amountInWei],
        });

        // Encode the createRequest call
        const createRequestData = encodeFunctionData({
            abi: contractAbi,
            functionName: "createRequest",
            args: [formattedRequestId, amountInWei, BigInt(participants)],
        });

        // Send both calls in a single UserOperation
        const hash = await smartAccountClient.sendTransaction({
            calls: [
                {
                    to: USDCAddress as `0x${string}`,
                    data: approveData,
                },
                {
                    to: contractAddress as `0x${string}`,
                    data: createRequestData,
                }
            ],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (!receipt) {
            throw new Error("Unable to retrieve completion transaction receipt.");
        }

        return receipt.transactionHash;
    } catch (error) {
        console.error("Error completing agent task on-chain via smart account:", error);
        throw error;
    }
}

// pay a tasker
export async function payTaskerOnchain(
    formattedRequestId: `0x${string}`,
    contributor: `0x${string}`,
    amount: string,
    reputationWeight: number
) {
    try {
        const { smartAccountClient } = await getAgentSmartWallet();

        console.log(`Submitting Smart Account payout to Celo for AgentRequest: ${formattedRequestId}`);
        const amountInWei = BigInt(amount);

        // Encode the payoutContributor call
        const payoutContributorData = encodeFunctionData({
            abi: contractAbi,
            functionName: "payoutContributor",
            args: [formattedRequestId, contributor, amountInWei, BigInt(reputationWeight)],
        });

        // Send the payout transaction
        const hash = await smartAccountClient.sendTransaction({
            to: contractAddress as `0x${string}`,
            data: payoutContributorData,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (!receipt) {
            throw new Error("Unable to retrieve payout transaction receipt.");
        }

        return receipt.transactionHash;
    } catch (error) {
        console.error("Error paying tasker on-chain via smart account:", error);
        throw error;
    }
}

