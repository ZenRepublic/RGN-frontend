import { useState, useCallback } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Header } from '@/components/Header';
import { CHANNELS } from './channels';
import './App.css';

const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const PUMPSWAP_URL = `https://swap.pump.fun/?output=${TOKEN_ADDRESS}&input=${SOL_ADDRESS}`;

function App() {
  const [activeChannelName, setActiveChannelName] = useState(CHANNELS[0]?.name || '');
  const [error, setError] = useState('');

  const activeChannel = CHANNELS.find(s => s.name === activeChannelName);
  const ActiveChannelComponent = activeChannel?.component;

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  return (
    <div className="app">
      <Header />

      <header>
        <img src="/Branding/BannerWithLogo.png" alt="RGN Banner" className="banner" />
        <div className="menu-items">
          <a
            href="https://hackmd.io/@8M-xMt20QZyakYyaxdBBTA/SJrR9h2IZe"
            target="_blank"
            rel="noopener noreferrer"
            className="litepaper-btn"
            aria-label="View Litepaper"
          >
            <img src="/Icons/LitepaperIcon.png" alt="Litepaper" className="litepaper-icon" />
          </a>
          <a
            href={TOKEN_ADDRESS ? PUMPSWAP_URL : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`pumpswap-btn ${!TOKEN_ADDRESS ? 'disabled' : ''}`}
            onClick={e => !TOKEN_ADDRESS && e.preventDefault()}
            aria-label="Buy on PumpSwap"
            aria-disabled={!TOKEN_ADDRESS}
          >
            <img src="/Logos/pumpfun_logo.png" alt="PumpSwap" className="pumpswap-icon" />
          </a>
        </div>
        <h1>Unleash The Brainrot!</h1>
        <p>RGN is the world's first  <span className="highlight">onchain brainrot</span> broadcast network. <br /><br /> Select one of available channels, drop your favorite characters in and watch them compete for eternal glory on Solana!</p>
      </header>
      

      <div className="tab-group">
        {CHANNELS.map(channel => (
          <button
            key={channel.name}
            className={`tab-btn ${activeChannelName === channel.name ? 'active' : ''}`}
            disabled={channel.disabled}
            onClick={() => !channel.disabled && setActiveChannelName(channel.name)}
          >
            {channel.name}
          </button>
        ))}
        <button className="tab-btn" disabled>More Soon...</button>
      </div>

      {ActiveChannelComponent && (
        <>
          <ActiveChannelComponent onError={handleError} />
          {error && <div className="error">{error}</div>}
        </>
      )}

      <footer className="powered-by">
        <span>Powered by</span>
        <img src="/Logos/mplx_logo.png" alt="Metaplex" />
      </footer>
      <SpeedInsights />
    </div>
  );
}

export default App;
