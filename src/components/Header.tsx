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
