import { parseEther } from 'viem'; // use to safely convert from string to wei
import { getAgentSmartAccount } from "../Pimlico";
import { http, createPublicClient, formatEther } from 'viem';
import { celo } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(),
});

export async function sendCelo(address: string) {
  try {

    const { account, smartAccountClient } = await getAgentSmartAccount();

    console.log("Smart account address:", account.address);

    const celoBalance = await publicClient.getBalance({
      address: address,
    });

    console.log("CELO Balance:", formatEther(celoBalance));

    const valueToSend = parseEther('0.3'); // 0.5 CELO => BigInt

    // const hash = await smartAccountClient.sendTransaction({
    //     to: address,
    //     value: valueToSend,
    //   });

    //   console.log(`Sent 0.3 CELO to ${address} | Tx Hash: ${hash}`);

    // for (const address of addresses) {
    //   // const hash = await smartAccountClient.sendTransaction({
    //   //   to: address,
    //   //   value: valueToSend,
    //   // });

    //   console.log(`Sent 0.5 CELO to ${address} | Tx Hash:`);
    // }

    const updatedBalance = await publicClient.getBalance({ address: account.address });
    console.log("Updated CELO Balance:", formatEther(updatedBalance));

  } catch (error) {
    console.error("Error sending CELO:", error);
  }
}
