import { StrictMode, useMemo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import App from './App';
import OrderSuccess from './pages/OrderSuccess';

// Standard wallet adapters
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

interface WalletContextProviderProps {
  children: ReactNode;
}

const WalletContextProvider = ({ children }: WalletContextProviderProps) => {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // Note: Do NOT add SolanaMobileWalletAdapter manually here anymore
      // Newer @solana/wallet-adapter-react versions (>= 0.15.21) bundle MWA automatically
      // on compatible mobile environments (like Saga)
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Clear cached wallet selection so users always see "Select Wallet" modal
localStorage.removeItem('walletName');

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
  </StrictMode>
);