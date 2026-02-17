import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { SectionHeader } from '@/primitives';
import { ProfileDisplay } from './ProfileDisplay';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import EpisodeLoader from '@/features/Episodes/EpisodeLoader';
import { getIdByNetwork } from '@/features/Channel';
import './AccountView.css';

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
    <div>
      <Header />
      <h1>Account Details</h1>
      <div className="account-container">
        <ProfileDisplay
          loading={accountLoading}
          account={account}
        />

        <div className="episodes-section">
          <SectionHeader
            title="My Episodes"
            actions={[
              <button
                key="create-new"
                className="secondary"
                onClick={() => navigate('/diodudes/order')}
                disabled={!isWhitelisted}
              >
                Create New
              </button>
            ]}
          />
          <EpisodeLoader
            mode="owner"
            ownerAddress={walletAddress}
            channelId={getIdByNetwork('Dio Dudes')}
            onError={(message: string) => console.error(message)}
            loadingText="Loading your Episodes..."
            emptyText="No Episodes found for this channel."
          />
        </div>
      </div>
    </div>
  );
}
