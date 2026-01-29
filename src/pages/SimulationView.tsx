import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MplSimulationAsset } from '@/utils/simulationAssets';
import './SimulationView.css';

const SIMULATION_VIEW_KEY = 'rgn-simulation-view';

// Helper to store asset before navigating
export function storeSimulationAsset(asset: MplSimulationAsset): void {
  localStorage.setItem(SIMULATION_VIEW_KEY, JSON.stringify(asset));
}

// Helper to get stored asset
function getStoredSimulationAsset(): MplSimulationAsset | null {
  const stored = localStorage.getItem(SIMULATION_VIEW_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as MplSimulationAsset;
    } catch {
      return null;
    }
  }
  return null;
}

export default function SimulationView() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [asset, setAsset] = useState<MplSimulationAsset | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  useEffect(() => {
    const stored = getStoredSimulationAsset();
    if (stored && stored.orderId === orderId) {
      setAsset(stored);
    } else {
      // No matching asset found, redirect to home
      navigate('/', { replace: true });
    }
  }, [orderId, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleDownload = async () => {
    if (!asset?.animationUrl) return;

    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(ua);
    const isIOS = /iphone|ipad|ipod/.test(ua);

    // Android: copy link to clipboard (Phantom blocks downloads/external browser)
    if (isAndroid) {
      try {
        await navigator.clipboard.writeText(asset.animationUrl);
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 3000);
      } catch {
        // Fallback for older browsers
        prompt('Copy this link:', asset.animationUrl);
      }
      return;
    }

    setDownloading(true);
    const fileName = `${asset.name}.mp4`;

    try {
      const response = await fetch(asset.animationUrl);
      const blob = await response.blob();

      // iOS: use Share API (works in Phantom's in-app browser)
      if (isIOS && navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'video/mp4' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: asset.name,
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
      window.open(asset.animationUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  if (!asset) {
    return null;
  }

  return (
    <div className="simulation-view-page">
      <Header />
      <div className="simulation-view-container">
        <div className="simulation-view-header-row">
          <button onClick={handleBack} className="back">
            ← Back
          </button>
          <h1 className="simulation-view-title">#{asset.orderId}</h1>
        </div>

        <h1 className="simulation-view-section-header">Match Overview</h1>

        {asset.image && (
          <img
            className="simulation-view-image"
            src={asset.image}
            alt={asset.name}
          />
        )}

        <h2 className="simulation-view-section-header">Watch It Here!</h2>

        {asset.animationUrl ? (
          <>
            <video
              className="simulation-view-video"
              src={asset.animationUrl}
              controls
              // autoPlay
              loop
            />
            <button
              className="simulation-view-download-btn"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : 'Download Video'}
            </button>
          </>
        ) : (
          <div className="simulation-view-pending">
            <p>Video is still processing...</p>
          </div>
        )}
      </div>

      <p className="simulation-view-share-text">
        Feel free to share the match on your socials, and tag <span className="highlight">@RGN_Brainrot</span> if you want us to interact!
      </p>

      {/* Copy link toast for Android */}
      {showCopyToast && (
        <div className="simulation-view-copy-toast">
          <p>Link copied to clipboard. Paste it in your mobile browser to download.</p>
          <div className="simulation-view-copy-toast-bar" />
        </div>
      )}
    </div>
  );
}
