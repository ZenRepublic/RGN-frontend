import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AssetInspector } from '@/primitives/buttons/AssetInspectorButton';
import { VotingSystem } from '@/features/Voting/VotingSystem';
import { useToast } from '@/context/ToastContext';
import { Order, fetchOrderById } from '@/services/episodeFetch';
import { getFullAMPMDate } from '../../utils'
import { downloadVideo } from '../../utils'

const EPISODE_VIEW_KEY = 'rgn-episode-view';

// Helper to store asset before navigating
export function storeToCache(asset: Order): void {
  localStorage.setItem(EPISODE_VIEW_KEY, JSON.stringify(asset));
}

// Helper to get stored asset
function getFromCache(): Order | null {
  const stored = localStorage.getItem(EPISODE_VIEW_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Order;
    } catch {
      return null;
    }
  }
  return null;
}

export default function EpisodeView() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { showToast } = useToast();
  const [asset, setAsset] = useState<Order | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    // Show cached version immediately while fetching fresh data
    const stored = getFromCache();
    if (stored && stored.id === orderId) {
      setAsset(stored);
    }

    // Always fetch fresh data so votes are up to date
    fetchOrderById(orderId, false).then((fresh) => {
      if (fresh) {
        setAsset(fresh);
      } else if (!stored || stored.id !== orderId) {
        navigate('/', { replace: true });
      }
    });
  }, [orderId, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleDownload = async () => {
    if (!asset?.videoUrl) return;

    setDownloading(true);
    const result = await downloadVideo({
      videoUrl: asset.videoUrl,
      videoName: asset.id
    });

    if (!result.success) {
      showToast(result.message || 'Download failed');
    }

    setDownloading(false);
  };

  if (!asset) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="flex flex-col gap-xl">
        <div className="flex justify-between">
          <button onClick={handleBack} className="back">
            ← Back
          </button>
          <h1>Episode Overview</h1>
        </div>

        {asset.coverImageUrl && (
          <img
            className="rounded-lg shadow-xl"
            src={asset.coverImageUrl}
            alt="Episode cover"
          />
        )}

        <div className="frosted-card-inner">
          <div className='w-full flex flex-col gap-lg'>
            <div className="flex justify-between items-end border-b-sm border-white/20">
              <span className="text-white text-sm opacity-80">ID</span>
              <span className="text-white font-bold">#{asset.id}</span>
            </div>

            <div className="flex justify-between items-end border-b-sm border-white/20">
              <span className="text-white text-sm opacity-80">DATE</span>
              <span className="text-white font-bold">{getFullAMPMDate(new Date(asset.startTime))}</span>
            </div>

            {asset.episodeId && (
              <div className="flex justify-between items-end border-b-sm border-white/20">
                <span className="text-white text-sm opacity-80">ASSET</span>
                <AssetInspector assetAddress={asset.episodeId} />
              </div>
            )}
          </div>
        </div>

        {asset.actors && asset.startTime && (
          <VotingSystem
            orderId={asset.id}
            actors={asset.actors}
            startTime={asset.startTime}
          />
        )}

        {asset.videoUrl ? (
          <>
            <video
              className="w-full rounded-md bg-black"
              src={asset.videoUrl}
              controls
              // autoPlay
              loop
            />
            <button
              className="secondary"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : 'Download Video'}
            </button>
          </>
        ) : (
          // Only show "processing" message if voting has ended (startTime is in the past)
          asset.startTime && new Date(asset.startTime).getTime() < Date.now() && (
            <div className="empty-card">
              <div className="flex items-center justify-center h-full w-full opacity-60">
                <p className="text-center">Video is still processing...</p>
              </div>
            </div>
          )
        )}
      </div>

      {asset.videoUrl && (
        <p className='text-center'>
          Feel free to share the match on your socials, and tag <span className="highlight">@RGN_Brainrot</span> if you want us to interact!
        </p>
      )}
    </>
  );
}
