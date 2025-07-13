"use server"

import nodemailer from "nodemailer";
import 'dotenv/config'; 


const chamapayEmail = process.env.CHAMAPAY_EMAIL as string;
const chamapayPass = process.env.CHAMAPAY_PASS as string;


if (!chamapayEmail || !chamapayPass) {
  console.warn("⚠️ chamapay email and pass not found.");
  throw new Error("⚠️ chamapay email and pass not found.");
} else {
  console.log("Email and Pass: Loaded successfully");
}


// Create a transporter object using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail", // Use Gmail as the email service
  auth: {
    user: chamapayEmail, 
    pass: chamapayPass, 
  },
});

// Function to send an email
export async function sendEmail(to: string, farcasterLink: string) {
    try {
      const subject = "🎉 You're In! Welcome to ChamaPay Beta Testing";
  
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #2c3e50; font-size: 24px;">🎉 Congratulations!</h2>
          <p style="font-size: 16px; color: #333;">
            You’ve officially been selected to participate in the <strong>ChamaPay Beta Testing Program</strong>! 🚀
          </p>
          <p style="font-size: 16px; color: #333;">
            The program kicks off <strong>tomorrow</strong> and will run for <strong>14 days</strong>, giving you early access to try out our rotary savings platform and help shape its future.
          </p>
          <p style="font-size: 16px; color: #333;">
            To stay updated, share feedback, and connect with fellow testers, join our exclusive Farcaster channel here:
          </p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${farcasterLink}" target="_blank" style="background-color: #5C6BC0; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              👉 Join the Beta Channel
            </a>
          </p>
          <p style="font-size: 16px; color: #333;">
            Thank you for being part of this journey with us.
          </p>
          <p style="font-size: 16px; color: #333;">
            💙 The <strong>ChamaPay Team</strong>
          </p>
        </div>
      `;
  
      const mailOptions = {
        from: chamapayEmail,
        to,
        subject,
        text: `You've been selected for ChamaPay beta testing. Starts tomorrow for 14 days! Join our Farcaster channel here: ${farcasterLink}`,
        html: htmlBody,
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent:", info.response);
      return info;
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw error;
    }
  }