import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ConnectWalletButton } from './ConnectWalletButton';
import './Header.css';

const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
const JUPITER_URL = `https://jup.ag/swap?sell=So11111111111111111111111111111111111111112&buy=${TOKEN_ADDRESS}`;

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
        </div>

        <div className="header-right">
          <a
            href={TOKEN_ADDRESS ? JUPITER_URL : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`buy-token-btn ${!TOKEN_ADDRESS ? 'disabled' : ''}`}
            onClick={e => !TOKEN_ADDRESS && e.preventDefault()}
            aria-disabled={!TOKEN_ADDRESS}
          >
            Get $RGN
          </a>
          <ConnectWalletButton />
        </div>
      </div>
    </div>
  );
}
