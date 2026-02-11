import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletVerification } from '@/hooks/useWalletVerification';
import { useAccount } from '@/context/AccountContext';
import { Actor } from '@/utils/episodeFetcher';
import { ActorVoteEntry } from '@/components/ActorVoteEntry';
import './VotingSystem.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

interface VotingSystemProps {
  orderId: string;
  actors: Actor[];
  startTime: string;
}

export function VotingSystem({ orderId, actors, startTime }: VotingSystemProps) {
  const { publicKey } = useWallet();
  const { verify } = useWalletVerification();
  const { hasAccount } = useAccount();
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [voteCounts, setVoteCounts] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const votingActive = new Date(startTime).getTime() > Date.now();

  // Update countdown timer every second
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const target = new Date(startTime).getTime();
      const remaining = Math.max(0, target - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Auto-clear error after 4 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null);
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [error]);

  // Check if the user has already voted on this order and get current vote counts
  useEffect(() => {
    if (!hasAccount || !publicKey) {
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

        if (response.ok) {
          if (data.hasVoted) {
            setVotedIndex(data.votedActorIndex);
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
  }, [orderId, publicKey, hasAccount]);

  const handleVote = async (actorIndex: number) => {
    if (!hasAccount || !publicKey) {
      setError('Create an account to vote');
      return;
    }

    setVoting(true);
    setError(null);

    try {
      // Get verification data (challenge, sign message, return signature)
      const verificationData = await verify();

      // Cast vote with all verification data
      const response = await fetch(`${API_URL}/rgn/episodes/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          actorIndex,
          ...verificationData,
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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };

  const formatCountdown = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}sec`;
  };

  if (loading) return null;

  return (
    <div className="voting-system">
      {votingActive && (
        <div className="voting-system-header">
          <h2 className="voting-system-title">Support your Favorite!</h2>
          <p className="voting-system-description">
            Make your favorite fighter stronger by giving them your vote. <br></br>If they win, you may win $RGN as well!
          </p>
        </div>
      )}

      {actors.map((actor, index) => (
        <ActorVoteEntry
          key={index}
          actor={actor}
          actorId={index + 1}
          canVote={votingActive && votedIndex === null && !voting}
          votedFor={votedIndex === index}
          showVotes={votedIndex !== null || !votingActive}
          voteCount={voteCounts?.[index]}
          onVote={() => handleVote(index)}
        />
      ))}

      {error && <p className="voting-system-error">{error}</p>}

      {votingActive && timeRemaining > 0 && (
        <div className="voting-countdown">
          <div className="voting-countdown-label">Voting Ends In</div>
          <div className="voting-countdown-timer">{formatCountdown(timeRemaining)}</div>
        </div>
      )}

    </div>
  );
}
