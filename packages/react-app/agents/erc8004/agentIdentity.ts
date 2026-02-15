// import { getAgent } from './agentRegistry';

export async function verifyAgent(agentAddress: string): Promise<boolean> {
    // const agent = await getAgent(agentAddress);

    // if (!agent) {
    //     console.warn(`Agent verification failed: Agent not found at ${agentAddress}`);
    //     return false;
    // }

    // specific checks (e.g., must have 'human-feedback' capability)
    // if (!agent.capabilities.includes('human-feedback')) {
    //     console.warn(`Agent verification failed: Missing required capability 'human-feedback'`);
    //     return false;
    // }

    return true;
}
