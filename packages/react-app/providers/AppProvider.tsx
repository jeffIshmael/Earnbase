'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { celo } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { PermissionlessProvider } from '@permissionless/wagmi';

import Layout from '../components/Layout';



const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [injectedWallet],
    },
  ],
  {
    appName: 'Celo Composer',
    projectId:
      process.env.NEXT_PUBLIC_WC_PROJECT_ID ??
      '044601f65212332475a09bc14ceb3c34',
  }
);

export const wagmiConfig = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http(),
  },
  connectors: [
    ...connectors,
    farcasterMiniApp(),
  ],
});

const capabilities = {
  paymasterService: {
    [celo.id]: {
      url: '/api/pimlico',
    },
  },
};

const queryClient = new QueryClient();

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <PermissionlessProvider capabilities={capabilities}>
          <RainbowKitProvider>
            <Layout>{children}</Layout>
          </RainbowKitProvider>
        </PermissionlessProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
