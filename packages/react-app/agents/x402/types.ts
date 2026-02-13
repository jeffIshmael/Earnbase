export interface PaymentData {
    transactionHash: string;
    amount: bigint;
    payer: string;
    recipient: string;
}

export interface PricingModel {
    baseFee: string; // in USDC
    perParticipantFee: string;
}

export interface PaymentSplit {
    workerReward: string;
    platformFee: string;
}

// EIP-2612 Permit Signature
export interface PaymentSignature {
    owner: string;
    spender: string;
    value: string;
    deadline: number;
    v: number;
    r: string;
    s: string;
}

// Payment Proof (for gasless payments)
export interface PaymentProof {
    signature: PaymentSignature;
    resource: string;
    timestamp: number;
}

// Payment Requirement (402 response)
export interface PaymentRequirement {
    payTo: string;
    amount: string; // in USDC (e.g., "0.10")
    asset: string; // USDC contract address
    network: string;
    chainId: number;
    description?: string;
}
