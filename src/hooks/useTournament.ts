import { useCallback } from 'react';
import { useWalletVerification } from '@/hooks/useWalletAuth';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { joinTournament } from '@/services/tournament';

/**
 * Hook for joining a tournament with integrated wallet verification
 */
export function useJoinTournament() {
  const { verify } = useWalletVerification();
  const { account } = useAccountStatus();

  return useCallback(
    async (tournamentId: string) => {
      if (!account) throw new Error('You must be logged in to register for a tournament');
      const verificationData = await verify();
      return joinTournament(tournamentId, account._id, verificationData);
    },
    [verify, account]
  );
}
