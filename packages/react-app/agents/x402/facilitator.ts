/**
 * x402 Payment Facilitator using thirdweb SDK
 * 
 * This module handles server-side payment settlement for x402 gasless payments.
 * Uses thirdweb's official implementation for production-ready payment handling.
 */

import { createThirdwebClient } from "thirdweb";
import { facilitator, settlePayment } from "thirdweb/x402";
import { celo } from "thirdweb/chains";

// Initialize thirdweb client
const client = createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET_KEY || "",
});

// Create facilitator for payment settlement
const thirdwebFacilitator = facilitator({
    client,
    serverWalletAddress: process.env.SERVER_WALLET_ADDRESS || "",
});

/**
 * Settle a payment using thirdweb x402
 * 
 * @param resourceUrl - The API endpoint being accessed
 * @param method - HTTP method (GET, POST, etc.)
 * @param paymentData - Payment signature from X-PAYMENT header
 * @param price - Price in USD (e.g., "$0.10")
 * @returns Settlement result with transaction hash
 */
export async function settleX402Payment(
    resourceUrl: string,
    method: string,
    paymentData: string | null,
    price: string
) {
    try {
        const result = await settlePayment({
            resourceUrl,
            method,
            paymentData,
            payTo: process.env.NEXT_PUBLIC_EARNBASE_AGENT_WALLET || "",
            network: celo,
            price,
            facilitator: thirdwebFacilitator,
            routeConfig: {
                description: "Earnbase task submission payment",
                mimeType: "application/json",
            },
        });

        if (result.status === 200) {
            return {
                success: true,
                txHash: result.responseHeaders?.["x-payment-receipt"],
                message: "Payment settled successfully",
            };
        } else {
            return {
                success: false,
                error: result.responseBody?.error || "Payment settlement failed",
                status: result.status,
                headers: result.responseHeaders,
            };
        }
    } catch (error: any) {
        console.error("Settlement error:", error);
        return {
            success: false,
            error: error.message || "Settlement failed",
        };
    }
}

/**
 * Create a 402 Payment Required response
 * 
 * @param resourceUrl - The API endpoint
 * @param price - Price in USD
 * @returns Response headers and body for 402 status
 */
export function create402Response(resourceUrl: string, price: string) {
    return {
        status: 402,
        headers: {
            "Content-Type": "application/json",
            "X-Payment-Required": "true",
            "X-Payment-Price": price,
            "X-Payment-Network": "celo",
            "X-Payment-Asset": process.env.NEXT_PUBLIC_USDC_ADDRESS || "",
            "X-Payment-Recipient": process.env.NEXT_PUBLIC_EARNBASE_AGENT_WALLET || "",
        },
        body: {
            error: "Payment Required",
            message: `This endpoint requires payment of ${price}`,
            paymentDetails: {
                price,
                network: "celo",
                chainId: 42220,
                asset: process.env.NEXT_PUBLIC_USDC_ADDRESS,
                recipient: process.env.NEXT_PUBLIC_EARNBASE_AGENT_WALLET,
            },
        },
    };
}

export { thirdwebFacilitator };
