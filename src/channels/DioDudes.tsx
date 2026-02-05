import { useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ChannelProps } from './channel';
import { useIsInAppWalletBrowser } from '@/utils/walletUtils';
import EpisodeDisplay from '@/components/EpisodeDisplay';
import EpisodeSchedule from '@/components/EpisodeSchedule';
import './DioDudes.css';

const DEMO_VIDEO_URL = 'https://arweave.net/l6NCKjO5cvPkm7w_3BU9bAseJIPJ4sj9v1xOCj65wZg?ext=mp4';

// Get network from environment
const getNetwork = (): 'mainnet' | 'devnet' =>
    (import.meta.env.VITE_SOL_NETWORK as 'mainnet' | 'devnet') || 'devnet';

// DioDudes collection addresses
const COLLECTION_ADDRESSES = {
    devnet: '5Lu2U98R63iXJoboeLQePZKZprkt2qbn45XvpYGNSawP',
    mainnet: 'AAomnYW22PbNPu2tuQ5TzeqGCkacUey64Khsv3t6grJa'
};

const getCollectionAddress = () => COLLECTION_ADDRESSES[getNetwork()];



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

export default function DioDudes({ onError }: ChannelProps) {
  const { connected, publicKey } = useWallet();
  const inWalletBrowser = useIsInAppWalletBrowser();
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'my-sims'>('schedule');
  const [isTabLoading, setIsTabLoading] = useState(false);

  const isWhitelisted = useMemo(() => {
    if (!connected || !publicKey) return false;
    const whitelistIds = getWhitelistIds();
    return whitelistIds.includes(publicKey.toBase58().toLowerCase());
  }, [connected, publicKey]);

  const handleTabChange = (tab: 'schedule' | 'my-sims') => {
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
          className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => handleTabChange('schedule')}
        >
          Schedule
        </button>

        <button
          className={`tab-button ${activeTab === 'my-sims' ? 'active' : ''}`}
          onClick={() => handleTabChange('my-sims')}
          disabled={!isWhitelisted}
        >
          My Sims
        </button>
      </div>

      {activeTab === 'schedule' && (
        <EpisodeSchedule
          collectionId={getCollectionAddress()}
          onError={onError}
        />
      )}

      {activeTab === 'my-sims' && (
        <EpisodeDisplay
          collectionId={getCollectionAddress()}
          orderUrl="/diodudes/order"
          onError={onError}
          onLoadComplete={handleTabLoaded}
        />
      )}
    </>
  );
}
