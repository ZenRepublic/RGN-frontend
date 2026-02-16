import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AssetInspector } from '@/primitives/buttons/AssetInspectorButton';
import { VotingSystem } from '@/components/VotingSystem';
import { Order, fetchOrderById } from '../utils';
import { getFullAMPMDate } from '../utils'
import { downloadVideo } from '../utils'
import './EpisodeView.css';

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
      console.error('Download failed:', result.message);
    }

    setDownloading(false);
  };

  if (!asset) {
    return null;
  }

  return (
    <div className="episode-view-page">
      <Header />
      <div className="episode-view-container">
        <div className="episode-view-header-row">
          <button onClick={handleBack} className="back">
            ← Back
          </button>
          <h1 className="episode-view-section-header">Episode Overview</h1>
        </div>

        {asset.coverImageUrl && (
          <img
            className="episode-view-image"
            src={asset.coverImageUrl}
            alt="Episode cover"
          />
        )}

        <div className="episode-view-overview">
          <div className="episode-view-meta">
            <div className="episode-view-meta-row">
              <p className="episode-view-meta-label">ID:</p>
              <p className="episode-view-meta-value">#{asset.id}</p>
            </div>
            {asset.startTime && (
              <div className="episode-view-meta-row">
                <p className="episode-view-meta-label">Date:</p>
                <p className="episode-view-meta-value">
                  {getFullAMPMDate(new Date(asset.startTime))}
                </p>
              </div>
            )}
            {asset.episodeId && (
              <div className="episode-view-meta-row">
                <p className="episode-view-meta-label">Asset:</p>
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
              className="episode-view-video"
              src={asset.videoUrl}
              controls
              // autoPlay
              loop
            />
            <button
              className="episode-view-download-btn"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : 'Download Video'}
            </button>
          </>
        ) : (
          // Only show "processing" message if voting has ended (startTime is in the past)
          asset.startTime && new Date(asset.startTime).getTime() < Date.now() && (
            <div className="episode-view-pending">
              <p>Video is still processing...</p>
            </div>
          )
        )}
      </div>

      {asset.videoUrl && (
        <p className="episode-view-share-text">
          Feel free to share the match on your socials, and tag <span className="highlight">@RGN_Brainrot</span> if you want us to interact!
        </p>
      )}
    </div>
  );
}
