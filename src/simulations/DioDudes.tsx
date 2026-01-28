import { useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SimulationProps } from '../types/simulation';
import { useIsInAppWalletBrowser } from '@/utils/walletUtils';
import SimulationDisplay from '@/components/SimulationDisplay';
import TournamentDisplay from '@/components/TournamentDisplay';
import './DioDudes.css';

const DEMO_VIDEO_URL = 'https://arweave.net/3WReLIrdjuqEnV1buT9CbYXRhhBJ5fEXQmQ19pUXS5o?ext=mp4';

// Hardcoded collection ID for DioDudes simulations
const COLLECTION_ID = '9VMfraMtZao8d27ScRx6qvqGTzW2Md9vQv5YZyAopPQx';

function getWhitelistIds(): string[] {
  const whitelistIdsRaw = import.meta.env.VITE_WHITELIST_IDS || '';
  if (!whitelistIdsRaw) return [];

  try {
    return (JSON.parse(whitelistIdsRaw) as string[]).map(id => id.toLowerCase());
  } catch {
    return whitelistIdsRaw
      .split(',')
      .map((id: string) => id.trim().toLowerCase())
      .filter(Boolean);
  }
}

export default function DioDudes({ onError }: SimulationProps) {
  const { connected, publicKey } = useWallet();
  const inWalletBrowser = useIsInAppWalletBrowser();
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'my-sims'>('tournaments');

  const isWhitelisted = useMemo(() => {
    if (!connected || !publicKey) return false;
    const whitelistIds = getWhitelistIds();
    return whitelistIds.includes(publicKey.toBase58().toLowerCase());
  }, [connected, publicKey]);

  return (
    <>
      <section className="about-section">
        <p>
          1v1 Physics-based Boxing Fight of RL-trained Agents. Create the match of the ages, in which the victor will be forever inscribed on the blockchain!
        </p>
        {!inWalletBrowser && (
          <div className="video-container">
            {!videoError ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
              >
                <source src={DEMO_VIDEO_URL} type="video/mp4" />
              </video>
            ) : (
              <div className="video-loading">
                <span>Video unavailable</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Tab navigation */}
      <div className="tab-buttons">
        <button
          className={`tab-button ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          Tournaments
        </button>

        <button
          className={`tab-button ${activeTab === 'my-sims' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-sims')}
          disabled={!isWhitelisted}
        >
          My Sims
        </button>
      </div>

      {activeTab === 'tournaments' && (
        <TournamentDisplay />
      )}

      {activeTab === 'my-sims' && (
        <SimulationDisplay
          collectionId={COLLECTION_ID}
          orderUrl="/diodudes/order"
          onError={onError}
        />
      )}
    </>
  );
}
