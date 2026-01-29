import { useState, useCallback } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Header } from '@/components/Header';
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
      <Header />

      <header>
        <img src="/BannerWithLogo.png" alt="RGN Banner" className="banner" />
        <div className="social-links">
          <a
            href="https://x.com/RGN_Brainrot"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on X"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://www.tiktok.com/@rgn_brainrot"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on TikTok"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
          </a>
        </div>
        <h1>Unleash The Brainrot!</h1>
        <p>RGN is the world's first onchain brainrot broadcast network. <br /><br /> Put your favorite characters in our channels and watch them compete for eternal glory on Solana!</p>
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
