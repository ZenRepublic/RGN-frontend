import { useState, useEffect, ChangeEvent } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ImageUpload from '../components/ImageUpload';
import { SimulationProps } from '../types/simulation';
import { useIsInAppWalletBrowser } from '../utils/walletUtils';
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
  image: string | null;
  imagePreview: string;
}

const DEFAULT_FIGHTERS: Fighter[] = [
  { name: '', image: null, imagePreview: '/mystery-fighter.png' },
  { name: '', image: null, imagePreview: '/mystery-fighter.png' }
];

const INCLUDES = [
  'Custom AI Battle Video',
  'NFT with your fighters',
  'Permanent on-chain storage'
];

export default function DioDudes({ onFormDataChange, onError, onCheckout, disabled }: SimulationProps) {
  const { connected, publicKey } = useWallet();
  const inWalletBrowser = useIsInAppWalletBrowser();
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState<'new-order' | 'your-sims'>('your-sims');

  // Your Sims state
  const [ownedAssets, setOwnedAssets] = useState<MplCoreAsset[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Form state - load from localStorage if available
  const [fighters, setFighters] = useState<Fighter[]>(() => {
    const saved = localStorage.getItem(FIGHTERS_CACHE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as Fighter[];
      } catch {
        return DEFAULT_FIGHTERS;
      }
    }
    return DEFAULT_FIGHTERS;
  });

  // Save fighters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(FIGHTERS_CACHE_KEY, JSON.stringify(fighters));
  }, [fighters]);

  // Notify parent of form data changes
  useEffect(() => {
    const isValid = fighters.every(f => f.name.trim() !== '' && f.image !== null);

    if (isValid) {
      onFormDataChange({
        fighters: fighters.map(f => ({
          name: f.name,
          imageUrl: f.image || f.imagePreview
        })),
        preview: fighters.map(f => ({
          name: f.name,
          imagePreview: f.imagePreview
        })),
        includes: INCLUDES
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

  const updateFighter = (index: number, field: keyof Fighter, value: string) => {
    if (field === 'name') {
      const filteredValue = value.replace(/[^a-zA-Z0-9_ ]/g, '');

      if (filteredValue.length > 12) {
        onError('Fighter name must be 12 characters or less');
        return;
      }

      setFighters(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: filteredValue };
        return updated;
      });
    } else {
      setFighters(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    }
  };

  const handleFighterImageChange = (index: number, croppedImage: string) => {
    setFighters(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        image: croppedImage,
        imagePreview: croppedImage
      };
      return updated;
    });
  };

  const handleDownload = async (asset: MplCoreAsset) => {
    if (!asset.animationUrl) return;

    setDownloadingId(asset.orderId);
    const fileName = `${asset.name}.mp4`;

    try {
      const response = await fetch(asset.animationUrl);
      const blob = await response.blob();

      // Try Share API for mobile (works in Phantom's in-app browser)
      if (navigator.share && navigator.canShare) {
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

      // Fallback: blob download for desktop
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
      // Ultimate fallback: open in new tab
      window.open(asset.animationUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <section className="about-section">
        <p>
          1v1 Boxing Simulation of locally trained AI Agents. Set your fighters and send them off to the match of the ages, in which the victor will be forever inscribed on the blockchain!
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
          {!connected ? (
            <div className="sims-wallet-prompt">
              <h2>Connect Your Wallet to Proceed</h2>
              <WalletMultiButton />
            </div>
          ) : loadingNfts ? (
            <div className="sims-loading">Loading your simulations...</div>
          ) : ownedAssets.length === 0 ? (
            <div className="sims-empty">No simulations found for this collection.</div>
          ) : (
            <div className="sims-grid">
              {ownedAssets.map((asset) => (
                <div key={asset.orderId} className="sim-card">
                  <img
                    src={asset.image}
                    alt={asset.name}
                    className="sim-card-image"
                  />
                  <div className="sim-card-info">
                    <span className="sim-card-id">#{asset.orderId}</span>
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
                      <span className="sim-card-pending">Processing...</span>
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
          {!connected && (
            <div className="form-wallet-overlay">
              <div className="form-wallet-prompt">
                <h2>Connect Your Wallet to Proceed</h2>
                <WalletMultiButton />
              </div>
            </div>
          )}

          {fighters.map((fighter, index) => (
            <section key={index} className="section fighter-section">
              <h2>Actor {index + 1}</h2>
              <div className="fighter-content">
                <ImageUpload
                  imagePreview={fighter.imagePreview}
                  hasImage={fighter.image !== null}
                  onImageChange={(croppedImage) => handleFighterImageChange(index, croppedImage)}
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
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateFighter(index, 'name', e.target.value)}
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
            disabled={!fighters.every(f => f.name.trim() !== '' && f.image !== null)}
            onClick={onCheckout}
          >
            Go To Checkout
          </button>
        </div>
      )}
    </>
  );
}

// Clear cached form data (called after successful order)
export function clearDioDudesCache() {
  localStorage.removeItem(FIGHTERS_CACHE_KEY);
}
