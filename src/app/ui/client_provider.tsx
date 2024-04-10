"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' 
import { wagmiConfig, WALLETCONNECT_PROJECT_ID } from "./config";
import { createWeb3Modal } from "@web3modal/wagmi";

const queryClient = new QueryClient() 

createWeb3Modal({
  wagmiConfig: wagmiConfig,
  projectId: WALLETCONNECT_PROJECT_ID,
  enableOnramp: true
})

export function ClientProvider({ children }: {
  children: React.ReactNode
}) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}