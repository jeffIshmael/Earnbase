import { getWalletClient, getAccount } from "@wagmi/core";
import { config } from "../providers/AppProvider";



export async function getSigner(){
    const walletClient = await getWalletClient(config);
    return walletClient;
}