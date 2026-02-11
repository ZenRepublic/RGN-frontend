import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import ImageUpload, { CroppedImageData, blobToBase64 } from '@/components/ImageUpload';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import CheckoutModal from '@/components/CheckoutModal';
import TimeslotPicker from '@/components/TimeslotPicker';
import { EpisodeOrderFormData } from '@/channels/channel';
import { getIdByNetwork } from '@/channels';
import './DioDudesOrderForm.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

interface PaymentInfo {
  success: boolean;
  price: string;
  wallet: string;
}

interface ActorData {
  name: string;
  imageBlob: Blob | null;
  imagePreview: string;
}

const DEFAULT_ACTORS: ActorData[] = [
  { name: '', imageBlob: null, imagePreview: '/mystery-actor.png' },
  { name: '', imageBlob: null, imagePreview: '/mystery-actor.png' }
];

const INCLUDES = [
  'Custom AI Battle Video',
  'NFT with your Actors',
  'Permanent on-chain storage'
];

export default function DioDudesOrderForm() {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();

  const [error, setError] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [formData, setFormData] = useState<EpisodeOrderFormData | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);

  const [actors, setActors] = useState<ActorData[]>(DEFAULT_ACTORS);

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

  // Update form data when actors or startTime change
  useEffect(() => {
    const isValid = actors.every(a => a.name.trim() !== '' && a.imageBlob !== null) && startTime !== null;

    if (isValid) {
      console.log('Creating formData with actors:', actors.length);
      Promise.all(actors.map(a => blobToBase64(a.imageBlob!)))
        .then(base64Images => {
          console.log('Base64 conversion successful, images:', base64Images.length);
          const formDataToSet = {
            actors: actors.map((a, i) => ({
              name: a.name,
              imageBuffer: base64Images[i]
            })),
            preview: actors.map(a => ({
              name: a.name,
              imagePreview: a.imagePreview
            })),
            includes: INCLUDES,
            startTime
          };
          console.log('FormData actors array length:', formDataToSet.actors.length);
          setFormData(formDataToSet);
        })
        .catch(err => {
          console.error('Failed to convert images to base64:', err);
          setError('Failed to process images. Please try again.');
          setFormData(null);
        });
    } else {
      setFormData(null);
    }
  }, [actors, startTime]);

  const updateActorName = (index: number, value: string) => {
    const filteredValue = value.replace(/[^a-zA-Z0-9_ ]/g, '');

    if (filteredValue.length > 12) {
      setError('Name must be 12 characters or less');
      return;
    }

    setActors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: filteredValue };
      return updated;
    });
  };

  const handleImageChange = (index: number, croppedImageData: CroppedImageData) => {
    objectUrlsRef.current.push(croppedImageData.objectUrl);

    setActors(prev => {
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

        <h1 className="order-form-title">Episode Creator</h1>

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

          {actors.map((actor, index) => (
            <section key={index} className="section actor-section">
              <h2>Actor {index + 1}</h2>
              <div className="actor-content">
                <ImageUpload
                  imagePreview={actor.imagePreview}
                  hasImage={actor.imageBlob !== null}
                  onImageChange={(croppedImageData) => handleImageChange(index, croppedImageData)}
                  onError={setError}
                  inputId={`diodudes-f${index}-image`}
                />
                <div className="actor-fields">
                  <div className="field">
                    <label htmlFor={`diodudes-f${index}-name`}>Enter Name:</label>
                    <input
                      id={`diodudes-f${index}-name`}
                      type="text"
                      required
                      maxLength={12}
                      value={actor.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateActorName(index, e.target.value)}
                      placeholder="*Up to 12 Characters"
                      disabled={showCheckoutModal}
                    />
                  </div>
                </div>
              </div>
            </section>
          ))}

          <section className="section">
            <h2>Select Start Time</h2>
            <TimeslotPicker onSelect={setStartTime} />
          </section>

          {error && <div className="order-form-error">{error}</div>}

          <button
            type="button"
            className="primary checkout-btn"
            disabled={!actors.every(a => a.name.trim() !== '' && a.imageBlob !== null) || !startTime}
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
          channelId={getIdByNetwork('Dio Dudes')}
          onClose={() => setShowCheckoutModal(false)}
          onError={setError}
        />
      )}
    </div>
  );
}
