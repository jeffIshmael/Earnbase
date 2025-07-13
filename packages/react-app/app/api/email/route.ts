import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/SendEmail"; 


export async function GET(request: Request) {

  const emails = ["johnnjuki.dev@gmail.com","chigoziejacob@gmail.com","globalcryptodigger1@gmail.com","jordan.ofurum@gmail.com","papaandthejimjams@gmail.com","defipriestess45@gmail.com","sosfundz@gmail.com",
    "gayangikaoshadhi@gmail.com","K5calls01@gmail.com","joshjoshuaosaz@gmail.com","riskyonchains@gmail.com","kazwandy02@gmail.com"
  ];
  const farcasterLink = "https://farcaster.xyz/~/group/OJFi2nrWS437gEX72pZBRA";


  // 2. Your cron logic
  for (const email of emails){
    try {
        await sendEmail(email,farcasterLink);
    } catch (error) {
        console.log(error);
    }
  }
  

  console.log("Cron job executed at:", new Date().toISOString());

  return NextResponse.json({ success: true });
}