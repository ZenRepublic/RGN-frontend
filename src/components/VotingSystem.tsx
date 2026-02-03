import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Fighter } from '@/utils/simulationAssets';
import { ActorVoteEntry } from '@/components/ActorVoteEntry';
import './VotingSystem.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

interface VotingSystemProps {
  orderId: string;
  fighters: Fighter[];
  startTime: string;
}

export function VotingSystem({ orderId, fighters, startTime }: VotingSystemProps) {
  const { publicKey, connected } = useWallet();
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [voteCounts, setVoteCounts] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);

  const canVote = new Date(startTime).getTime() > Date.now();

  // Check if the user has already voted on this order and get current vote counts
  useEffect(() => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    const checkVoteStatus = async () => {
      try {
        const params = new URLSearchParams({
          orderId,
          walletAddress: publicKey.toBase58(),
        });
        const response = await fetch(`${API_URL}/rgn/episodes/vote-status?${params}`);
        const data = await response.json();

        console.log(data);

        if (response.ok) {
          if (data.hasVoted) {
            setVotedIndex(data.votedFighterIndex);
          }
          if (data.voteCounts) {
            setVoteCounts(data.voteCounts);
          }
        }
      } catch {
        // If check fails, just let them try to vote — backend will reject duplicates
      } finally {
        setLoading(false);
      }
    };

    checkVoteStatus();
  }, [orderId, publicKey, connected]);

  const handleVote = async (actorIndex: number) => {
    if (!connected || !publicKey) {
      setError('Connect your wallet to vote');
      return;
    }

    setVoting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/rgn/episodes/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          actorIndex,
          walletAddress: publicKey.toBase58(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to cast vote');
        return;
      }

      setVotedIndex(actorIndex);
      if (data.voteCounts) {
        setVoteCounts(data.voteCounts);
      }
    } catch {
      setError('Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="voting-system">
      {fighters.map((fighter, index) => (
        <ActorVoteEntry
          key={index}
          fighter={fighter}
          fighterId={index + 1}
          canVote={canVote && votedIndex === null && !voting}
          votedFor={votedIndex === index}
          voteCount={voteCounts?.[index]}
          onVote={() => handleVote(index)}
        />
      ))}
      {error && <p className="voting-system-error">{error}</p>}
    </div>
  );
}
