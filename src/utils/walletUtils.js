import { useMemo } from 'react';

// ────────────────────────────────────────────────
// Internal helper – not exported
// ────────────────────────────────────────────────
const isMobileDevice = () => {
  const ua = navigator.userAgent.toLowerCase();

  // Classic mobile UA patterns (still the most reliable quick check in 2026)
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

  const fromUA = mobileRegex.test(ua);

  // Optional extra hints (helps catch edge cases without hurting perf)
  const hasTouch = 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0;
  const isCoarsePointer = window.matchMedia?.('(pointer:coarse)').matches ?? false;

  return fromUA || (hasTouch && isCoarsePointer);
};

// ────────────────────────────────────────────────
// Exported: simple mobile check (can be used anywhere)
// ────────────────────────────────────────────────
export const useIsMobile = () => {
  return useMemo(() => isMobileDevice(), []);
};

// ────────────────────────────────────────────────
// Exported: detects Phantom / Solflare mobile in-app browser
// Only true if BOTH mobile + in-app/WebView signals
// ────────────────────────────────────────────────
export const useIsInAppWalletBrowser = () => {
  return useMemo(() => {
    if (!isMobileDevice()) return false;

    const ua = navigator.userAgent.toLowerCase();

    // WebView / in-app browser fingerprints
    const isWebViewLike =
      ua.includes('wv') ||                             // Android WebView
      (ua.includes('version/') &&                      // iOS in-app browsers often have "Version/"
        !ua.includes('safari') &&                      // real Safari usually has it
        !ua.includes('chrome') &&
        !ua.includes('crios')) ||
      !('chrome' in window) ||                         // many in-app views lack window.chrome
      ua.includes('phantom') ||                        // sometimes injected in UA
      ua.includes('solflare');

    if (!isWebViewLike) return false;

    // Strongest signal: wallet provider injected early in their own in-app browser
    const hasPhantom = !!(window).phantom?.solana;
    const hasSolflare = !!(window).solflare;

    // Exclude Brave (it sometimes mimics Phantom injection)
    const isBrave =
      (navigator).brave?.isBrave?.() === true ||
      ua.includes('brave');

    return (hasPhantom || hasSolflare) && !isBrave;
  }, []);
};