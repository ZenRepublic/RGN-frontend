import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ConnectWalletButton } from './ConnectWalletButton';
import './Header.css';

const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const PUMPSWAP_URL = `https://swap.pump.fun/?output=${TOKEN_ADDRESS}&input=${SOL_ADDRESS}`;

export function Header() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header when scrolling up or at the top
      if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
        setVisible(true);
      } else {
        // Hide when scrolling down (past initial threshold)
        setVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`sticky-header ${visible ? 'visible' : 'hidden'}`}>
      <div className="header-row">
        <div className="header-left">
          <Link to="/" className="header-logo-link" aria-label="Go to home">
            <img src="/LogoTransparent.png" alt="RGN Logo" className="header-logo" />
          </Link>
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

        <div className="header-right">
          <ConnectWalletButton />
        </div>
      </div>
    </div>
  );
}
