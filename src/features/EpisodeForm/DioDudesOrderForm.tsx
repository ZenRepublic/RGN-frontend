import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useToast } from '@/context/ToastContext';
import ActorInfoForm, { ActorData, createDefaultActor } from '@/features/EpisodeForm/ActorInfoForm';
import CheckoutModal from '@/features/EpisodeForm/CheckoutModal';
import TimeslotPicker from '@/features/EpisodeForm/TimeslotPicker';
import { EpisodeOrderFormData } from '@/types/channel';
import { getIdByNetwork } from '@/features/Channel';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

interface PaymentInfo {
  success: boolean;
  price: string;
  wallet: string;
}

const DEFAULT_ACTORS: ActorData[] = [createDefaultActor(), createDefaultActor()];

const INCLUDES = [
  'Dio Dudes AI Battle Video',
  'NFT with your Actors',
  'Permanent on-chain storage'
];

export default function DioDudesOrderForm() {
  const navigate = useNavigate();
  const { showToast } = useToast();

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
      } catch {
        showToast('Failed to fetch payment info');
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
      <div className="flex flex-col gap-xl">
        <div className='flex justify-between'>
          <button onClick={handleBack} className="back">
            ← Back
          </button>

          <h1>Episode Creator</h1>
        </div>

        {actors.map((_actor, index) => (
          <div key={index} className='flex flex-col gap-sm'>
            <h2>Actor {index + 1}</h2>
            <div className='bg-bg-secondary p-xl rounded-lg border-md border-bg-secondary'>
              <ActorInfoForm
                onChange={(data) => updateActor(index, data)}
                disabled={showCheckoutModal}
              />
            </div>
          </div>
        ))}

        <div className='flex flex-col gap-sm'>
          <h2>Select Start Time</h2>
          <TimeslotPicker onSelect={setStartTime} />
        </div>

        <div className="flex justify-end">
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
        />
      )}
    </>
  );
}
