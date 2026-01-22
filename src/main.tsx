import { StrictMode, ReactNode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';

import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

import {
  registerMwa,
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
} from '@solana-mobile/wallet-standard-mobile';

// Desktop wallet adapters (optional enhancers)
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import App from './App';
import OrderSuccess from './pages/OrderSuccess';

import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { WalletGuard } from '@/wallet/walletGuard';

/**
 * ---------------------------------------------------------
 * MWA + Wallet Standard registration
 * ---------------------------------------------------------
 * This MUST run once, before React renders.
 */
registerMwa({
  appIdentity: {
    name: 'Ruby Global Network',
    uri: window.location.origin,
    icon: '/logo.png', // must exist in /public
  },
  authorizationCache: createDefaultAuthorizationCache(),
  chains: ['solana:devnet'],
  chainSelector: createDefaultChainSelector(),
  onWalletNotFound: createDefaultWalletNotFoundHandler(),
});

interface WalletContextProviderProps {
  children: ReactNode;
}

function WalletContextProvider({ children }: WalletContextProviderProps) {
  /**
   * Mainnet endpoint
   * You may replace with a private RPC later.
   */
  const endpoint = useMemo(
    () => clusterApiUrl('devnet'),
    []
  );

  /**
   * Desktop adapters only.
   * Wallet Standard + MWA wallets are injected automatically.
   */
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          {/* <WalletGuard /> */}
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

/**
 * ---------------------------------------------------------
 * App bootstrap
 * ---------------------------------------------------------
 */

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container missing in index.html');
}

createRoot(container).render(
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