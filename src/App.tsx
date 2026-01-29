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
