import { Actor } from '../../utils';

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
    <div className={`vote-card${votedFor ? ' vote-card--voted' : ''}`}>
      <div className='flex gap-lg'>
        <img
        src={actor.imageUrl}
        alt={actor.name}
        className="w-[100px] h-[100px] rounded-lg"
        />
        <div className="w-full">
          <div className="flex justify-between">
            <label>ACTOR {actorId}</label>
            {showVotes && <label>TOTAL VOTES</label>}
          </div>
          <div className="flex justify-between items-center">
            <span className="title">{actor.name}</span>
            {showVotes ? (
              <span className="vote-number">{voteCount ?? actor.votes}</span>
            ) : (
              <button className="special-small" onClick={onVote} disabled={!canVote}>
                Select
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
