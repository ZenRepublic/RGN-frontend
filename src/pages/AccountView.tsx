import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { ProfileDisplay } from '@/components/ProfileDisplay';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import EpisodeLoader from '@/components/EpisodeLoader';
import './AccountView.css';

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

export default function AccountView() {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();
  const { account, loading: accountLoading } = useAccountStatus();

  const isWhitelisted = useMemo(() => {
    if (!connected || !publicKey) return false;
    const whitelistIds = getWhitelistIds();
    return whitelistIds.includes(publicKey.toBase58().toLowerCase());
  }, [connected, publicKey]);

  useEffect(() => {
    if (!connected) {
      navigate('/', { replace: true });
    }
  }, [connected, navigate]);

  if (!connected) {
    return null;
  }

  const walletAddress = publicKey?.toBase58() ?? '';

  return (
    <div className="account-view">
      <Header />

      <div className="account-container">
        <div className="account-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <ConnectWalletButton />
        </div>

        <ProfileDisplay
          loading={accountLoading}
          account={account}
        />

        <div className="episodes-section">
          <div className="episodes-header">
            <h2>My Episodes</h2>
            <button
              className="create-new-button"
              onClick={() => navigate('/diodudes/order')}
              disabled={!isWhitelisted}
            >
              + Create New
            </button>
          </div>
          <EpisodeLoader
            mode="owner"
            ownerAddress={walletAddress}
            collectionId={getCollectionAddress()}
            onError={(message: string) => console.error(message)}
            loadingText="Loading your Episodes..."
            emptyText="No Episodes found for this collection."
          />
        </div>
      </div>
    </div>
  );
}
