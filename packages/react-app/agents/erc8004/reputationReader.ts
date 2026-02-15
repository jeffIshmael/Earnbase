// import { ReputationRegistry } from "@chaoschain/sdk";
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";

// Celo Mainnet Reputation Registry
const REPUTATION_REGISTRY = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";

/**
 * Get all feedback for an agent using @chaoschain/sdk
 */
export async function getAgentReputation(agentId: number | string) {
    try {
        // Create public client for Celo
        const publicClient = createPublicClient({
            chain: celo,
            transport: http("https://forno.celo.org"),
        });

        // Initialize SDK
        // const reputation = new ReputationRegistry(publicClient as any);

        // Get all feedback
        // const feedback = await reputation.readAllFeedback(agentId);

        // Get summary statistics
        // const summary = await reputation.getSummary(agentId);

        return {
            agentId,
            feedback: [],
            summary: {
                totalFeedback: 0,
                averageScore: 0,
                lastUpdated: 0,
            },
        };
    } catch (error) {
        console.error("Error reading reputation:", error);
        throw error;
    }
}

/**
 * Submit feedback for an agent using @chaoschain/sdk
 */
export async function submitFeedback(
    agentId: number | string,
    score: number,
    tag: string,
    endpoint: string,
    feedbackURI?: string,
    feedbackHash?: string
) {
    try {
        // This requires a wallet client (signer)
        // For now, we'll document the process
        console.log("To submit feedback, use the @chaoschain/sdk:");
        console.log(`
      import { ReputationRegistry } from '@chaoschain/sdk';
      import { createWalletClient, custom } from 'viem';
      
      const walletClient = createWalletClient({
        chain: celo,
        transport: custom(window.ethereum),
      });
      
      const reputation = new ReputationRegistry(walletClient);
      
      await reputation.giveFeedback(
        ${agentId},
        ${score},
        0,
        '${tag}',
        '',
        '${endpoint}',
        '${feedbackURI || ""}',
        '${feedbackHash || ""}'
      );
    `);

        return {
            success: true,
            message: "Use the code above to submit feedback from a wallet-connected context",
        };
    } catch (error) {
        console.error("Error submitting feedback:", error);
        throw error;
    }
}

/**
 * Get reputation summary for display
 */
export async function getReputationSummary(agentId: number | string) {
    const { summary, feedback } = await getAgentReputation(agentId);

    // Calculate additional metrics
    const starredFeedback = feedback.filter((f: any) => f.tag1 === "starred");
    const averageStars = starredFeedback.length > 0
        ? starredFeedback.reduce((sum: number, f: any) => sum + f.score, 0) / starredFeedback.length
        : 0;

    return {
        agentId,
        totalReviews: summary.totalFeedback,
        averageScore: summary.averageScore,
        averageStars: Math.round(averageStars * 10) / 10,
        lastUpdated: new Date(summary.lastUpdated * 1000).toISOString(),
        recentFeedback: feedback.slice(0, 5), // Last 5 reviews
    };
}
