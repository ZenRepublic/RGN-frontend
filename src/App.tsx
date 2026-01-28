import { useState, useCallback } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { SIMULATIONS } from './simulations';
import './App.css';

function App() {
  const [activeSimulationId, setActiveSimulationId] = useState(SIMULATIONS[0]?.id || '');
  const [error, setError] = useState('');

  const activeSimulation = SIMULATIONS.find(s => s.id === activeSimulationId);
  const ActiveSimulationComponent = activeSimulation?.component;

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
          <ActiveSimulationComponent onError={handleError} />
          {error && <div className="error">{error}</div>}
        </>
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
