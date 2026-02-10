import { Actor } from '@/utils/episodeFetcher';
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
        <span className="actor-vote-entry-id">Actor {actorId}</span>
        <span className="actor-vote-entry-name">{actor.name}</span>
      </div>
      {showVotes ? (
        <div className="actor-vote-entry-votes">
          <span className="actor-vote-entry-votes-label">Total Votes</span>
          <span className="actor-vote-entry-votes-count">{voteCount ?? actor.votes}</span>
        </div>
      ) : (
        <button className="actor-vote-entry-btn" onClick={onVote} disabled={!canVote}>
          Choose
        </button>
      )}
    </div>
  );
}
