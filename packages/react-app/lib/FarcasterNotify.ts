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
  message: string
) {
  try {
    const notification = {
      title,
      body: message,
      target_url: "https://chamapay-minipay.vercel.app/",
    };

    const response = await client.publishFrameNotifications({
      targetFids: fid,
      notification,
    });

    console.log("Farcaster response:", response);
    return response;
  } catch (error) {
    console.error("Error sending Farcaster notification:", error);
    return null;
  }
}