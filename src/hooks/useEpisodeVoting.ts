import { useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWalletVerification, VerificationData } from '@/hooks/useWalletAuth';
import { checkVoteStatus, castVote } from '@/services/episodeVoting';

// ============================================================================
// Custom React Hooks for VotingSystem
// ============================================================================

/**
 * Hook for checking vote status
 * Requires publicKey to be available
 */
export function useCheckVoteStatus() {
  return useCallback(async (orderId: string, publicKey: PublicKey | null) => {
    if (!publicKey) {
      return null;
    }
    return checkVoteStatus(orderId, publicKey.toBase58());
  }, []);
}

/**
 * Hook for casting a vote with integrated wallet verification
 */
export function useHandleVote() {
  const { verify } = useWalletVerification();

  return useCallback(
    async (orderId: string, actorIndex: number) => {
      const verificationData = await verify();
      return castVote(orderId, actorIndex, verificationData);
    },
    [verify]
  );
}
