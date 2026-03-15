import { createPublicClient, http, parseAbiItem } from 'viem';
import { celo } from 'viem/chains';

/**
 * EarnbaseSkill
 * Provides tools for an OpenClaw agent to request human feedback
 * or data via the Earnbase protocol on Celo.
 */
export class EarnbaseSkill {
    private apiUrl: string;
    private rpcUrl: string;
    private contractAddress: `0x${string}`;

    constructor(config?: { apiUrl?: string, rpcUrl?: string, contractAddress?: string }) {
        this.apiUrl = config?.apiUrl || "https://earnbase.vercel.app";
        // Default Celo RPC
        this.rpcUrl = config?.rpcUrl || "https://forno.celo.org";
        this.contractAddress = (config?.contractAddress || "0x00000000000000000000000000000000") as `0x${string}`;
    }

    /**
     * Tool: Request human feedback or data collection.
     * The agent uses this to spend USDC (via x402) and open a task on Earnbase.
     * 
     * @param paymentSignature The x402 payment signature (L402 or standard signed payload)
     * @param taskSpecs Configuration for the task (prompt, participants, reward, etc)
     */
    async requestHumanTask(
        paymentSignature: string,
        taskSpecs: {
            title: string;
            prompt: string;
            feedbackType: 'text_input' | 'multiple_choice' | 'rating' | 'file_upload';
            constraints: {
                participants: number;
                rewardPerParticipant: number; // in USDC
                allowedCountries?: string[]; // Geographical restrictions
                allowedNationalities?: string[]; // Nationality restrictions
                minAge?: number; // Age restriction
                maxAge?: number; // Age restriction
                allowedGenders?: ('Male' | 'Female' | 'Other')[]; // Gender restriction
                [key: string]: any;
            };
            options?: string[]; // required if multiple_choice
        }
    ): Promise<{ taskId: number, agentRequestId: string, status: string }> {

        const response = await fetch(`${this.apiUrl}/api/agent/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Agent-Type': 'ERC8004',
                'PAYMENT-SIGNATURE': paymentSignature
            },
            body: JSON.stringify({
                requestId: crypto.randomUUID(), // auto-generate if not provided
                ...taskSpecs
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Earnbase Task Request Failed (${response.status}): ${errorText}`);
        }

        return await response.json();
    }

    /**
     * Tool: Fetch payment routing destination and cost quote.
     * The agent calls this first to understand how much USDC to pay and to WHICH address.
     * 
     * @param taskSpecs Configuration for the task (prompt, participants, reward, etc)
     */
    async getTaskQuote(taskSpecs: {
        title: string;
        prompt: string;
        feedbackType: 'text_input' | 'multiple_choice' | 'rating' | 'file_upload';
        constraints: {
            participants: number;
            rewardPerParticipant: number; // in USDC
            allowedCountries?: string[];
            allowedNationalities?: string[];
            minAge?: number;
            maxAge?: number;
            allowedGenders?: ('Male' | 'Female' | 'Other')[];
            [key: string]: any;
        };
        options?: string[]; // required if multiple_choice
    }): Promise<{ destinationAddress: string, priceAmount: string, priceCurrency: string, status: number }> {
        const response = await fetch(`${this.apiUrl}/api/agent/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Agent-Type': 'ERC8004'
            },
            body: JSON.stringify({
                requestId: crypto.randomUUID(),
                ...taskSpecs
            })
        });

        const data = await response.json();

        if (response.status === 402) {
            return {
                destinationAddress: data.payTo,
                priceAmount: data.price?.amount,
                priceCurrency: data.price?.asset?.symbol || 'USDC',
                status: 402
            };
        }

        if (!response.ok) {
            throw new Error(`Earnbase Quote Failed (${response.status}): ${JSON.stringify(data)}`);
        }

        return data;
    }

    /**
     * Tool: Check the status of a requested task.
     * Replaces the webhook model, allowing agents to pull data when ready.
     * 
     * @param agentRequestId The ID returned from requestHumanTask
     */
    async queryTaskResults(agentRequestId: string): Promise<{
        status: 'processing' | 'completed';
        message?: string;
        progress?: string;
        ipfsHash?: string;
        resultsUrl?: string; // Pinata Gateway URL to the JSON
    }> {
        const response = await fetch(`${this.apiUrl}/api/agent/results?agentRequestId=${agentRequestId}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Earnbase Query Failed (${response.status}): ${errorText}`);
        }

        return await response.json();
    }

    /**
     * Tool/Utility: Listen to the blockchain to awaken the agent when the task is finalized.
     * Instead of constant polling, an agent can use this to wait for the event.
     * 
     * @param onTaskCompleted Callback when the FeedbackRequestCompleted event fires
     */
    listenForCompletion(onTaskCompleted: (log: any) => void) {
        const client = createPublicClient({
            chain: celo,
            transport: http(this.rpcUrl)
        });

        // The Earnbase contract emits FeedbackRequestCompleted
        const event = parseAbiItem('event FeedbackRequestCompleted(bytes32 indexed requestId, string resultsCID, bytes32 merkleRoot, uint256 participants, uint256 completionRate, uint256 avgLatencySeconds)');

        return client.watchEvent({
            address: this.contractAddress,
            event,
            onLogs: logs => {
                logs.forEach(log => onTaskCompleted(log));
            }
        });
    }
}
