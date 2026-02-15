
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";

// Celo Mainnet Identity Registry
const IDENTITY_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

// Earnbase Agent ID (Token #0)
export const EARNBASE_AGENT_ID = 0;

/**
 * Get agent details using @chaoschain/sdk
 */
// export async function getAgent(agentId: number | string) {
//     try {
//         // Create public client for Celo
//         const publicClient = createPublicClient({
//             chain: celo,
//             transport: http("https://forno.celo.org"),
//         });

//         // Initialize SDK
//         const registry = new IdentityRegistry(publicClient as any);

//         // Get agent URI
//         const agentURI = await registry.tokenURI(agentId);

//         // Get agent owner
//         const owner = await registry.ownerOf(agentId);

//         // Fetch agent metadata from URI
//         let metadata = null;
//         if (agentURI.startsWith("ipfs://")) {
//             const ipfsHash = agentURI.replace("ipfs://", "");
//             const ipfsGateway = `https://ipfs.io/ipfs/${ipfsHash}`;
//             const response = await fetch(ipfsGateway);
//             metadata = await response.json();
//         } else if (agentURI.startsWith("http")) {
//             const response = await fetch(agentURI);
//             metadata = await response.json();
//         }

//         return {
//             agentId,
//             owner,
//             agentURI,
//             metadata,
//             endpoints: metadata?.endpoints || [],
//             name: metadata?.name || "Unknown Agent",
//             description: metadata?.description || "",
//             image: metadata?.image || "",
//         };
//     } catch (error) {
//         console.error("Error fetching agent:", error);
//         throw error;
//     }
// }

/**
 * Get Earnbase agent details
 */
// export async function getEarnbaseAgent() {
//     return getAgent(EARNBASE_AGENT_ID);
// }

/**
 * Verify agent exists and is registered
 */
// export async function verifyAgent(agentId: number | string): Promise<boolean> {
//     try {
//         const agent = await getAgent(agentId);
//         return agent.owner !== "0x0000000000000000000000000000000000000000";
//     } catch (error) {
//         return false;
//     }
// }

/**
 * Get agent endpoint by type
 */
// export async function getAgentEndpoint(
//     agentId: number | string,
//     endpointType: "a2a" | "mcp" | "wallet" | "ens"
// ) {
//     const agent = await getAgent(agentId);
//     const endpoint = agent.endpoints.find((e: any) => e.type === endpointType);
//     return endpoint?.url || endpoint?.address || null;
// }
