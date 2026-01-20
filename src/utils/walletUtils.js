import { useMemo } from 'react';

export const useIsInAppWalletBrowser = () => {
  return useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();

    // 1. Must look like a mobile device
    const isMobile = /iphone|ipad|ipod|android/.test(ua);

    if (!isMobile) return false;

    // 2. WebView / in-app browser signals
    const isWebView =
      ua.includes('wv') ||                             // Android WebView marker
      (ua.includes('version/') && !ua.includes('chrome') && !ua.includes('crios')) || // iOS in-app (missing Chrome/Safari full indicators)
      !('chrome' in window) ||                         // Many in-app browsers miss window.chrome
      ua.includes('phantom') ||                        // sometimes added by Phantom
      ua.includes('solflare');                         // sometimes added by Solflare

    if (!isWebView) return false;

    // 3. Phantom or Solflare provider is injected (most reliable signal when inside their in-app browser)
    const hasPhantom = !!(window).phantom?.solana;
    const hasSolflare = !!(window).solflare;

    // Optional: exclude Brave (Brave can mimic Phantom sometimes)
    const isBrave = (navigator).brave?.isBrave?.() === true ||
                    ua.includes('brave');

    return (hasPhantom || hasSolflare) && !isBrave;
  }, []); // empty deps = runs once + cheap
};