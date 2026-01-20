import { StrictMode, useMemo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'

import './index.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import App from './App'

// Mobile adapter imports – make sure these are correct
import {
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,               // ← Add this!
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler,
} from '@solana-mobile/wallet-adapter-mobile'

interface WalletContextProviderProps {
  children: ReactNode
}

function WalletContextProvider({ children }: WalletContextProviderProps) {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), [])

  const wallets = useMemo(
    () => [
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),  // ← REQUIRED: fixes your error
        appIdentity: {
          name: 'Ruby Global Network',           // Change to your real app name
          uri: "https://www.rgn.cool",     // Good for dev; use full https://yourdomain.com in prod
          icon: '/logo.png',               // Ensure public/icon.png exists (512x512 PNG recommended)
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
        cluster: WalletAdapterNetwork.Devnet,  // Matches your endpoint
      }),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletContextProvider>
      <App />
    </WalletContextProvider>
  </StrictMode>,
)