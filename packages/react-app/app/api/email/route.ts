import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/SendEmail"; 
import { sendCelo } from "@/lib/Helper/sendCelo";

import { addTestersToBc } from "@/lib/Helper/Testers";
import { sendFundsToTesters } from "@/lib/WriteFunctions";
import { sendMoneyAndNotify } from "@/lib/Helper/registerUser";
// import { swap } from "@/Test";
import { getTheQuote, theTradingPairs } from "@/lib/Swapping";


export async function GET(request: Request) {

 
    try {
        // await addTestersToBc(Testers);
        // await addTester(1,"1",Testers);
        // await sendMoneyAndNotify();
        // await sendCelo("0x1C059486B99d6A2D9372827b70084fbfD014E978");
        // await getSwapping();
        // await swap();
        // const amount = await checkAmountToReceive("10000000000000");
        const result = await theTradingPairs();
        console.log("API result", result);
        // return NextResponse.json({ success: true, result });
    } catch (error) {
        console.log(error);
    }
   

  console.log("Cron job executed at:", new Date().toISOString());

  return NextResponse.json({ success: true });
}