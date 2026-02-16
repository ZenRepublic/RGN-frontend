import './MenuStack.css';
import { ImageButton } from '@/primitives';

export function MenuStack() {
  const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
  const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
  const PUMPSWAP_URL = `https://swap.pump.fun/?output=${TOKEN_ADDRESS}&input=${SOL_ADDRESS}`;

  return (
    <div className="menu-items">
      <ImageButton
        href="https://hackmd.io/@8M-xMt20QZyakYyaxdBBTA/SJrR9h2IZe"
        target="_blank"
        rel="noopener noreferrer"
        ariaLabel="View Litepaper"
        className="litepaper-btn"
      >
        <img src="/Icons/LitepaperIcon.png" alt="Litepaper" className="litepaper-icon" />
      </ImageButton>
      <ImageButton
        href={TOKEN_ADDRESS ? PUMPSWAP_URL : undefined}
        target="_blank"
        rel="noopener noreferrer"
        disabled={!TOKEN_ADDRESS}
        ariaLabel="Buy on PumpSwap"
        ariaDisabled={!TOKEN_ADDRESS}
        className="pumpswap-btn"
      >
        <img src="/Logos/pumpfun_logo.png" alt="PumpSwap" className="pumpswap-icon" />
      </ImageButton>
    </div>
  );
}
