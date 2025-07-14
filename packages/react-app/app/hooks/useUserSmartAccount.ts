// hooks/useUserSmartAccount.ts
'use client';

import { createSmartAccountClient} from 'permissionless';
import { toSimpleSmartAccount } from "permissionless/accounts"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import { http, createWalletClient, custom } from 'viem';
import { celo } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';
import { useEffect, useState } from 'react';
import { getPimlicoUrl } from '@/lib/Pimlico'; 

export function useUserSmartAccount() {
  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [smartAccountClient, setSmartAccountClient] = useState<any>(null);
  const [address, setAddress] = useState<`0x${string}` | null>(null);

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined' || !(window as any).ethereum) return;

      const ethereum = (window as any).ethereum;
      const pimlicoUrl = await getPimlicoUrl();

      const pimlicoClient = createPimlicoClient({
        transport: http(`${pimlicoUrl}`),
        entryPoint: {
          address: entryPoint07Address,
          version: '0.7',
        },
      });

      const walletClient = createWalletClient({
        chain: celo,
        transport: custom(ethereum),
        account: ethereum.selectedAddress as `0x${string}`,
      });

      const account = await toSimpleSmartAccount({
        owner: walletClient,
        client: walletClient,
        entryPoint: {
          address: entryPoint07Address,
          version: '0.7',
        },
      });

     

      const client = createSmartAccountClient({
        account,
        chain: celo,
        bundlerTransport: http(`${pimlicoUrl}`),
        paymaster: pimlicoClient,
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await pimlicoClient.getUserOperationGasPrice()).fast;
          },
        },
      });

      setSmartAccount(account);
      setSmartAccountClient(client);
      setAddress(account.address);
    };

    init();
  }, []);

  return { smartAccount, smartAccountClient };
}
