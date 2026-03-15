import { prepareContractCall, getContract, sendTransaction, createThirdwebClient } from "thirdweb";
import { celo } from "thirdweb/chains";
import { USDCAddress } from "@/blockchain/constants";
import { toast } from "sonner";

const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

import { wrapFetchWithPayment } from "thirdweb/x402";
import { createWallet } from "thirdweb/wallets";

/**
 * Flow 1: Complete "Browser/Human" Flow
 * Uses Thirdweb's wrapFetchWithPayment for automatic 402 handling and signing.
 */
export async function popWalletAndSubmit(taskData: any) {
    try {
        toast.info("Connecting wallet for X402 payment...");

        // 1. Initialize Thirdweb wallet connection
        const wallet = createWallet("io.metamask");
        await wallet.connect({ client });

        // 2. Wrap fetch with X402 payment handling
        const fetchWithPayment = wrapFetchWithPayment(fetch, client, wallet);

        // 3. Execute the request
        toast.loading("Processing payment and submitting task...");
        const response = await fetchWithPayment('/api/agent/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Request failed with status ${response.status}`);
        }

        toast.dismiss();
        toast.success("Agent Task Successfully Created via Auto-Flow!");
        return result;

    } catch (error: any) {
        console.error("Auto Flow Error:", error);
        toast.dismiss();
        toast.error(error.message || "X402 Auto-Flow failed");
        throw error;
    }
}

/**
 * Flow 2: Targeted "Agent/Skill" Flow
 * Focuses purely on submitting a task using an existing transaction hash proof.
 */
export async function submitWithTxHash(txHash: string, taskData: any) {
    try {
        const response = await fetch('/api/agent/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Agent-Type': 'ERC8004',
                'PAYMENT-SIGNATURE': txHash
            },
            body: JSON.stringify(taskData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to finalize task creation");
        }

        toast.dismiss();
        toast.success("Agent Task Successfully Created!");
        return result;

    } catch (error: any) {
        console.error("Submit Hash Error:", error);
        toast.dismiss();
        toast.error(error.message || "Manual submission failed");
        throw error;
    }
}

/**
 * Helper: Only pops the wallet for manual verification of the hash flow.
 */
export async function popWalletOnly(taskData: any) {
    try {
        toast.info("Connecting wallet for manual payment...");
        const wallet = createWallet("io.metamask");
        const account = await wallet.connect({ client });

        // 1. Get Quote (Expected 402)
        const response = await fetch('/api/agent/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        const data = await response.json();
        if (response.status !== 402) throw new Error("Expected 402");

        // 2. Transact
        toast.loading("Sending payment...");
        const transaction = prepareContractCall({
            contract: getContract({ client, chain: celo, address: USDCAddress }),
            method: "function transfer(address to, uint256 amount)",
            params: [data.payTo as `0x${string}`, BigInt(data.price.amount)],
        });

        const { transactionHash } = await sendTransaction({
            transaction,
            account
        });

        toast.dismiss();
        toast.success("Payment Sent! Hash saved for manual submission.");
        return transactionHash;
    } catch (error: any) {
        toast.dismiss();
        toast.error("Pop Wallet Only failed: " + error.message);
        throw error;
    }
}
