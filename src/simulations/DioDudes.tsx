import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ImageUpload, { CroppedImageData, blobToBase64 } from '@/components/ImageUpload';
import { SimulationProps } from '../types/simulation';
import { useIsInAppWalletBrowser } from '@/utils/walletUtils';
import { ConnectWalletButton } from '@/components/ConnectWalletButton'; 
import { getConnectedPublicKey } from '@/wallet/wallet';  
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet'; 
import './DioDudes.css';

const DEMO_VIDEO_URL = 'https://arweave.net/3WReLIrdjuqEnV1buT9CbYXRhhBJ5fEXQmQ19pUXS5o?ext=mp4';
const FIGHTERS_CACHE_KEY = 'rgn-diodudes-fighters';

// Hardcoded collection ID for DioDudes simulations
const COLLECTION_ID = '9VMfraMtZao8d27ScRx6qvqGTzW2Md9vQv5YZyAopPQx'; 
const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY || '';

interface MplCoreAsset {
  orderId: string; // e.g., "OMF561" extracted from name
  name: string;
  image: string;
  animationUrl: string | null;
}

interface Fighter {
  name: string;
  imageBlob: Blob | null;      // The actual blob (memory efficient, can't be cached)
  imagePreview: string;         // Object URL for display, or fallback
}

const DEFAULT_FIGHTERS: Fighter[] = [
  { name: '', imageBlob: null, imagePreview: '/mystery-fighter.png' },
  { name: '', imageBlob: null, imagePreview: '/mystery-fighter.png' }
];

const INCLUDES = [
  'Custom AI Battle Video',
  'NFT with your fighters',
  'Permanent on-chain storage'
];

export default function DioDudes({ onFormDataChange, onError, onCheckout, disabled }: SimulationProps) {
  // const { connected, publicKey } = useWallet();
  const { connected, publicKey } = useUnifiedWallet();

  const inWalletBrowser = useIsInAppWalletBrowser();
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState<'new-order' | 'your-sims'>('your-sims');

  // Your Sims state
  const [ownedAssets, setOwnedAssets] = useState<MplCoreAsset[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);



  // Form state - only cache names (blobs can't be serialized to localStorage)
  const [fighters, setFighters] = useState<Fighter[]>(() => {
    const saved = localStorage.getItem(FIGHTERS_CACHE_KEY);
    if (saved) {
      try {
        const cached = JSON.parse(saved) as { name: string }[];
        return cached.map((c, i) => ({
          name: c.name || '',
          imageBlob: null,
          imagePreview: DEFAULT_FIGHTERS[i]?.imagePreview || '/mystery-fighter.png'
        }));
      } catch {
        return DEFAULT_FIGHTERS;
      }
    }
    return DEFAULT_FIGHTERS;
  });

  // Track object URLs to revoke on cleanup
  const objectUrlsRef = useRef<string[]>([]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Save only names to localStorage (blobs can't be cached)
  useEffect(() => {
    localStorage.setItem(
      FIGHTERS_CACHE_KEY,
      JSON.stringify(fighters.map(f => ({ name: f.name })))
    );
  }, [fighters]);

  // Notify parent of form data changes - convert blobs to base64 only when needed
  useEffect(() => {
    const isValid = fighters.every(f => f.name.trim() !== '' && f.imageBlob !== null);

    if (isValid) {
      // Convert blobs to base64 for backend submission
      Promise.all(fighters.map(f => blobToBase64(f.imageBlob!)))
        .then(base64Images => {
          onFormDataChange({
            fighters: fighters.map((f, i) => ({
              name: f.name,
              imageUrl: base64Images[i]
            })),
            preview: fighters.map(f => ({
              name: f.name,
              imagePreview: f.imagePreview
            })),
            includes: INCLUDES
          });
        });
    } else {
      onFormDataChange(null);
    }
  }, [fighters, onFormDataChange]);

  // Fetch owned NFTs once when wallet connects (not on tab switch)
  useEffect(() => {
    if (!connected || !publicKey) {
      return;
    }

    const fetchOwnedNfts = async () => {
      setLoadingNfts(true);
      try {
        const response = await fetch(`https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'my-id',
            method: 'searchAssets',
            params: {
              ownerAddress: publicKey.toBase58(),
              grouping: ['collection', COLLECTION_ID],
              page: 1,
              limit: 100,
            },
          }),
        });

        const data = await response.json();
        const items = data?.result?.items || [];
        console.log(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const assets: MplCoreAsset[] = items.map((item: any) => {
          const name = item.content?.metadata?.name || 'Unnamed';
          // Extract order ID from name like "Dio Dudes #OMF561" -> "OMF561"
          const hashIndex = name.indexOf('#');
          const orderId = hashIndex !== -1 ? name.substring(hashIndex + 1) : name;

          return {
            orderId,
            name,
            image: item.content?.links?.image || '',
            animationUrl: item.content?.links?.animation_url || null,
          };
        });

        setOwnedAssets(assets);
      } catch (err) {
        console.error('Failed to fetch NFTs:', err);
        onError('Failed to load your simulations');
      } finally {
        setLoadingNfts(false);
      }
    };

    fetchOwnedNfts();
  }, [connected, publicKey, onError]);

  const updateFighterName = (index: number, value: string) => {
    const filteredValue = value.replace(/[^a-zA-Z0-9_ ]/g, '');

    if (filteredValue.length > 12) {
      onError('Fighter name must be 12 characters or less');
      return;
    }

    setFighters(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: filteredValue };
      return updated;
    });
  };

  const handleFighterImageChange = (index: number, croppedImageData: CroppedImageData) => {
    // Track the object URL for cleanup
    objectUrlsRef.current.push(croppedImageData.objectUrl);

    setFighters(prev => {
      const updated = [...prev];
      // Revoke old object URL if it exists and isn't default
      const oldPreview = updated[index].imagePreview;
      if (oldPreview && oldPreview.startsWith('blob:')) {
        URL.revokeObjectURL(oldPreview);
      }

      updated[index] = {
        ...updated[index],
        imageBlob: croppedImageData.blob,
        imagePreview: croppedImageData.objectUrl
      };
      return updated;
    });
  };

  const handleDownload = async (asset: MplCoreAsset) => {
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
      <section className="about-section">
        <p>
          1v1 Physics-based Boxing Fight of RL-trained Agents. Create the match of the ages, in which the victor will be forever inscribed on the blockchain!
        </p>
        {!inWalletBrowser && (
          <div className="video-container">
            {!videoError ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
              >
                <source src={DEMO_VIDEO_URL} type="video/mp4" />
              </video>
            ) : (
              <div className="video-loading">
                <span>Video unavailable</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Tab navigation */}
      <div className="tab-buttons">
        <button 
          className={`tab-button ${activeTab === 'your-sims' ? 'active' : ''}`}
          onClick={() => setActiveTab('your-sims')}
        >
          Your Sims
        </button>

        <button 
          className={`tab-button ${activeTab === 'new-order' ? 'active' : ''}`}
          onClick={() => setActiveTab('new-order')}
        >
          New Order...
        </button>
      </div>

      {activeTab === 'your-sims' && (
        <div className="your-sims-section">
          {!connected || !publicKey ? (
            <div className="sims-wallet-prompt">
              <h2>Connect Your Wallet to Proceed</h2>
              <div className="...">
                <ConnectWalletButton />
                {/* other nav items */}
              </div>
            </div>
          ) : loadingNfts ? (
            <div className="sims-loading">Loading your simulations...</div>
          ) : ownedAssets.length === 0 ? (
            <div className="sims-empty">No simulations found for this collection.</div>
          ) : (
            <div className="sims-grid">
              {ownedAssets.map((asset) => (
                <div key={asset.orderId} className="sim-card">
                  <div className="sim-card-header">
                    <span className="sim-card-id">#{asset.orderId}</span>
                  </div>
                  <img
                    src={asset.image}
                    alt={asset.name}
                    className="sim-card-image"
                  />
                  <div className="sim-card-footer">
                    {asset.animationUrl ? (
                      <button
                        onClick={() => handleDownload(asset)}
                        disabled={downloadingId === asset.orderId}
                        className="sim-card-download-btn"
                      >
                        {downloadingId === asset.orderId ? (
                          <span className="spinner" />
                        ) : (
                          'Download'
                        )}
                      </button>
                    ) : (
                      <div className="sim-card-pending">Processing...</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'new-order' && (
        <div className="order-form">
          {(!connected || !publicKey) && (
            <div className="form-wallet-overlay">
              <div className="form-wallet-prompt">
                <h2>Connect Your Wallet to Proceed</h2>
                  <div className="...">
                  <ConnectWalletButton />
                  {/* other nav items */}
                </div>
              </div>
            </div>
          )}

          {fighters.map((fighter, index) => (
            <section key={index} className="section fighter-section">
              <h2>Actor {index + 1}</h2>
              <div className="fighter-content">
                <ImageUpload
                  imagePreview={fighter.imagePreview}
                  hasImage={fighter.imageBlob !== null}
                  onImageChange={(croppedImageData) => handleFighterImageChange(index, croppedImageData)}
                  onError={onError}
                  inputId={`diodudes-f${index}-image`}
                />
                <div className="fighter-fields">
                  <div className="field">
                    <label htmlFor={`diodudes-f${index}-name`}>Enter Name:</label>
                    <input
                      id={`diodudes-f${index}-name`}
                      type="text"
                      required
                      maxLength={12}
                      value={fighter.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateFighterName(index, e.target.value)}
                      placeholder="*Up to 12 Characters"
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            </section>
          ))}

          <button
            type="button"
            className="primary checkout-btn"
            disabled={!fighters.every(f => f.name.trim() !== '' && f.imageBlob !== null)}
            onClick={onCheckout}
          >
            Go To Checkout
          </button>
        </div>
      )}

      {/* Copy link toast for Android */}
      {showCopyToast && (
        <div className="copy-toast">
          <p>Link copied to clipboard. Paste it in your mobile browser to download.</p>
          <div className="copy-toast-bar" />
        </div>
      )}
    </>
  );
}

// Clear cached form data (called after successful order)
export function clearDioDudesCache() {
  localStorage.removeItem(FIGHTERS_CACHE_KEY);
}
