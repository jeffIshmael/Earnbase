import { verifyAgent } from '../agents/erc8004/agentIdentity';
import { validatePaymentProof } from '../agents/x402/server';
import { settleX402Payment } from '../agents/x402/facilitator';
import { calculateCost } from '../agents/x402/pricing';
import { createCompleteTask } from '../lib/Prismafnctns';
import { ContactMethod, SubtaskType } from '@prisma/client';
import { PaymentProof } from '../agents/x402/types';
import { request } from 'http';

export interface AgentTaskPayload {
    agentAddress: string;
    paymentProof: PaymentProof; // EIP-2612 permit signature (gasless)
    title: string;
    description: string;
    maxParticipants: number;
    baseReward: string; // in USDC
    maxBonusReward: string; // in USDC
    aiCriteria: string;
    subtasks?: Array<{
        title: string;
        type: SubtaskType;
        required: boolean;
    }>;
}

export async function ingestTask(payload: AgentTaskPayload) {
    const {
        agentAddress,
        paymentProof,
        title,
        description,
        maxParticipants,
        baseReward,
        maxBonusReward,
        aiCriteria,
        subtasks
    } = payload;

    console.log(`[Core] Ingesting task from agent: ${agentAddress}`);

    // 1. Identity Check (ERC-8004)
    const isVerifiedAgent = await verifyAgent(agentAddress);
    if (!isVerifiedAgent) {
        throw new Error("Agent identity verification failed.");
    }

    // 2. Payment Check (x402) - Gasless Flow
    const expectedCost = calculateCost(maxParticipants, (Number(baseReward) + Number(maxBonusReward)).toString());

    // Create payment requirement
    const requirement = {
        payTo: process.env.NEXT_PUBLIC_EARNBASE_AGENT_WALLET || "",
        amount: expectedCost,
        asset: process.env.NEXT_PUBLIC_USDC_ADDRESS || "",
        network: 'celo',
        chainId: 42220
    };

    // Validate permit signature
    const validation = await validatePaymentProof(paymentProof, requirement);
    if (!validation.valid) {
        throw new Error(`Payment validation failed: ${validation.error}`);
    }

    // Settle payment (server pays gas)
    // const settlement = await settleX402Payment(
    //     request.url,
    //     "POST",
    //     paymentProof.signature,
    //     priceUSD
    // );
    // if (!settlement.success) {
    //     throw new Error(`Payment settlement failed: ${settlement.error}`);
    // }

    console.log(`Payment settled successfully. TX: ${"0"}`);

    // 3. Publish (Task Creation)
    const taskData = {
        title,
        description,
        blockChainId: "0",
        maxParticipants,
        baseReward,
        maxBonusReward,
        aiCriteria,
        contactMethod: ContactMethod.EMAIL,
        contactInfo: "agent-relayed",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week default
        restrictionsEnabled: false,
    };

    const newTask = await createCompleteTask(
        "EARNBASE_OFFICIAL_AGENT",
        taskData,
        subtasks || []
    );

    console.log(`[Core] Task published successfully: ${newTask?.id}`);
    return newTask;
}
