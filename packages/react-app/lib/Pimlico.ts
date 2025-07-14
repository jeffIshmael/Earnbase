// this file will export the agent wallet as a smartAccount client so as to sponsor the gas.
'use server'
import { celo } from "viem/chains";
// import { agentPrivatekey } from "@/contexts/EnvtVariables";
import { toSafeSmartAccount } from "permissionless/accounts"
import { Hex, createPublicClient,  http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import {  entryPoint07Address } from "viem/account-abstraction"
import { createSmartAccountClient } from "permissionless"
// import { pimlicoApiKey, agentPrivateKey } from "@/contexts/EnvtVariables";
import dotenv from 'dotenv';
dotenv.config();

if(!process.env.AGENT_PRIVATE_KEY || !process.env.PIMLICO_API_KEY){
	throw Error("Either agent private key or pimlico apikey not set.")
}


// // Create the public client
const publicClient = createPublicClient({
  chain: celo,
  transport: http(),
});

// // Pimlico client setup
const pimlicoUrl = `https://api.pimlico.io/v2/42220/rpc?apikey=${process.env.PIMLICO_API_KEY}`;

const pimlicoClient = createPimlicoClient({
  transport: http(pimlicoUrl),
  entryPoint: {
    address: entryPoint07Address,
    version: "0.7",
  },
});
// function to export smartaccount, smartAccount client of the agent wallet
export async function getAgentSmartAccount() {
	// the smart account
	const account = await toSafeSmartAccount({
		client: publicClient,
		owners: [privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`)],
		entryPoint: {
			address: entryPoint07Address,
			version: "0.7",
		}, // global entrypoint
		version: "1.4.1",
	})

	console.log(`The smart account of the agent has the wallet address ${account.address}`);

	// create the smart account client
	const smartAccountClient = createSmartAccountClient({
		account,
		chain: celo,
		bundlerTransport: http(pimlicoUrl),
		paymaster: pimlicoClient,
		userOperation: {
			estimateFeesPerGas: async () => {
				return (await pimlicoClient.getUserOperationGasPrice()).fast
			},
		},
	})

	return {account, smartAccountClient}
	
}



export async function getPimlicoUrl() {

  if ( !pimlicoUrl) throw new Error("PIMLICO_API_KEY is not set");

  return pimlicoUrl;
}


