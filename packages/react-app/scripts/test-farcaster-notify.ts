import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.NEYNAR_API_KEY) {
    console.error("❌ NEYNAR_API_KEY not found in .env");
    process.exit(1);
}

const config = new Configuration({
    apiKey: process.env.NEYNAR_API_KEY,
});

const client = new NeynarAPIClient(config);

async function testNotification(fid: number[]) {
    console.log(`🚀 Sending test notification to FID: ${fid}...`);

    const notification = {
        title: "Test Notification 🔔",
        body: "This is a test notification from Earnbase to verify Neynar setup. If you see this, it works! 🚀",
        target_url: "https://earnbase.vercel.app",
    };

    try {
        const response: any = await client.publishFrameNotifications({
            targetFids: fid,
            notification,
        });

        console.log("✅ Neynar response:", JSON.stringify(response, null, 2));

        if (response.notification_deliveries) {
            const deliveries = response.notification_deliveries as any[];
            const successes = deliveries.filter(d => d.status === "sent" || d.status === "success");
            const failures = deliveries.filter(d => d.status !== "sent" && d.status !== "success");

            if (successes.length > 0) {
                console.log(`✅ Successfully sent to ${successes.length} delivery targets.`);
            }
            if (failures.length > 0) {
                console.warn(`⚠️ Failed to deliver to ${failures.length} targets.`);
                failures.forEach(f => console.warn(`   - Status: ${f.status}, Reason: ${JSON.stringify(f)}`));

                console.log("\n💡 Possible reasons for failure:");
                console.log("1. The user has not added the mini-app yet.");
                console.log("2. The user has disabled notifications for this app.");
                console.log("3. The manifest (farcaster.json) hasn't been refreshed by the Farcaster client yet.");
                console.log("4. The webhookUrl in the manifest was recently changed and Neynar hasn't captured a token for this FID yet.");
            }
        } else {
            console.log("ℹ️ No delivery details returned in response.");
        }
    } catch (error: any) {
        console.error("❌ Error sending notification:");
        if (error.response?.data) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

// Target FID from user request
const TARGET_FID = [1077932];

testNotification(TARGET_FID);
