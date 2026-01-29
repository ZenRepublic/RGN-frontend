import { useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SimulationProps } from '../types/simulation';
import { useIsInAppWalletBrowser } from '@/utils/walletUtils';
import SimulationDisplay from '@/components/SimulationDisplay';
import MatchLoader from '@/components/MatchLoader';
import './DioDudes.css';

const DEMO_VIDEO_URL = 'https://arweave.net/3WReLIrdjuqEnV1buT9CbYXRhhBJ5fEXQmQ19pUXS5o?ext=mp4';

// Hardcoded collection ID for DioDudes simulations
const COLLECTION_ID = '9VMfraMtZao8d27ScRx6qvqGTzW2Md9vQv5YZyAopPQx';

interface HistoryDisplayProps {
  onLoadComplete?: () => void;
}

function HistoryDisplay({ onLoadComplete }: HistoryDisplayProps) {
  return (
    <MatchLoader
      mode="collection"
      collectionId={COLLECTION_ID}
      onLoadComplete={onLoadComplete}
      loadingText="Loading match history..."
      emptyText="No matches found."
    />
  );
}

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
  const [activeTab, setActiveTab] = useState<'history' | 'my-sims'>('history');
  const [isTabLoading, setIsTabLoading] = useState(false);

  const isWhitelisted = useMemo(() => {
    if (!connected || !publicKey) return false;
    const whitelistIds = getWhitelistIds();
    return whitelistIds.includes(publicKey.toBase58().toLowerCase());
  }, [connected, publicKey]);

  const handleTabChange = (tab: 'history' | 'my-sims') => {
    // Hide video while new tab loads (releases GPU resources)
    setIsTabLoading(true);
    setActiveTab(tab);
  };

  const handleTabLoaded = () => {
    // Show video again after tab finishes loading
    setIsTabLoading(false);
  };

  return (
    <>
      <section className="about-section">
        <p>
          1v1 Boxing match between AI agents, trained to kick their opponent's ass with physics-based punches!
        </p>
        {!inWalletBrowser && !isTabLoading && (
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
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleTabChange('history')}
        >
          History
        </button>

        <button
          className={`tab-button ${activeTab === 'my-sims' ? 'active' : ''}`}
          onClick={() => handleTabChange('my-sims')}
          disabled={!isWhitelisted}
        >
          My Sims
        </button>
      </div>

      {activeTab === 'history' && (
        <HistoryDisplay onLoadComplete={handleTabLoaded} />
      )}

      {activeTab === 'my-sims' && (
        <SimulationDisplay
          collectionId={COLLECTION_ID}
          orderUrl="/diodudes/order"
          onError={onError}
          onLoadComplete={handleTabLoaded}
        />
      )}
    </>
  );
}
