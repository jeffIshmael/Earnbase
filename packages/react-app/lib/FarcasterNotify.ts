"use server";

import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY not found in .env");
}

const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY,
});

const client = new NeynarAPIClient(config);

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

    const response = await client.publishFrameNotifications({
      targetFids: fid,
      notification,
    });

    console.log("Farcaster response:", response);
    
    // Check for invalid target_url status and log a warning
    if (response.notification_deliveries) {
      const invalidUrls = response.notification_deliveries.filter(
        (delivery: any) => delivery.status === "invalid_target_url"
      );
      if (invalidUrls.length > 0) {
        console.warn(
          "⚠️ Some notifications have invalid target_url. Ensure the target_url matches your registered Farcaster frame URL."
        );
      }
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