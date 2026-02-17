import { useEffect, useState } from 'react';
import './ProfileDisplay.css';
import { QuickBuy } from '@/components/QuickBuy';
import { ConnectWalletButton } from '@/primitives/buttons/ConnectWalletButton';
import { useAccountVotePower } from '@/hooks/useAccountVotePower';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useAccount } from '@/context/AccountContext';
import { UpdateProfileModal } from './UpdateProfileModal';
import { formatTokenBalance } from '@/utils'
import { getShortYearMonthDayDate } from '@/utils'
import type { ActorData } from '@/features/EpisodeForm/ActorInfoForm';

interface ProfileDisplayProps {
  loading: boolean;
  account: {
    _id: string;
    avatar: string | null;
    displayName: string;
    createdAt: string;
  } | null;
}

export function ProfileDisplay({ loading, account }: ProfileDisplayProps) {
  const { votePower, loading: votePowerLoading } = useAccountVotePower(account?._id);
  const { setAccount } = useAccount();
  const update = useUpdateProfile();
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [updateProfileOpen, setUpdateProfileOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

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

  const handleUpdateProfileConfirm = async (actorData: ActorData) => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const updatedAccount = await update(actorData);
      if (updatedAccount) setAccount(updatedAccount);
      setUpdateProfileOpen(false);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateProfileClose = () => {
    if (isUpdating) return;
    setUpdateError(null);
    setUpdateProfileOpen(false);
  };

  return (
    <>
    <div className="account-card">
      {loading && (
        <div className="loading-state">
          <p>Loading account information...</p>
        </div>
      )}

      {!loading && account && (
        <>
          <div className="card-actions">
            <button className="primary" onClick={() => setUpdateProfileOpen(true)}>Edit</button>
            <ConnectWalletButton />
          </div>

          <div className="profile-top">
            <div className="profile-image-section">
              <img
                src={account.avatar || '/Images/mystery-actor.png'}
                alt={account.displayName}
                className="profile-image"
                onError={(e) => {
                  e.currentTarget.src = '/Images/mystery-actor.png';
                }}
              />
            </div>

            <div className="profile-info-section">
              <h2 className="profile-username">{account.displayName}</h2>
              <p className="profile-joined">Joined {getShortYearMonthDayDate(account.createdAt)}</p>
            </div>
          </div>

          <div className="profile-divider" />
          <div className="profile-stats">
            {votePowerLoading ? (
              <div className="vote-tier-loading">Loading vote tier...</div>
            ) : votePower ? (
              <div className="vote-tier-container">
                <div className="vote-tier-left">
                  <div className="token-balance">
                    <img src="/Branding/logo.png" alt="RGN Token" className="token-logo" />
                    <span className="token-amount">{formatTokenBalance(votePower.tokenBalance)}</span>
                  </div>
                  <button className="special-small" onClick={() => setShowQuickBuy(true)}>+ Get More</button>
                </div>
                <div className="vote-tier-divider" />
                <div className="vote-tier-right">
                  <div className="tier-info">
                    <span className="tier-stat"><span className="tier-stat-label">Tier: </span><span className="tier-stat-value">{votePower.tiers.find(t => t.votePower === votePower.votePower)?.title || 'Unknown'}</span></span>
                    <span className="tier-stat"><span className="tier-stat-label">Vote Power: </span><span className="tier-stat-value">⭐ {votePower.votePower}</span></span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
    <QuickBuy isOpen={showQuickBuy} onClose={() => setShowQuickBuy(false)} />
    <UpdateProfileModal
      isOpen={updateProfileOpen}
      onClose={handleUpdateProfileClose}
      onConfirm={handleUpdateProfileConfirm}
      initialData={account ? { name: account.displayName, imageBlob: avatarBlob, imageBuffer: null } : undefined}
      isLoading={isUpdating}
      error={updateError ?? undefined}
    />
    </>
  );
}
