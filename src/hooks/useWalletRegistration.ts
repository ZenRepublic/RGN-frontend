import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletVerification } from './useWalletAuth';
import { registerAccount } from '@/services/account';

export function useWalletRegistration() {
  const { publicKey } = useWallet();
  const { verify } = useWalletVerification();

  return useCallback(async () => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    const verificationData = await verify();
    return registerAccount(verificationData);
  }, [publicKey, verify]);
}
