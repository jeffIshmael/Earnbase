import { PricingModel } from './types';
import { parseUnits } from 'viem';

export const PRICING_MODEL: PricingModel = {
    baseFee: "0.05", // $0.05 base
    perParticipantFee: "0.01" // $0.01 per participant
};

export function calculateCost(
    participants: number,
    rewardPerParticipant: string // in ether unit (e.g. "1.5" USDC)
): string {
    const rewardWei = parseUnits(rewardPerParticipant, 6);
    const totalReward = rewardWei * BigInt(participants);

    // Add platform fee? For now, let's say platform fee is 10% on top, or included.
    // Let's keep it simple: Cost = Total Rewards + 10% Fee

    const fee = (totalReward * 10n) / 100n;
    const totalCost = totalReward + fee;

    return totalCost.toString();
}
