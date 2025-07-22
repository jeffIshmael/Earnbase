import { getWalletClient, getAccount } from "@wagmi/core";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { config } from "../providers/AppProvider";
import { encodeFunctionData } from "viem";
import {
  contractAbi,
  contractAddress
} from "../contexts/constants";


export const registrationTx = async (functionName, args) => {
  try {
    const walletClient = await getWalletClient(config);
    const account = getAccount(config);

    const functionData = encodeFunctionData({
      abi: contractAbi,
      functionName,
      args,
    });

    const dataSuffix = getDataSuffix({
      consumer: "0x4821ced48Fb4456055c86E42587f61c1F39c6315",
      providers: [
        "0x0423189886d7966f0dd7e7d256898daeee625dca",
        "0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8",
        "0x6226dde08402642964f9a6de844ea3116f0dfc7e",
      ],
    });

    const fullData = functionData + dataSuffix.replace(/^0x/, "");

    const txHash = await walletClient.sendTransaction({
      account: account.address,
      to: contractAddress,
      data: fullData, // already includes '0x'
      value: 0n, // assuming registerChama is nonpayable
    });

    const chainId = await walletClient.getChainId();

    await submitReferral({
      txHash,
      chainId,
    });

    return txHash;
  } catch (error) {
    console.error("Divvi registration error:", error);
    return null;
  }
};