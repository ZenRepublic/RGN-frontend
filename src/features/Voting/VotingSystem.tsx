import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from '@/context/AccountContext';
import { Actor } from '../../utils';
import { ActorVoteEntry } from '@/features/Voting/ActorVoteEntry';
import { CountdownTimer } from '../../primitives';
import { useCheckVoteStatus, useHandleVote } from '@/hooks/useEpisodeVoting';
import './VotingSystem.css';

interface VotingSystemProps {
  orderId: string;
  actors: Actor[];
  startTime: string;
}

export function VotingSystem({ orderId, actors, startTime }: VotingSystemProps) {
  const { publicKey } = useWallet();
  const { hasAccount } = useAccount();
  const checkVoteStatusFn = useCheckVoteStatus();
  const handleVoteFn = useHandleVote();

  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [voteCounts, setVoteCounts] = useState<number[]>(() => actors.map(a => a.votes));

  const votingActive = new Date(startTime).getTime() > Date.now();

  // Auto-clear error after 4 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null);
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [error]);

  // Check if the user has already voted on this order
  useEffect(() => {
    if (!hasAccount || !publicKey) {
      return;
    }

    const checkUserVote = async () => {
      const result = await checkVoteStatusFn(orderId, publicKey);
      if (result?.hasVoted) {
        setVotedIndex(result.votedActorIndex ?? null);
      }
    };

    checkUserVote();
  }, [orderId, publicKey, hasAccount, checkVoteStatusFn]);

  const handleVote = async (actorIndex: number) => {
    if (!hasAccount || !publicKey) {
      setError('Create an account to vote');
      return;
    }

    setVoting(true);
    setError(null);

    try {
      const result = await handleVoteFn(orderId, actorIndex);

      if (!result.success) {
        setError(result.error || 'Failed to cast vote');
        return;
      }

      setVotedIndex(actorIndex);
      setVoteCounts(prev => prev.map((v, i) => i === actorIndex ? v + (result.votePower ?? 0) : v));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };


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
          voteCount={voteCounts[index]}
          onVote={() => handleVote(index)}
        />
      ))}

      {error && <p className="voting-system-error">{error}</p>}

      {votingActive && <CountdownTimer startTime={startTime} />}

    </div>
  );
}
