import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from '@/context/AccountContext';
import { useToast } from '@/context/ToastContext';
import { Actor } from '../../utils';
import { ActorVoteEntry } from '@/features/Voting/ActorVoteEntry';
import { CountdownTimer } from '../../primitives';
import { useCheckVoteStatus, useHandleVote } from '@/hooks/useEpisodeVoting';

interface VotingSystemProps {
  orderId: string;
  actors: Actor[];
  startTime: string;
}

export function VotingSystem({ orderId, actors, startTime }: VotingSystemProps) {
  const { publicKey } = useWallet();
  const { hasAccount } = useAccount();
  const { showToast } = useToast();
  const checkVoteStatusFn = useCheckVoteStatus();
  const handleVoteFn = useHandleVote();

  const [voting, setVoting] = useState(false);
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [voteCounts, setVoteCounts] = useState<number[]>(() => actors.map(a => a.votes));

  const votingActive = new Date(startTime).getTime() > Date.now();

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
      showToast('Create an account to vote');
      return;
    }

    setVoting(true);

    try {
      const result = await handleVoteFn(orderId, actorIndex);

      if (!result.success) {
        showToast(result.error || 'Failed to cast vote');
        return;
      }

      setVotedIndex(actorIndex);
      setVoteCounts(prev => prev.map((v, i) => i === actorIndex ? v + (result.votePower ?? 0) : v));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };


  return (
    <div className="flex flex-col gap-sm">
      {votingActive && (
        <div className="flex flex-col mb-xl">
          <h2 className="text-center mb-xl">Support your Favorite!</h2>
          <p className="text-center mb-lg">Make your favorite fighter stronger by giving them your vote.</p>
          <p className="text-center">If they win, you may win $RGN as well!</p>
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

      {votingActive && <CountdownTimer startTime={startTime} />}

    </div>
  );
}
