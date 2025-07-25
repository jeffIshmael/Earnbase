// process to swap
// 1. get the pairs
// 2. get the quote 
// 3. approve the sending/ swapping
// 4. swap
// I'll do this according to the app.mento.org
import { Mento, TradablePair } from "@mento-protocol/mento-sdk";
import { ethers, providers } from "ethers";
import { cUSDAddress, USDCAddress } from "@/contexts/constants";
import { parseInputExchangeAmount, calcExchangeRate, invertExchangeRate } from "@/utils/SwapUtils";
import { fromWei } from "@/utils/amount";
import { parseUnits } from "ethers/lib/utils";
import { getEthersSigner } from "./WagmiEthers";
import { config } from "@/providers/AppProvider";


const provider = new providers.JsonRpcProvider("https://forno.celo.org");

// function tio get the trading pairs
export async function theTradingPairs(){
  try {
    const mento = await Mento.create(provider);
    const thePairs = await mento.getTradablePairs();
    return thePairs;
  } catch (error) {
    console.log("the errors", error);
    return null; 
  }
}

// function to get quote according to app.mento.org (cUSD to USDC)
export async function getTheQuote(amount: string, swapIn: Boolean) {
  try {
    const mento = await Mento.create(provider);
    const fromTokenAddr = swapIn ? cUSDAddress : USDCAddress;
    const toTokenAddr = swapIn ? USDCAddress : cUSDAddress;
    const amountWei = swapIn ? parseInputExchangeAmount(amount, 18): parseUnits(amount || "0", 6).toString();
    
    if (!amountWei || isNaN(Number(amountWei))) {
      throw new Error("Invalid amount input");
    }

    const amountWeiBN = ethers.BigNumber.from(amountWei);
    const amountDecimals = swapIn ? 18 : 6;
    const quoteDecimals = swapIn ? 6 : 18;

    console.log("amount", amount);
    console.log("amountWei", amountWei);
    console.log("amountWeiBN", amountWeiBN.toString());

    const tradablePair = await mento.findPairForTokens(fromTokenAddr, toTokenAddr);

    if (!tradablePair) {
      throw new Error("Tradable pair not found");
    }

    // swapping from cUSD to USDC
    const quoteWei = (
      await mento.getAmountOut(fromTokenAddr, toTokenAddr, amountWeiBN, tradablePair)
    ).toString();
    

    if (!quoteWei) {
      throw new Error("Failed to get quote amount");
    }
    const quote = fromWei(quoteWei, quoteDecimals);
    const rateIn = calcExchangeRate(amountWei, amountDecimals, quoteWei, quoteDecimals);
    const rate = swapIn ? rateIn : invertExchangeRate(rateIn);

    return {
      amountWei,
      quoteWei,
      quote,
      rate,
      tradablePair
    };

  } catch (error) {
    console.error("❌ Error in getTheQuote:", error);
    return null;
  }
}

// function to approve a swap
export async function approveSwap(fromTokenAddr: string, amountWei: string) {
  try {
    const mento = await Mento.create(provider);
    const signer = await getEthersSigner(config);

    const allowanceTxObj = await mento.increaseTradingAllowance(fromTokenAddr, amountWei);
    const allowanceTx = await signer.sendTransaction(allowanceTxObj);
    const allowanceReceipt = await allowanceTx.wait();

    console.log("✅ Approved. Tx hash:", allowanceReceipt.transactionHash);
    return allowanceReceipt;
  } catch (error) {
    console.error("❌ Error in approveSwap:", error);
    throw error;
  }
}


// function to trigger the swap
export async function executeSwap(
  fromTokenAddr: string,
  toTokenAddr: string,
  amountWei: string,
  quoteWei: string,
  tradablePair: TradablePair,
  swapIn: boolean
) {
  try {
    const mento = await Mento.create(provider);
    const signer = await getEthersSigner(config);

    const swapFn =  mento.swapIn.bind(mento);

    const txRequest = await swapFn(fromTokenAddr, toTokenAddr, amountWei, quoteWei, tradablePair);
    const txResponse = await signer.sendTransaction(txRequest);
    const receipt = await txResponse.wait();

    console.log("✅ Swapped. Tx hash:", receipt.transactionHash);
    return receipt;
  } catch (error) {
    console.error("❌ Error in executeSwap:", error);
    throw error;
  }
}


