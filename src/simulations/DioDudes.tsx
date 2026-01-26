import { useState, useEffect, useRef, ChangeEvent } from 'react';
import ImageUpload, { CroppedImageData, blobToBase64 } from '@/components/ImageUpload';
import { SimulationProps } from '../types/simulation';
import { useIsInAppWalletBrowser } from '@/utils/walletUtils';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import SimulationDisplay from '@/components/SimulationDisplay';
import { useWallet } from '@solana/wallet-adapter-react';
import './DioDudes.css';

const DEMO_VIDEO_URL = 'https://arweave.net/3WReLIrdjuqEnV1buT9CbYXRhhBJ5fEXQmQ19pUXS5o?ext=mp4';
const FIGHTERS_CACHE_KEY = 'rgn-diodudes-fighters';

// Hardcoded collection ID for DioDudes simulations
const COLLECTION_ID = '9VMfraMtZao8d27ScRx6qvqGTzW2Md9vQv5YZyAopPQx';

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
  const { connected, publicKey } = useWallet();

  const inWalletBrowser = useIsInAppWalletBrowser();
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState<'new-order' | 'your-sims'>('your-sims');

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
        <SimulationDisplay collectionId={COLLECTION_ID} onError={onError} />
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
    </>
  );
}

// Clear cached form data (called after successful order)
export function clearDioDudesCache() {
  localStorage.removeItem(FIGHTERS_CACHE_KEY);
}
