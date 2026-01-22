import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getConnectedPublicKey } from '@/wallet/wallet'; // adjust path to your wallet.ts
import { useMemo } from 'react';

export function useUnifiedWallet() {
  const walletAdapter = useWallet();
  const customPubkey = getConnectedPublicKey();

  if (walletAdapter.connected && walletAdapter.publicKey) {
    return { connected: walletAdapter.connected, publicKey: walletAdapter.publicKey };
  }

  if (customPubkey) {
    return { connected: true, publicKey: customPubkey };
  }

  return { connected: false, publicKey: null };
}