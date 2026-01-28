import { useNavigate } from 'react-router-dom';
import { MplSimulationAsset } from '@/utils/simulationAssets';
import { storeSimulationAsset } from '@/pages/SimulationView';
import './MatchDisplay.css';

interface MatchDisplayProps {
  asset: MplSimulationAsset | undefined;
}

function formatStartTime(startTime: string | undefined): string {
  if (!startTime) return '';

  const date = new Date(startTime);
  if (isNaN(date.getTime())) return '';

  const datePart = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  }).toUpperCase();

  const timePart = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(' ', '');

  return `${datePart}, ${timePart}`;
}

export default function MatchDisplay({ asset }: MatchDisplayProps) {
  const navigate = useNavigate();

  const matchData = asset?.matchData;
  const fighters = matchData?.fighters || [];
  const fighter1 = fighters[0];
  const fighter2 = fighters[1];

  const handleView = () => {
    if (asset) {
      storeSimulationAsset(asset);
      navigate(`/simulation/${asset.orderId}`);
    }
  };

  const formattedTime = formatStartTime(matchData?.startTime);

  return (
    <div className="match-display">
      <div className="match-display-header">
        <span className="match-display-time">{formattedTime}</span>
        <span className="match-display-order-id">#{asset?.orderId}</span>
      </div>

      <div className="match-display-content">
        <div className="match-display-fighter match-display-fighter--left">
          {fighter1 ? (
            <>
              <span className="match-display-fighter-name">{fighter1.name}</span>
              <img
                src={fighter1.imageUrl}
                alt={fighter1.name}
                className="match-display-fighter-img"
              />
            </>
          ) : (
            <div className="match-display-fighter-placeholder" />
          )}
        </div>

        <div className="match-display-center">
          <span className="match-display-vs">VS</span>
          <button
            className="match-display-view-btn"
            onClick={handleView}
            disabled={!asset}
          >
            View Match
          </button>
        </div>

        <div className="match-display-fighter match-display-fighter--right">
          {fighter2 ? (
            <>
              <span className="match-display-fighter-name">{fighter2.name}</span>
              <img
                src={fighter2.imageUrl}
                alt={fighter2.name}
                className="match-display-fighter-img"
              />
            </>
          ) : (
            <div className="match-display-fighter-placeholder" />
          )}
        </div>
      </div>
    </div>
  );
}
