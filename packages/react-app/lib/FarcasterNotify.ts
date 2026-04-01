"use server";

import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import dotenv from "dotenv";
dotenv.config();

const getNeynarClient = () => {
  if (!process.env.NEYNAR_API_KEY) return null;
  const config = new Configuration({
    apiKey: process.env.NEYNAR_API_KEY,
  });
  return new NeynarAPIClient(config);
};

export async function sendFarcasterNotification(
  fid: number[],
  title: string,
  message: string,
) {
  try {
    // Farcaster notification body has a 128 character limit
    const truncatedBody = message.length > 128
      ? message.substring(0, 125) + "..."
      : message;

    // Use provided target_url or default to the frame homeUrl (without trailing slash to match frame config)
    const notificationTargetUrl = "https://earnbase.vercel.app";

    const notification = {
      title,
      body: truncatedBody,
      target_url: notificationTargetUrl,
    };

    const client = getNeynarClient();
    if (!client) {
      console.warn("[Notification] Neynar client unavailable.");
      return null;
    }

    const response = await client.publishFrameNotifications({
      targetFids: fid,
      notification,
    });

    console.log(`[Notification] Neynar Response (${fid.length} targets):`, JSON.stringify(response, null, 2));

    const totalProcessed = (response.success_count || 0) + (response.failure_count || 0) + (response.not_attempted_count || 0);
    if (totalProcessed < fid.length) {
      console.warn(`[Notification] Discrepancy detected: Sent ${fid.length} FIDs, but response only accounts for ${totalProcessed}.`);
    }

    return response;
  } catch (error: any) {
    console.error("Error sending Farcaster notification:", error);

    // Log detailed error information
    if (error.response?.data) {
      console.error("API Error Details:", JSON.stringify(error.response.data, null, 2));
    }

    if (error.response?.data?.errors) {
      console.error("Validation Errors:", error.response.data.errors);
    }

    throw error;
  }
}

export async function notifyAllUsersOfNewTask(amount: string) {
  try {
    if (!process.env.NEYNAR_API_KEY) {
      console.warn("[Notification] NEYNAR_API_KEY not found. Skipping notification.");
      return;
    }

    const { getAllUserFids } = await import("@/lib/Prismafnctns");
    const fids = await getAllUserFids();

    if (!fids || fids.length === 0) {
      console.log("[Notification] No users with FIDs found. Skipping.");
      return;
    }

    console.log(`[Notification] Sending new task alerts to ${fids.length} users...`);

    const message = `Reward: ${amount} USDC. Check it out! 🚀`;

    // Neynar bulk notifications have a limit (usually 100). Batch them.
    const batchSize = 100;
    const results = [];
    for (let i = 0; i < fids.length; i += batchSize) {
      const batch = fids.slice(i, i + batchSize);
      try {
        console.log(`[Notification] Dispatching batch ${Math.floor(i / batchSize) + 1} (${batch.length} FIDs)...`);
        const response = await sendFarcasterNotification(batch, "🆕 New Task!", message);
        results.push(response);
      } catch (err: any) {
        // If Neynar rejects a whole batch because ZERO users in it have tokens, we ignore and continue.
        if (err.response?.data?.code === "NoNotificationTokens") {
          console.warn(`[Notification] Batch ${Math.floor(i / batchSize) + 1} skipped: No users in this group have launched the frame.`);
        } else {
          console.error(`[Notification] Batch ${Math.floor(i / batchSize) + 1} failed:`, err.message);
        }
      }
    }

    console.log(`[Notification] Successfully processed all reachable batches.`);
    return results;
  } catch (error) {
    console.error("Error in notifyAllUsersOfNewTask:", error);
  }
}

export async function notifyUserOfPayment(fid: number, amount: string) {
  try {
    const title = "💸 Payment Received!";
    const message = `You received ${amount} USDC from a task.Thanks for your contribution!`;

    return await sendFarcasterNotification([fid], title, message);
  } catch (error) {
    console.error("Error in notifyUserOfPayment:", error);
  }
}