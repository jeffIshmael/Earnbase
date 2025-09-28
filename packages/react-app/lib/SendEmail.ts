"use server"

import nodemailer from "nodemailer";
import 'dotenv/config'; 


const earnbaseEmail = process.env.EARNBASE_EMAIL as string;
const earnbasePass = process.env.EARNBASE_PASS as string;


if (!earnbaseEmail || !earnbasePass) {
  console.warn("⚠️ earnbase email and pass not found.");
  throw new Error("⚠️ earnbase email and pass not found.");
} else {
  console.log("Email and Pass: Loaded successfully");
}


// Create a transporter object using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail", // Use Gmail as the email service
  auth: {
    user: earnbaseEmail, 
    pass: earnbasePass, 
  },
});

// Function to send an email
export async function sendEmail(to: string, subject: string, htmlBody: string, textBody: string) {
    try {
      const mailOptions = {
        from: earnbaseEmail,
        to,
        subject,
        text: textBody,
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

  // function to send the response via email