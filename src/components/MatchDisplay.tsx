import { useNavigate } from 'react-router-dom';
import { MplEpisodeAsset } from '@/utils/episodeFetcher';
import { storeToCache } from '@/pages/EpisodeView';
import './MatchDisplay.css';

interface MatchDisplayProps {
  asset: MplEpisodeAsset | undefined;
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

function getEpisodeStatus(startTime: string | undefined): { text: string; type: 'voting' | 'completed' } {
  if (!startTime) return { text: 'Voting Open', type: 'voting' };

  const startDate = new Date(startTime);
  const now = new Date();

  if (isNaN(startDate.getTime())) return { text: 'Voting Open', type: 'voting' };

  if (startDate > now) {
    return { text: 'Voting Open', type: 'voting' };
  } else {
    return { text: 'Completed', type: 'completed' };
  }
}

export default function MatchDisplay({ asset }: MatchDisplayProps) {
  const navigate = useNavigate();

  const episodeData = asset?.episodeData;
  const actors = episodeData?.actors || [];
  const actor1 = actors[0];
  const actor2 = actors[1];

  const handleView = () => {
    if (asset) {
      storeToCache(asset);
      navigate(`/episode/${asset.orderId}`);
    }
  };

  const formattedTime = formatStartTime(episodeData?.startTime);
  const status = getEpisodeStatus(episodeData?.startTime);

  return (
    <div className="match-display">
      <div className="match-display-header">
        <span className="match-display-time">{formattedTime}</span>
        <span className={`match-display-status match-display-status--${status.type}`}>
          <span className="match-display-status-dot"></span>
          {status.text}
        </span>
      </div>

      <div className="match-display-content">
        <div className="match-display-actor match-display-actor--left">
          {actor1 ? (
            <>
              <span className="match-display-actor-name">{actor1.name}</span>
              <img
                src={actor1.imageUrl}
                alt={actor1.name}
                className="match-display-actor-img"
              />
            </>
          ) : (
            <div className="match-display-actor-placeholder" />
          )}
        </div>

        <div className="match-display-center">
          <span className="match-display-vs">VS</span>
          <button
            className="match-display-view-btn"
            onClick={handleView}
            disabled={!asset}
          >
            View Episode
          </button>
        </div>

        <div className="match-display-actor match-display-actor--right">
          {actor2 ? (
            <>
              <span className="match-display-actor-name">{actor2.name}</span>
              <img
                src={actor2.imageUrl}
                alt={actor2.name}
                className="match-display-actor-img"
              />
            </>
          ) : (
            <div className="match-display-actor-placeholder" />
          )}
        </div>
      </div>
    </div>
  );
}
