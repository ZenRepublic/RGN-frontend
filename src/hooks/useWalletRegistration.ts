import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletVerification } from './useWalletVerification';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface RegistrationStep {
  status: 'idle' | 'getting-challenge' | 'signing' | 'registering' | 'success' | 'error';
  error?: string;
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
      const registerRes = await fetch(`${API_URL}/rgn/account/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData),
      });

      if (!registerRes.ok) {
        const error = await registerRes.json();
        throw new Error(error.error || 'Failed to register account');
      }

      setStep({ status: 'success' });
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
