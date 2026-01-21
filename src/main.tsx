import { StrictMode, useMemo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'

import './index.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import App from './App'
import OrderSuccess from './pages/OrderSuccess'

// Standard wallet adapters - these handle deep linking on mobile browsers
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'

// Mobile adapter imports for MWA (Solana Mobile Wallet Adapter protocol)
import {
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,
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
      // Standard adapters - handle deep linking on mobile browsers
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // MWA adapter - for Solana Mobile devices (Saga, etc.)
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: 'Ruby Global Network',
          uri: "https://www.rgn.cool",
          icon: '/logo.png',
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
        cluster: WalletAdapterNetwork.Devnet,
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
    <BrowserRouter>
      <WalletContextProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/order-success" element={<OrderSuccess />} />
        </Routes>
      </WalletContextProvider>
    </BrowserRouter>
  </StrictMode>,
)