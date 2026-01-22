import { useState, useEffect, useCallback } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { ConnectWalletButton } from '@/components/ConnectWalletButton'; 
import { SIMULATIONS } from './simulations';
import { SimulationFormData } from './types/simulation';
import CheckoutModal from './components/CheckoutModal';
import './App.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

interface PaymentInfo {
  success: boolean;
  price: string;
  wallet: string;
}

function App() {
  // Simulation state
  const [activeSimulationId, setActiveSimulationId] = useState(SIMULATIONS[0]?.id || '');
  const [formData, setFormData] = useState<SimulationFormData | null>(null);

  const [error, setError] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Payment info from backend
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  // Get active simulation config
  const activeSimulation = SIMULATIONS.find(s => s.id === activeSimulationId);
  const ActiveSimulationComponent = activeSimulation?.component;

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

  const handleFormDataChange = useCallback((data: SimulationFormData | null) => {
    setFormData(data);
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  return (
    <div className="app">
      <header>
        <div className="social-links">
          <a href="https://x.com/RGN_Forever" target="_blank" rel="noopener noreferrer" aria-label="Follow us on X">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* <a href="https://youtube.com/@YourChannel" target="_blank" rel="noopener noreferrer" aria-label="Subscribe on YouTube">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
         
          <a href="https://tiktok.com/@YourAccount" target="_blank" rel="noopener noreferrer" aria-label="Follow us on TikTok">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          </a> */}
         
        </div>
          <ConnectWalletButton />
        <img src="/BannerWithLogo.png" alt="RGN Banner" className="banner" />
        <h1 style={{ textAlign: 'left' }}>Onchain Brainrot Broadcast</h1>
        <p style={{ textAlign: 'left' }}>Stop consuming brainrot - it's time to own it... <br /> <br /> Select a channel, set your actors, and receive an organically recorded NFT with a short-form video you can share anywhere to interact with your internet friends and increase your mindshare!</p>
      </header>

      <div className="tab-group">
        {SIMULATIONS.map(sim => (
          <button
            key={sim.id}
            className={`tab-btn ${activeSimulationId === sim.id ? 'active' : ''}`}
            disabled={sim.disabled}
            onClick={() => !sim.disabled && setActiveSimulationId(sim.id)}
          >
            {sim.name}
          </button>
        ))}
        <button className="tab-btn" disabled>More Soon...</button>
      </div>

      {ActiveSimulationComponent && (
        <>
          <ActiveSimulationComponent
            onFormDataChange={handleFormDataChange}
            onError={handleError}
            onCheckout={() => setShowCheckoutModal(true)}
            disabled={showCheckoutModal}
          />

          {error && <div className="error">{error}</div>}
        </>
      )}

      {formData && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          formData={formData}
          paymentInfo={paymentInfo}
          activeSimulationId={activeSimulationId}
          onClose={() => setShowCheckoutModal(false)}
          onError={handleError}
        />
      )}

      <footer className="powered-by">
        <span>Powered by</span>
        <img src="/mplx_logo.png" alt="Metaplex" />
      </footer>
      <SpeedInsights />
    </div>
  );
}

export default App;
