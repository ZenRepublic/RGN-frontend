import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletVerification } from './useWalletAuth';
import { Account } from '@/context/AccountContext';
import { registerAccount } from '@/services/account';

export interface RegistrationStep {
  status: 'idle' | 'getting-challenge' | 'signing' | 'registering' | 'success' | 'error';
  error?: string;
  account?: Account | null;
}

export function useWalletRegistration() {
  const { publicKey } = useWallet();
  const { verify } = useWalletVerification();
  const [step, setStep] = useState<RegistrationStep>({ status: 'idle' });

  const register = useCallback(async () => {
    if (!publicKey) {
      setStep({
        status: 'error',
        error: 'Wallet not connected',
      });
      return;
    }

    try {
      // Step 1 & 2: Get challenge and sign message
      setStep({ status: 'getting-challenge' });
      const verificationData = await verify();
      setStep({ status: 'signing' });

      // Step 3: Register account with verification data
      setStep({ status: 'registering' });
      const account = await registerAccount(verificationData);
      setStep({ status: 'success', account });
    } catch (error) {
      console.error('Registration error:', error);
      setStep({
        status: 'error',
        error: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }, [publicKey, verify]);

  const reset = useCallback(() => {
    setStep({ status: 'idle' });
  }, []);

  return { register, reset, step };
}
