// function to add tester, done by the Agent

import { getAgentSmartAccount } from "../Pimlico";
import { contractAbi, contractAddress } from "@/contexts/constants";

const Testers = ['0x55A5705453Ee82c742274154136Fce8149597058','0xeF8dBE5851D09073B46013A600A4452756DfCFa1','0x1aa291b5ed92964CcF3ca2f6DF5dCde6ed19B8cD',
   '0xCed2d0F74ae3CcFa24D0CaEf15179f13B6CbFDf1',
   '0x66ddf5d0702f1f44ee5d9072256db3ecaf98aa0d',
  '0x00826978f1A2f8ccAf414600ed5b1f8Ff6d4Cd7b',
 '0x847F89f5C9Da3431682E70C95a96df8D400401Fe',
'0xBc078d70cf8486e3aAd3B6fDfE6C9D78b54EDDC0',
'0x9a3379A02DA3B01E71AD02174343A6c12a62db07',
'0xAE18b1b36A82EB0b7c655c217F762a3ae11dD2b6',
'0x1fF127F31982E0Ef82f5EC2064B6185D57417a1a',
'0x621B5F6fFaf273bD299F4feD9Bd3079f6d9d544F'
  ];


  export async function addTestersToBc(address: string[]){
    try {
        const { account, smartAccountClient } = await getAgentSmartAccount();
    
        console.log("Smart account address:", account.address);
    
       const hash = await smartAccountClient.writeContract({
        abi: contractAbi,
        address: contractAddress,
        functionName: 'addTesters',
        args: [address],
       })
       console.log("txHash", hash);
    
      } catch (error) {
        console.error("Error sending CELO:", error);
      }
  }
