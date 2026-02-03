import { Fighter } from '@/utils/simulationAssets';
import './ActorVoteEntry.css';

interface ActorVoteEntryProps {
  fighter: Fighter;
  fighterId: number;
  canVote?: boolean;
  votedFor?: boolean;
  voteCount?: number;
  onVote?: () => void;
}

export function ActorVoteEntry({ fighter, fighterId, canVote, votedFor, voteCount, onVote }: ActorVoteEntryProps) {
  return (
    <div className={`actor-vote-entry${votedFor ? ' actor-vote-entry--voted' : ''}`}>
      <img
        src={fighter.imageUrl}
        alt={fighter.name}
        className="actor-vote-entry-img"
      />
      <div className="actor-vote-entry-info">
        <span className="actor-vote-entry-id">Fighter {fighterId}</span>
        <span className="actor-vote-entry-name">{fighter.name}</span>
      </div>
      {canVote ? (
        <button className="actor-vote-entry-btn" onClick={onVote}>
          Choose
        </button>
      ) : (
        <div className="actor-vote-entry-votes">
          <span className="actor-vote-entry-votes-label">Total Votes</span>
          <span className="actor-vote-entry-votes-count">{voteCount ?? fighter.aura}</span>
        </div>
      )}
    </div>
  );
}
