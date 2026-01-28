import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import ImageUpload, { CroppedImageData, blobToBase64 } from '@/components/ImageUpload';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import CheckoutModal from '@/components/CheckoutModal';
import { SimulationFormData } from '@/types/simulation';
import './DioDudesOrderForm.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const FIGHTERS_CACHE_KEY = 'rgn-diodudes-fighters';

interface PaymentInfo {
  success: boolean;
  price: string;
  wallet: string;
}

interface Fighter {
  name: string;
  imageBlob: Blob | null;
  imagePreview: string;
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

export default function DioDudesOrderForm() {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();

  const [error, setError] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [formData, setFormData] = useState<SimulationFormData | null>(null);

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

  const objectUrlsRef = useRef<string[]>([]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Fetch payment info on mount
  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/rgn/payment-info`);
        const data = await response.json() as PaymentInfo;
        if (data.success) {
          setPaymentInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch payment info:', err);
      }
    };
    fetchPaymentInfo();
  }, []);

  // Save only names to localStorage
  useEffect(() => {
    localStorage.setItem(
      FIGHTERS_CACHE_KEY,
      JSON.stringify(fighters.map(f => ({ name: f.name })))
    );
  }, [fighters]);

  // Update form data when fighters change
  useEffect(() => {
    const isValid = fighters.every(f => f.name.trim() !== '' && f.imageBlob !== null);

    if (isValid) {
      Promise.all(fighters.map(f => blobToBase64(f.imageBlob!)))
        .then(base64Images => {
          setFormData({
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
      setFormData(null);
    }
  }, [fighters]);

  const updateFighterName = (index: number, value: string) => {
    const filteredValue = value.replace(/[^a-zA-Z0-9_ ]/g, '');

    if (filteredValue.length > 12) {
      setError('Fighter name must be 12 characters or less');
      return;
    }

    setFighters(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: filteredValue };
      return updated;
    });
  };

  const handleFighterImageChange = (index: number, croppedImageData: CroppedImageData) => {
    objectUrlsRef.current.push(croppedImageData.objectUrl);

    setFighters(prev => {
      const updated = [...prev];
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

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="order-form-page">
      <div className="order-form-container">
        <button onClick={handleBack} className="order-form-back">
          ← Back
        </button>

        <h1 className="order-form-title">New Order</h1>

        <div className="order-form">
          {(!connected || !publicKey) && (
            <div className="form-wallet-overlay">
              <div className="form-wallet-prompt">
                <h2>Connect Your Wallet to Proceed</h2>
                <div className="form-wallet-btn">
                  <ConnectWalletButton />
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
                  onError={setError}
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
                      disabled={showCheckoutModal}
                    />
                  </div>
                </div>
              </div>
            </section>
          ))}

          {error && <div className="order-form-error">{error}</div>}

          <button
            type="button"
            className="primary checkout-btn"
            disabled={!fighters.every(f => f.name.trim() !== '' && f.imageBlob !== null)}
            onClick={() => setShowCheckoutModal(true)}
          >
            Go To Checkout
          </button>
        </div>
      </div>

      {formData && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          formData={formData}
          paymentInfo={paymentInfo}
          activeSimulationId="dio-dudes"
          onClose={() => setShowCheckoutModal(false)}
          onError={setError}
        />
      )}
    </div>
  );
}

// Clear cached form data (called after successful order)
export function clearDioDudesCache() {
  localStorage.removeItem(FIGHTERS_CACHE_KEY);
}
