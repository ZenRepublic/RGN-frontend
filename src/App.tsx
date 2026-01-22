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
        <div className="header-row">
          <div className="social-links">
            <a
              href="https://x.com/RGN_Forever"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on X"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* Add more social links here */}
          </div>

          <ConnectWalletButton />
        </div>
        <img src="/BannerWithLogo.png" alt="RGN Banner" className="banner" />
        <h1>Onchain Brainrot Broadcast</h1>
        <p>Stop consuming brainrot - it's time to own it... <br /> <br /> Select a channel, set your actors, and receive an organically recorded NFT with a short-form video you can share anywhere to interact with your internet friends and increase your mindshare!</p>
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
