// this file contains functions to swap from cUSD to USDC and vice versa using mento SDK

import { Mento } from "@mento-protocol/mento-sdk";
import { formatEther } from "viem";
import { Wallet, providers, utils } from "ethers";


const privateKey = "0xa6538a56bd3f70ce2671a0fbe7f15e04d40478ed0b73d0443dfb617031604b0b";
const provider = new providers.JsonRpcProvider(
  "https://forno.celo.org"
);


export async function getSwapping() {

    const mento = await Mento.create(provider);

  
 
    const USDCTokenAddr = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
    const cUSDTokenAddr = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
    const tokenUnits = 18;
    
    const amountIn = utils.parseUnits("1", tokenUnits).toString();
    const quoteAmountOut = await mento.getAmountOut(
      cUSDTokenAddr,
      USDCTokenAddr,
      amountIn
    );
    console.log(Number(quoteAmountOut)/ 10 ** 6);
    
  
    // console.log(`You need ${Number(quoteAmountOut)/ 10 ** 6} USDC to buy 1 cUSD.`);
    // console.log(`You will get ${Number(quoteAmountin)/ 10 ** 6} USDC for 1 cUSD.`);
    
}

export async function performing(amount: string) {

  const signer = new Wallet(privateKey, provider);
  const mento = await Mento.create(signer);

  const celoTokenAddr = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
  const cUSDTokenAddr = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  const tokenUnits = 6; // both CELO and cUSD have 18 decimal places

  const amountIn = utils.parseUnits(amount, tokenUnits).toString();
  const quoteAmountOut = await mento.getAmountOut(
    celoTokenAddr,
    cUSDTokenAddr,
    amountIn
  );

  const allowanceTxObj = await mento.increaseTradingAllowance(
    celoTokenAddr,
    amountIn
  );
  const allowanceTx = await signer.sendTransaction(allowanceTxObj);
  const allowanceReceipt = await allowanceTx.wait();
  console.log("tx receipt: ", allowanceReceipt);

  const expectedAmountOut = quoteAmountOut.mul(99).div(100); // allow 1% slippage from quote
  const swapTxObj = await mento.swapIn(
    celoTokenAddr,
    cUSDTokenAddr,
    amountIn,
    expectedAmountOut
  );
  const swapTx = await signer.sendTransaction(swapTxObj);
  const swapTxReceipt = await swapTx.wait();
  
}

 