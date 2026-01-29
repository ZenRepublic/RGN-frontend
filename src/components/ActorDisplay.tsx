import { Fighter } from '@/utils/simulationAssets';
import './ActorDisplay.css';

interface ActorDisplayProps {
  fighter: Fighter;
  fighterId: number;
}

export function ActorDisplay({ fighter, fighterId }: ActorDisplayProps) {
  return (
    <div className="actor-display">
      <div className="actor-display-header">
        <span>Fighter {fighterId}</span>
      </div>
      <div className="actor-display-content">
        <img
          src={fighter.imageUrl}
          alt={fighter.name}
          className="actor-display-img"
        />
        <span className="actor-display-name">{fighter.name}</span>
      </div>
    </div>
  );
}
