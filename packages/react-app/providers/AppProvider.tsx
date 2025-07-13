'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { celo } from 'wagmi/chains';
import Layout from '../components/Layout';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { PermissionlessProvider } from "@permissionless/wagmi";

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [injectedWallet],
    },
  ],
  {
    appName: 'Celo Composer',
    projectId: process.env.WC_PROJECT_ID ?? '044601f65212332475a09bc14ceb3c34',
  }
);

const config = createConfig({
  
  chains: [celo],
  transports: {
    [celo.id]: http(),
    // [celoAlfajores.id]: http(),
  },
   connectors: [...connectors, miniAppConnector()],
});

const capabilities = {
  paymasterService: {
    [celo.id]: {
        url: '/api/pimlico',
    }
  }
}

const queryClient = new QueryClient();

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
      <PermissionlessProvider
              capabilities={capabilities}
          >
        <RainbowKitProvider>
          <Layout>{children}</Layout>
        </RainbowKitProvider>
        </PermissionlessProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
