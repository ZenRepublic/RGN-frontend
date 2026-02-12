import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { ProfileDisplay } from '@/components/ProfileDisplay';
import { UpdateProfileModal } from '@/components/UpdateProfileModal';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useAccount } from '@/context/AccountContext';
import EpisodeLoader from '@/components/EpisodeLoader';
import { getIdByNetwork } from '@/channels';
import type { ActorData } from '@/components/ActorInfoForm';
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
  const { setAccount } = useAccount();
  const { update, reset: resetUpdate, step: updateStep } = useUpdateProfile();
  const [updateProfileOpen, setUpdateProfileOpen] = useState(false);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!account?.avatar) {
      setAvatarBlob(null);
      return;
    }
    fetch(account.avatar)
      .then(res => res.blob())
      .then(setAvatarBlob)
      .catch(() => setAvatarBlob(null));
  }, [account?.avatar]);

  useEffect(() => {
    if (updateStep.status === 'success') {
      if (updateStep.account) setAccount(updateStep.account);
      setUpdateProfileOpen(false);
      resetUpdate();
    }
  }, [updateStep.status, updateStep.account, setAccount, resetUpdate]);

  const handleUpdateProfileConfirm = (actorData: ActorData) => {
    update(actorData);
  };

  const handleUpdateProfileClose = () => {
    if (updateStep.status === 'getting-challenge' || updateStep.status === 'signing' || updateStep.status === 'updating') return;
    resetUpdate();
    setUpdateProfileOpen(false);
  };

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
          <div className="account-header-right">
            <button
              className="edit-profile-button"
              onClick={() => setUpdateProfileOpen(true)}
            >
              Edit
            </button>
            <ConnectWalletButton />
          </div>
        </div>

        <ProfileDisplay
          loading={accountLoading}
          account={account}
        />

        <UpdateProfileModal
          isOpen={updateProfileOpen}
          onClose={handleUpdateProfileClose}
          onConfirm={handleUpdateProfileConfirm}
          initialData={account ? { name: account.displayName, imageBlob: avatarBlob, imageBuffer: null } : undefined}
          step={updateStep}
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
            channelId={getIdByNetwork('Dio Dudes')}
            onError={(message: string) => console.error(message)}
            loadingText="Loading your Episodes..."
            emptyText="No Episodes found for this collection."
          />
        </div>
      </div>
    </div>
  );
}
