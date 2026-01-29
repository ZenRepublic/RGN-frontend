import { Fighter } from '@/utils/simulationAssets';
import './ActorDisplay.css';

interface ActorDisplayProps {
  fighter: Fighter;
  fighterId: number;
}

export function ActorDisplay({ fighter, fighterId }: ActorDisplayProps) {
  return (
    <div className="actor-display">
      <img
        src={fighter.imageUrl}
        alt={fighter.name}
        className="actor-display-img"
      />
      <div className="actor-display-info">
        <span className="actor-display-id">Fighter {fighterId}</span>
        <span className="actor-display-name">{fighter.name}</span>
      </div>
    </div>
  );
}
