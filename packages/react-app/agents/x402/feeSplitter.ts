import { PaymentSplit } from './types';

export function calculateSplit(totalPayment: bigint): PaymentSplit {
    // 90% to workers/rewards pool
    // 10% to platform

    // This is a naive split. Realistically, we need to know the *intended* reward amount vs fee.
    // If calculateCost added 10% on top of reward:
    // Total = Reward + 0.1 * Reward = 1.1 * Reward
    // Reward = Total / 1.1

    // Let's assume the payment INCLUDES the fee.
    const platformFee = (totalPayment * 10n) / 110n; // derive original 10% markup
    const workerReward = totalPayment - platformFee;

    return {
        workerReward: workerReward.toString(),
        platformFee: platformFee.toString()
    };
}
