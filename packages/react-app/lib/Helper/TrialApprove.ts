import { getConnectorClient, getAccount } from '@wagmi/core'
import { Mento } from '@mento-protocol/mento-sdk'
import { config } from '@/providers/AppProvider' // Adjust if needed
import { getEthersSigner } from '../WagmiEthers'

export async function approveSwap(fromTokenAddr: string, amountWei: string) {
  try {
    const signer = await getEthersSigner(config)

    const mento = await Mento.create(signer)

    const tx = await mento.increaseTradingAllowance(fromTokenAddr, amountWei)

    const txResponse = await signer.sendTransaction(tx)
    const receipt = await txResponse.wait()

    console.log("✅ Approved. Tx hash:", receipt.transactionHash)
    return receipt
  } catch (error) {
    console.error("❌ Error in approveSwap:", error)
    throw error
  }
}
