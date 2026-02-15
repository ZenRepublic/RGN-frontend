import { useState, useEffect } from 'react';
import { getAccountVotePower, VotePowerData } from '@/services/account';

export function useAccountVotePower(accountId: string | null | undefined) {
  const [votePower, setVotePower] = useState<VotePowerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setVotePower(null);
      setError(null);
      return;
    }

    const fetchVotePower = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAccountVotePower(accountId);
        setVotePower(data);
      } catch (err) {
        console.error('Error fetching vote power:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vote power');
      } finally {
        setLoading(false);
      }
    };

    fetchVotePower();
  }, [accountId]);

  return { votePower, loading, error };
}
