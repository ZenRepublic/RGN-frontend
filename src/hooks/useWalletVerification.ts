import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface VerificationData {
  walletAddress: string;
  challengeId: string;
  message: string;
  signature: string;
}

export function useWalletVerification() {
  const { publicKey, signMessage } = useWallet();

  const verify = useCallback(async (): Promise<VerificationData> => {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected or does not support message signing');
    }

    const walletAddress = publicKey.toBase58();

    // Step 1: Get challenge from server
    const challengeRes = await fetch(`${API_URL}/verification/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });

    if (!challengeRes.ok) {
      const error = await challengeRes.json();
      throw new Error(error.error || 'Failed to get challenge');
    }

    const { message, challengeId } = await challengeRes.json();

    // Step 2: Sign the message with wallet
    const messageBuffer = Buffer.from(message, 'utf-8');
    const signatureBuffer = await signMessage(messageBuffer);
    const signature = bs58.encode(signatureBuffer);

    return {
      walletAddress,
      challengeId,
      message,
      signature,
    };
  }, [publicKey, signMessage]);

  return { verify };
}
