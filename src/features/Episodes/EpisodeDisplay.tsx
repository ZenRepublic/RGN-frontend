import { useNavigate } from 'react-router-dom';
import { Order } from '../../utils';
import { storeToCache } from '@/features/Episodes/EpisodeView';
import './EpisodeDisplay.css';

interface EpisodeDisplayProps {
  asset: Order | undefined;
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

export default function EpisodeDisplay({ asset }: EpisodeDisplayProps) {
  const navigate = useNavigate();

  const actors = asset?.actors || [];
  const actor1 = actors[0];
  const actor2 = actors[1];

  const handleView = () => {
    if (asset) {
      storeToCache(asset);
      navigate(`/episode/${asset.id}`);
    }
  };

  const formattedTime = formatStartTime(asset?.startTime);
  const status = getEpisodeStatus(asset?.startTime);

  return (
    <div className="episode-display">
      <div className="episode-display-header">
        <span className="episode-display-time">{formattedTime}</span>
        <span className={`episode-display-status episode-display-status--${status.type}`}>
          <span className="episode-display-status-dot"></span>
          {status.text}
        </span>
      </div>

      <div className="episode-display-content">
        <div className="episode-display-actor episode-display-actor--left">
          {actor1 ? (
            <>
              <span className="episode-display-actor-name">{actor1.name}</span>
              <img
                src={actor1.imageUrl}
                alt={actor1.name}
                className="episode-display-actor-img"
              />
            </>
          ) : (
            <div className="episode-display-actor-placeholder" />
          )}
        </div>

        <div className="episode-display-center">
          <span className="episode-display-vs">VS</span>
          <button
            className="episode-display-view-btn"
            onClick={handleView}
            disabled={!asset}
          >
            View
          </button>
        </div>

        <div className="episode-display-actor episode-display-actor--right">
          {actor2 ? (
            <>
              <span className="episode-display-actor-name">{actor2.name}</span>
              <img
                src={actor2.imageUrl}
                alt={actor2.name}
                className="episode-display-actor-img"
              />
            </>
          ) : (
            <div className="episode-display-actor-placeholder" />
          )}
        </div>
      </div>
    </div>
  );
}
