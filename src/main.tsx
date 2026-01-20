import { StrictMode, useMemo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import './index.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import App from './App'

interface WalletContextProviderProps {
  children: ReactNode
}

function WalletContextProvider({ children }: WalletContextProviderProps) {
  // Use devnet for testing, mainnet-beta for production
  const endpoint = useMemo(() => clusterApiUrl('devnet'), [])

  // Wallets auto-register via Wallet Standard - no explicit adapters needed
  const wallets = useMemo(() => [], [])

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
