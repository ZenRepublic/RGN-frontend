import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletVerification } from './useWalletAuth';
import type { Account } from '@/context/AccountContext';
import type { ActorData } from '@/components/ActorInfoForm';
import { updateAccount } from '@/services/account';

export interface UpdateProfileStep {
  status: 'idle' | 'getting-challenge' | 'signing' | 'updating' | 'success' | 'error';
  error?: string;
  account?: Account | null;
}

export function useUpdateProfile() {
  const { publicKey } = useWallet();
  const { verify } = useWalletVerification();
  const [step, setStep] = useState<UpdateProfileStep>({ status: 'idle' });

  const update = useCallback(async (actorData: ActorData) => {
    if (!publicKey) {
      setStep({ status: 'error', error: 'Wallet not connected' });
      return;
    }

    try {
      setStep({ status: 'getting-challenge' });
      const verificationData = await verify();

      setStep({ status: 'signing' });

      setStep({ status: 'updating' });
      const account = await updateAccount(verificationData.walletAddress, {
        displayName: actorData.name,
        imageBuffer: actorData.imageBuffer || '',
        challengeId: verificationData.challengeId,
        message: verificationData.message,
        signature: verificationData.signature,
      });
      setStep({ status: 'success', account });
    } catch (error) {
      console.error('Update profile error:', error);
      setStep({
        status: 'error',
        error: error instanceof Error ? error.message : 'Update failed',
      });
    }
  }, [publicKey, verify]);

  const reset = useCallback(() => {
    setStep({ status: 'idle' });
  }, []);

  return { update, reset, step };
}
