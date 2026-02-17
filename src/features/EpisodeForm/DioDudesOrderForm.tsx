import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import ActorInfoForm, { ActorData, createDefaultActor } from '@/features/EpisodeForm/ActorInfoForm';
import CheckoutModal from '@/features/EpisodeForm/CheckoutModal';
import TimeslotPicker from '@/features/EpisodeForm/TimeslotPicker';
import { EpisodeOrderFormData } from '@/types/channel';
import { getIdByNetwork } from '@/features/Channel';
import './DioDudesOrderForm.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

interface PaymentInfo {
  success: boolean;
  price: string;
  wallet: string;
}

const DEFAULT_ACTORS: ActorData[] = [createDefaultActor(), createDefaultActor()];

const INCLUDES = [
  'Custom AI Battle Video',
  'NFT with your Actors',
  'Permanent on-chain storage'
];

export default function DioDudesOrderForm() {
  const navigate = useNavigate();

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [formData, setFormData] = useState<EpisodeOrderFormData | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);

  const [actors, setActors] = useState<ActorData[]>(DEFAULT_ACTORS);

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
    const isValid = actors.every(a => a.name.trim() !== '' && a.imageBuffer !== null) && startTime !== null;

    if (isValid) {
      setFormData({
        actors: actors.map(a => ({ name: a.name, imageBuffer: a.imageBuffer! })),
        preview: actors.map(a => ({ name: a.name, imagePreview: a.imageBuffer! })),
        includes: INCLUDES,
        startTime
      });
    } else {
      setFormData(null);
    }
  }, [actors, startTime]);

  const updateActor = (index: number, data: ActorData) => {
    setActors(prev => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <>
      <Header />
      <div className="order-form-container">
        <button onClick={handleBack} className="back">
          ← Back
        </button>

        <h1>Episode Creator</h1>

        {actors.map((_actor, index) => (
          <div key={index}>
            <h2>Actor {index + 1}</h2>
            <ActorInfoForm
              onChange={(data) => updateActor(index, data)}
              onError={() => {}}
              disabled={showCheckoutModal}
            />
          </div>
        ))}

        <div>
          <h2>Select Start Time</h2>
          <TimeslotPicker onSelect={setStartTime} />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="secondary"
            disabled={!actors.every(a => a.name.trim() !== '' && a.imageBuffer !== null) || !startTime}
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
          onError={() => {}}
        />
      )}
    </>
  );
}
