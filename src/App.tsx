import { useState, useEffect, useCallback } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"
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
