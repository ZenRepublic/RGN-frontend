import { useState, useEffect, ChangeEvent } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ImageUpload from '../components/ImageUpload';
import { SimulationProps } from '../types/simulation';
import { useIsInAppWalletBrowser } from '../utils/walletUtils';
import './DioDudes.css';

const DEMO_VIDEO_URL = 'https://arweave.net/3WReLIrdjuqEnV1buT9CbYXRhhBJ5fEXQmQ19pUXS5o?ext=mp4';
const FIGHTERS_CACHE_KEY = 'rgn-diodudes-fighters';

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
  const { connected } = useWallet();
  const inWalletBrowser = useIsInAppWalletBrowser();
  const [videoError, setVideoError] = useState(false);

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

      <div className="order-form">
        {!connected && (
          <div className="form-wallet-overlay">
            <div className="form-wallet-prompt">
              <h3>Connect Wallet To Place an Order</h3>
              <WalletMultiButton />
            </div>
          </div>
        )}

        {fighters.map((fighter, index) => (
          <section key={index} className="section fighter-section">
            <h2>Fighter {index + 1}</h2>
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
                  <label htmlFor={`diodudes-f${index}-name`}>Name* (max 12 chars)</label>
                  <input
                    id={`diodudes-f${index}-name`}
                    type="text"
                    required
                    maxLength={12}
                    value={fighter.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateFighter(index, 'name', e.target.value)}
                    placeholder="e.g. Solana"
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
    </>
  );
}

// Clear cached form data (called after successful order)
export function clearDioDudesCache() {
  localStorage.removeItem(FIGHTERS_CACHE_KEY);
}
