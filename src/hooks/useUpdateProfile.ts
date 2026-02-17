import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletVerification } from './useWalletAuth';
import type { ActorData } from '@/features/EpisodeForm/ActorInfoForm';
import { updateAccount } from '@/services/account';

export function useUpdateProfile() {
  const { publicKey } = useWallet();
  const { verify } = useWalletVerification();

  return useCallback(async (actorData: ActorData) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    const verificationData = await verify();
    return updateAccount(verificationData.walletAddress, {
      displayName: actorData.name,
      imageBuffer: actorData.imageBuffer || '',
      challengeId: verificationData.challengeId,
      message: verificationData.message,
      signature: verificationData.signature,
    });
  }, [publicKey, verify]);
}
