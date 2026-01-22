import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export function WalletGuard() {
  const {
    wallet,
    connected,
    disconnect,
    publicKey,
  } = useWallet();

  const lastPublicKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // No wallet selected
    if (!wallet) {
      lastPublicKeyRef.current = null;
      return;
    }

    // Wallet selected but not connected → invalid state
    if (!connected) {
      wallet.adapter.disconnect?.();
      lastPublicKeyRef.current = null;
      return;
    }

    // Connected but no public key → invalid
    if (!publicKey) {
      disconnect();
      lastPublicKeyRef.current = null;
      return;
    }

    const currentPk = publicKey.toBase58();

    // Detect account switch without reauthorization (MWA edge case)
    if (
      lastPublicKeyRef.current &&
      lastPublicKeyRef.current !== currentPk
    ) {
      // Force full deauthorization
      wallet.adapter.disconnect?.();
      disconnect();
      lastPublicKeyRef.current = null;
      return;
    }

    // Record stable key
    lastPublicKeyRef.current = currentPk;
  }, [wallet, connected, publicKey, disconnect]);

  return null;
}