import { Actor } from '../../utils';
import './ActorVoteEntry.css';

interface ActorVoteEntryProps {
  actor: Actor;
  actorId: number;
  canVote?: boolean;
  votedFor?: boolean;
  showVotes?: boolean;
  voteCount?: number;
  onVote?: () => void;
}

export function ActorVoteEntry({ actor, actorId, canVote, votedFor, showVotes, voteCount, onVote }: ActorVoteEntryProps) {
  return (
    <div className={`actor-vote-entry${votedFor ? ' actor-vote-entry--voted' : ''}`}>
      <img
        src={actor.imageUrl}
        alt={actor.name}
        className="actor-vote-entry-img"
      />
      <div className="actor-vote-entry-info">
        <div className="actor-vote-entry-header">
          <span className="actor-vote-entry-id">Actor {actorId}</span>
          {showVotes && <span className="actor-vote-entry-votes-label">Total Votes</span>}
        </div>
        <div className="actor-vote-entry-footer">
          <span className="actor-vote-entry-name">{actor.name}</span>
          {showVotes && <span className="actor-vote-entry-votes-count">{voteCount ?? actor.votes}</span>}
        </div>
      </div>
      {!showVotes && (
        <button className="actor-vote-entry-btn" onClick={onVote} disabled={!canVote}>
          Select
        </button>
      )}
    </div>
  );
}
