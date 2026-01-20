import { useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

export const useInAppWalletBrowser = () => {
  const { wallet, connected } = useWallet();

  return useMemo(() => {
    if (!connected || !wallet) return false;

    const adapterName = wallet.adapter.name.toLowerCase();

    // Known wallet names from the adapters you're using
    const isPhantom = adapterName === 'phantom';
    const isSolflare = adapterName === 'solflare';

    // Brave usually shows up as "Brave" or via Phantom compat, but we can exclude it
    const isBrave = adapterName.includes('brave') || 
                    (isPhantom && navigator.brave?.isBrave?.());

    // In-app browser detection (Phantom/Solflare mobile in-app view)
    // These often run in a WebView-like environment with specific UA patterns
    const ua = navigator.userAgent.toLowerCase();
    const isMobileLike = /iphone|ipad|ipod|android/.test(ua);
    const isWebViewLike = 
      ua.includes('wv') ||                    // Android WebView
      (isMobileLike && ua.includes('version/') && !ua.includes('chrome')) || // iOS in-app Safari-like
      ua.includes('phantom') || ua.includes('solflare') || // some in-app add hints
      !window.chrome;                         // missing chrome object often in embedded browsers

    // Main logic:
    // - Connected via Phantom or Solflare
    // - Not Brave
    // - Looks like mobile in-app / WebView (not desktop extension)
    return (isPhantom || isSolflare) && !isBrave && (isMobileLike && isWebViewLike);
  }, [wallet, connected]);
};