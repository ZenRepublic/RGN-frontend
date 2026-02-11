import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AssetInspector } from '@/components/AssetInspector';
import { VotingSystem } from '@/components/VotingSystem';
import { Order, fetchOrderById } from '@/utils/orderFetcher';
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
  const [showCopyToast, setShowCopyToast] = useState(false);

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

    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(ua);
    const isIOS = /iphone|ipad|ipod/.test(ua);

    // Android: copy link to clipboard (Phantom blocks downloads/external browser)
    if (isAndroid) {
      try {
        await navigator.clipboard.writeText(asset.videoUrl);
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 3000);
      } catch {
        // Fallback for older browsers
        prompt('Copy this link:', asset.videoUrl);
      }
      return;
    }

    setDownloading(true);
    const fileName = `${asset.id}.mp4`;

    try {
      const response = await fetch(asset.videoUrl);
      const blob = await response.blob();

      // iOS: use Share API (works in Phantom's in-app browser)
      if (isIOS && navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'video/mp4' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: asset.id,
          });
          setDownloading(false);
          return;
        }
      }

      // Desktop: classic blob download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: open in new tab
      window.open(asset.videoUrl, '_blank');
    } finally {
      setDownloading(false);
    }
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
                  {(() => {
                    const d = new Date(asset.startTime);
                    const yy = String(d.getFullYear()).slice(2);
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const h = d.getHours();
                    const min = String(d.getMinutes()).padStart(2, '0');
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const h12 = h % 12 || 12;
                    return `${yy}/${mm}/${dd} ${h12}:${min}${ampm}`;
                  })()}
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

      {/* Copy link toast for Android */}
      {showCopyToast && (
        <div className="episode-view-copy-toast">
          <p>Link copied to clipboard. Paste it in your mobile browser to download.</p>
          <div className="episode-view-copy-toast-bar" />
        </div>
      )}
    </div>
  );
}
