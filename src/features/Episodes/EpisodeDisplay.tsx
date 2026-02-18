import { useNavigate } from 'react-router-dom';
import { Order } from '../../utils';
import { storeToCache } from '@/features/Episodes/EpisodeView';
import {getMonthDayAMPAMDdate} from "@/utils"
import './EpisodeDisplay.css';

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

export default function EpisodeDisplay({ asset }: { asset: Order }) {
  const navigate = useNavigate();

  const [actor1, actor2] = asset.actors!;

  const handleView = () => {
    if (asset) {
      storeToCache(asset);
      navigate(`/episode/${asset.id}`);
    }
  };

  const formattedTime = getMonthDayAMPAMDdate(new Date(asset.startTime));
  const status = getEpisodeStatus(asset.startTime);

  return (
    <div className="episode-card">
      <div className="episode-card-header">
        <span className='text-white font-bold opacity-80'>{formattedTime}</span>
        <span className={`episode-display-status episode-display-status--${status.type}`}>
          <span className="episode-display-status-dot"></span>
          {status.text}
        </span>
      </div>

      <div className="flex justify-between items-center p-lg">
        <div className="flex flex-1 min-w-0 flex-col gap-md items-start">
          <span className="title block truncate">{actor1.name}</span>
          <img src={actor1.imageUrl} alt={actor1.name} className="w-[100px] h-[100px] rounded-md" />
        </div>

        <div className="flex flex-col items-center gap-md">
          <span className="intense-red">VS</span>
          <button className="special-small min-w-[80px]" onClick={handleView}>
            View
          </button>
        </div>

        <div className="flex flex-1 min-w-0 flex-col gap-md items-end">
          <span className="title block truncate">{actor2.name}</span>
          <img src={actor2.imageUrl} alt={actor2.name} className="w-[100px] h-[100px] rounded-md" />
        </div>
      </div>
    </div>
  );
}
