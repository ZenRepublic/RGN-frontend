import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWalletButton } from './ConnectWalletButton';
import { fetchSimulationAssets, MplSimulationAsset } from '@/utils/simulationAssets';
import './SimulationDisplay.css';

interface SimulationDisplayProps {
  collectionId: string;
  orderUrl?: string;
  onError?: (message: string) => void;
}

export default function SimulationDisplay({ collectionId, orderUrl, onError }: SimulationDisplayProps) {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();

  const [ownedAssets, setOwnedAssets] = useState<MplSimulationAsset[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Clear assets when wallet disconnects
  useEffect(() => {
    if (!connected || !publicKey) {
      setOwnedAssets([]);
    }
  }, [connected, publicKey]);

  // Fetch owned NFTs when wallet connects
  useEffect(() => {
    if (!connected || !publicKey) {
      return;
    }

    const fetchOwnedNfts = async () => {
      setLoadingNfts(true);
      try {
        const assets = await fetchSimulationAssets({
          ownerAddress: publicKey.toBase58(),
          collectionId,
        });
        setOwnedAssets(assets);
      } catch (err) {
        console.error('Failed to fetch NFTs:', err);
        onError?.('Failed to load your simulations');
      } finally {
        setLoadingNfts(false);
      }
    };

    fetchOwnedNfts();
  }, [connected, publicKey, collectionId, onError]);

  const handleDownload = async (asset: MplSimulationAsset) => {
    if (!asset.animationUrl) return;

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

    setDownloadingId(asset.orderId);
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
          setDownloadingId(null);
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
      setDownloadingId(null);
    }
  };

  return (
    <>
      <div className="sim-display">
        {orderUrl && (
          <div className="sim-display-header">
            <button
              className="sim-display-new-order-btn"
              onClick={() => navigate(orderUrl)}
            >
              + New Order
            </button>
          </div>
        )}

        {!connected || !publicKey ? (
          <div className="sim-display-wallet-prompt">
            <h2>Connect Your Wallet to Proceed</h2>
            <div className="sim-display-wallet-button">
              <ConnectWalletButton />
            </div>
          </div>
        ) : loadingNfts ? (
          <div className="sim-display-loading">Loading your simulations...</div>
        ) : ownedAssets.length === 0 ? (
          <div className="sim-display-empty">No simulations found for this collection.</div>
        ) : (
          <div className="sim-display-grid">
            {ownedAssets.map((asset) => (
              <div key={asset.id} className="sim-display-card">
                <div className="sim-display-card-header">
                  <span className="sim-display-card-id">#{asset.orderId}</span>
                </div>
                <img
                  src={asset.image}
                  alt={asset.name}
                  className="sim-display-card-image"
                />
                <div className="sim-display-card-footer">
                  {asset.animationUrl ? (
                    <button
                      onClick={() => handleDownload(asset)}
                      disabled={downloadingId === asset.orderId}
                      className="sim-display-card-download-btn"
                    >
                      {downloadingId === asset.orderId ? (
                        <span className="spinner" />
                      ) : (
                        'Download'
                      )}
                    </button>
                  ) : (
                    <div className="sim-display-card-pending">Processing...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Copy link toast for Android */}
      {showCopyToast && (
        <div className="sim-display-copy-toast">
          <p>Link copied to clipboard. Paste it in your mobile browser to download.</p>
          <div className="sim-display-copy-toast-bar" />
        </div>
      )}
    </>
  );
}
