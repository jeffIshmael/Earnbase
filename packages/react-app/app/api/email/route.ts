import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/SendEmail"; 
import { sendCelo } from "@/lib/Helper/sendCelo";
import { addTester } from "@/lib/Prismafnctns";
import { addTestersToBc } from "@/lib/Helper/Testers";
import { sendFundsToTesters } from "@/lib/WriteFunctions";
import { sendMoneyAndNotify } from "@/lib/Helper/registerUser";


export async function GET(request: Request) {

  const emails = ["johnnjuki.dev@gmail.com","chigoziejacob@gmail.com","globalcryptodigger1@gmail.com","jordan.ofurum@gmail.com","papaandthejimjams@gmail.com","defipriestess45@gmail.com","sosfundz@gmail.com",
    "gayangikaoshadhi@gmail.com","K5calls01@gmail.com","joshjoshuaosaz@gmail.com","riskyonchains@gmail.com","kazwandy02@gmail.com"
  ];
  const farcasterLink = "https://farcaster.xyz/~/group/OJFi2nrWS437gEX72pZBRA";

  const Testers = [
    '0x55A5705453Ee82c742274154136Fce8149597058','0xeF8dBE5851D09073B46013A600A4452756DfCFa1',
    '0x1aa291b5ed92964CcF3ca2f6DF5dCde6ed19B8cD',
   '0xCed2d0F74ae3CcFa24D0CaEf15179f13B6CbFDf1',
   '0x66ddf5d0702f1f44ee5d9072256db3ecaf98aa0d',
  '0x00826978f1A2f8ccAf414600ed5b1f8Ff6d4Cd7b',
 '0x847F89f5C9Da3431682E70C95a96df8D400401Fe',
'0xBc078d70cf8486e3aAd3B6fDfE6C9D78b54EDDC0',
'0x9a3379A02DA3B01E71AD02174343A6c12a62db07',
'0xAE18b1b36A82EB0b7c655c217F762a3ae11dD2b6',
'0x1fF127F31982E0Ef82f5EC2064B6185D57417a1a',
'0x621B5F6fFaf273bD299F4feD9Bd3079f6d9d544F'
  ]
 
    try {
        // await addTestersToBc(Testers);
        // await addTester(1,"1",Testers);
        // await sendMoneyAndNotify("2.5");
        await sendCelo("0x1C059486B99d6A2D9372827b70084fbfD014E978");
    } catch (error) {
        console.log(error);
    }
   

  console.log("Cron job executed at:", new Date().toISOString());

  return NextResponse.json({ success: true });
}