import { createPublicClient, http, parseAbiItem } from 'viem';
import { celo } from 'viem/chains';

export interface PlatformRating {
    "result-accuracy": number;
    "response-time": number;
    "human-quality": number;
    "task-completion-rate": number;
    "overall-service": number;
}

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
     * The agent uses this to open a task on Earnbase.
     * 
     * If the agent has an integrated wallet/signer:
     * 1. Call getTaskQuote() to get the amount and destination.
     * 2. Sign a payment signature (X402) or perform the transfer.
     * 3. Call requestHumanTask with the paymentSignature.
     * 
     * If the agent DOES NOT have a wallet:
     * 1. Call getTaskQuote() to get the amount and destination.
     * 2. Inform the human controller/admin of the amount and destination.
     * 3. Once the human pays, they provide the transaction hash.
     * 4. Call requestHumanTask with the paymentTxHash in taskSpecs.
     * 
     * @param paymentSignature The x402 payment signature (L402 or standard signed payload)
     * @param taskSpecs Configuration for the task
     * @param paymentTxHash Optional transaction hash if paid manually by a human controller
     */
    async requestHumanTask(
        paymentSignature: string | null,
        taskSpecs: {
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
            options?: string[];
            paymentTxHash?: string;
        }
    ): Promise<{ taskId: number, agentRequestId: string, status: string }> {

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Agent-Type': 'ERC8004',
        };

        if (paymentSignature) {
            headers['PAYMENT-SIGNATURE'] = paymentSignature;
        }

        const response = await fetch(`${this.apiUrl}/api/agent/submit`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                requestId: crypto.randomUUID(),
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
     * This is the "First Trigger" in the agent-payout flow.
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
        options?: string[];
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
     * Tool: Submit a rating for the Earnbase platform.
     * Once the task results are received, the agent can rate the platform's service quality.
     * 
     * @param agentRequestId The ID returned from requestHumanTask
     * @param rating The platform rating scores (1-10)
     */
    async submitPlatformRating(agentRequestId: string, rating: PlatformRating): Promise<{ success: boolean }> {
        const response = await fetch(`${this.apiUrl}/api/agent/rate-platform`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Agent-Type': 'ERC8004'
            },
            body: JSON.stringify({
                agentRequestId,
                rating
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Platform Rating Submission Failed (${response.status}): ${errorText}`);
        }

        return await response.json();
    }

    /**
     * Tool: Check the status of a requested task.
     * Agents can pull data when ready. It is recommended to poll this endpoint 
     * if not using the real-time blockchain listener.
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
     * This is the preferred way to receive results asynchronously.
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
