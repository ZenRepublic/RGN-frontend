import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { getVerificationChallenge } from '@/services/walletAuth';

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
    const { message, challengeId } = await getVerificationChallenge(walletAddress);

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
