import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { ProfileDisplay } from './ProfileDisplay';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { useOrdersByOwner } from '@/hooks/useOrdersByOwner';
import EpisodeGrid from '@/features/Episodes/EpisodeGrid';
import { getIdByNetwork } from '@/features/Channel';

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

  const walletAddress = publicKey?.toBase58() ?? '';
  const { orders, loading: episodesLoading } = useOrdersByOwner(walletAddress, getIdByNetwork('Dio Dudes'));

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

  return (
    <div>
      <Header />
      <h1 className='mb-lg'>Account Details</h1>
      <ProfileDisplay
        loading={accountLoading}
        account={account}
      />

      <div className="mt-xl">
        <div className="flex justify-between items-center mb-2xl">
          <h2>My Episodes</h2>
          <button
            className="secondary"
            onClick={() => navigate('/diodudes/order')}
            disabled={!isWhitelisted}
          >
            Create New
          </button>
        </div>
        <EpisodeGrid
          orders={orders}
          loading={episodesLoading}
          loadingText="Loading your Episodes..."
          emptyText="No Episodes found for this channel."
        />
      </div>
    </div>
  );
}
