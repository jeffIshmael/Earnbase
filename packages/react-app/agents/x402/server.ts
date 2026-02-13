import { PaymentRequirement, PaymentProof } from './types';
import { USDCAddress } from '@/contexts/constants';
import { parseUnits } from 'viem';

export function createPaymentRequirement(
    endpoint: string,
    price: string,
    description?: string
): PaymentRequirement {
    return {
        payTo: process.env.NEXT_PUBLIC_EARNBASE_AGENT_WALLET || '',
        amount: price,
        asset: USDCAddress,
        network: 'celo',
        chainId: 42220,
        description: description || `Access to ${endpoint}`
    };
}

export function create402Response(requirement: PaymentRequirement) {
    return new Response(
        JSON.stringify({
            error: 'Payment Required',
            payment: requirement
        }),
        {
            status: 402,
            headers: {
                'Content-Type': 'application/json',
                'X-Payment-Required': 'true',
                'X-Payment-Amount': requirement.amount,
                'X-Payment-Asset': requirement.asset,
                'X-Payment-To': requirement.payTo,
                'X-Payment-Network': requirement.network
            }
        }
    );
}

export async function validatePaymentProof(
    proof: PaymentProof,
    requirement: PaymentRequirement
): Promise<{ valid: boolean; error?: string }> {
    try {
        const { signature } = proof;

        // Validate amounts match
        const expectedAmount = parseUnits(requirement.amount, 6); // USDC is 6 decimals
        const providedAmount = BigInt(signature.value);

        if (providedAmount < expectedAmount) {
            return { valid: false, error: 'Insufficient payment amount' };
        }

        // Validate recipient
        if (signature.spender.toLowerCase() !== requirement.payTo.toLowerCase()) {
            return { valid: false, error: 'Invalid payment recipient' };
        }

        // Validate deadline hasn't passed
        const now = Math.floor(Date.now() / 1000);
        if (signature.deadline < now) {
            return { valid: false, error: 'Payment signature expired' };
        }

        // Validate signature timestamp
        const maxAge = 300; // 5 minutes
        if (now - proof.timestamp > maxAge) {
            return { valid: false, error: 'Payment proof too old' };
        }

        return { valid: true };
    } catch (error) {
        return { valid: false, error: 'Invalid payment proof format' };
    }
}
