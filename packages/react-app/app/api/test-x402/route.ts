import { settlePayment, facilitator } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { celo } from "thirdweb/chains";
import { parseUnits } from "viem";

const thirdwebSecretKey = process.env.THIRDWEB_SECRET_KEY;
const ADMIN_WALLET = process.env.ADMIN_WALLET_ADDRESS || "0x1fF127F31982E0Ef82f5EC2064B6185D57417a1a";

if (!thirdwebSecretKey) {
    console.warn("THIRDWEB_SECRET_KEY is not defined");
}

const client = createThirdwebClient({
    secretKey: thirdwebSecretKey || "",
});

const thirdwebFacilitator = facilitator({
    client,
    serverWalletAddress: ADMIN_WALLET,
});

export async function POST(request: Request) {
    try {
        const paymentData =
            request.headers.get("PAYMENT-SIGNATURE") ||
            request.headers.get("X-PAYMENT");

        // Verify and process the payment via x402
        const result = await settlePayment({
            resourceUrl: request.url,
            method: "POST",
            paymentData,
            payTo: ADMIN_WALLET,
            network: celo,
            price: {
                amount: parseUnits("0.01", 6).toString(),
                asset: {
                    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
                    decimals: 6,
                    symbol: "USDC"
                }
            },
            facilitator: thirdwebFacilitator,
            routeConfig: {
                description: "x402 Test Payment",
                mimeType: "application/json",
            },
        });

        if (result.status !== 200) {
            // Payment required or failed
            console.error("x402 Settlement Failed:", {
                status: result.status,
                error: (result as any).responseBody?.error,
                errorMessage: (result as any).responseBody?.errorMessage
            });
            return Response.json(result.responseBody, {
                status: result.status,
                headers: result.responseHeaders,
            });
        }

        return Response.json({
            success: true,
            message: "x402 Payment successful!",
            recipient: ADMIN_WALLET,
            amount: "0.01 USDC"
        });

    } catch (error) {
        console.error("x402 Test Error:", error);
        return Response.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
    }
}
