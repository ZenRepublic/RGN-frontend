import { Buffer } from 'buffer';
window.Buffer = Buffer;

import { StrictMode, ReactNode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';

import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

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
import EpisodeView from './pages/EpisodeView';
import AccountView from './pages/AccountView';
import RegistrationView from './pages/RegistrationView';
import DioDudesOrderForm from './channels/DioDudesOrderForm';
import { SOLANA_CHAIN, HELIUS_RPC_URL } from './config/network';
import { AccountProvider } from './context/AccountContext';

import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';

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
    icon: '/Branding/logo.png', // must exist in /public
  },
  authorizationCache: createDefaultAuthorizationCache(),
  chains: [SOLANA_CHAIN],
  chainSelector: createDefaultChainSelector(),
  onWalletNotFound: createDefaultWalletNotFoundHandler(),
});

interface WalletContextProviderProps {
  children: ReactNode;
}

function WalletContextProvider({ children }: WalletContextProviderProps) {
  const endpoint = HELIUS_RPC_URL;

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
        <AccountProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/episode/:orderId" element={<EpisodeView />} />
            <Route path="/account" element={<AccountView />} />
            <Route path="/registration" element={<RegistrationView />} />
            <Route path="/diodudes/order" element={<DioDudesOrderForm />} />
          </Routes>
        </AccountProvider>
      </WalletContextProvider>
    </BrowserRouter>
  </StrictMode>
);