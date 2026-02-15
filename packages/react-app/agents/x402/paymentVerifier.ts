import { createPublicClient, http, parseAbiItem, decodeEventLog, erc20Abi } from 'viem';
import { celo, celoAlfajores } from 'viem/chains';
import { USDCAddress } from '@/contexts/constants';
import { PaymentData } from './types';

// Standard ERC20 Transfer Event
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

export async function verifyPayment(
    transactionHash: string,
    expectedAmount: bigint,
    payerAddress: string,
    recipientAddress: string // The Earnbase Agent (Contract or Wallet)
): Promise<boolean> {
    try {
        const client = createPublicClient({
            chain: celo, // Adjust based on env
            transport: http()
        });

        const receipt = await client.getTransactionReceipt({ hash: transactionHash as `0x${string}` });

        if (receipt.status !== 'success') {
            console.error("Payment transaction failed on-chain");
            return false;
        }

        // Check logs for USDC Transfer to our address with correct amount
        for (const log of receipt.logs) {
            try {
                // We check if this log is from the USDC contract
                if (log.address.toLowerCase() !== USDCAddress.toLowerCase()) continue;

                const decoded = decodeEventLog({
                    abi: erc20Abi,
                    data: log.data,
                    topics: log.topics
                });

                if (decoded.eventName === 'Transfer') {
                    const { from, to, value } = decoded.args;

                    if (
                        from.toLowerCase() === payerAddress.toLowerCase() &&
                        to.toLowerCase() === recipientAddress.toLowerCase() &&
                        value >= expectedAmount
                    ) {
                        // Payment verified!
                        return true;
                    }
                }
            } catch (e) {
                continue;
            }
        }

        console.error("Payment verification failed: No matching Transfer event found.");
        return false;
    } catch (error) {
        console.error("Error verifying payment:", error);
        return false;
    }
}
