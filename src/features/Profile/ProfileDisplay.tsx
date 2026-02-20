import { useState } from 'react';
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
  const [updateProfileOpen, setUpdateProfileOpen] = useState(false);

  const handleUpdateProfileConfirm = async (actorData: ActorData) => {
    const updatedAccount = await update(actorData);
    if (updatedAccount) setAccount(updatedAccount);
  };

  const handleUpdateProfileClose = () => {
    setUpdateProfileOpen(false);
  };

  return (
    <>
    <div className="frosted-card">
      {loading && (
        <div className="text-center">
          <p>Loading account information...</p>
        </div>
      )}

      {!loading && account && (
        <>
          <div className="flex gap-2xl">
              <img
                src={account.avatar || '/Images/mystery-actor.png'}
                alt={account.displayName}
                className="w-[160px] h-[160px] rounded-lg border-lg border-white shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = '/Images/mystery-actor.png';
                }}
              />

              <div className='flex flex-col w-full justify-between'>
                <div className="flex flex-col">
                  <h2>{account.displayName}</h2>
                  <p className="highlight">Joined {getShortYearMonthDayDate(new Date(account.createdAt))}</p>
                </div>
                <div className="flex justify-end gap-lg">
                  <button className="primary" onClick={() => setUpdateProfileOpen(true)}>Edit</button>
                  <ConnectWalletButton />
                </div>
              </div>
            </div>

          <div className="frosted-card-divider-h" />
          <div className="frosted-card-inner">
            {votePowerLoading ? (
              <p className="text-center">Loading stats...</p>
            ) : votePower ? (
              <div className="w-full flex">
                <div className="flex flex-1 flex-col items-center gap-md">
                  <div className="flex gap-md">
                    <img src="/Branding/logo.png" alt="RGN Token" className="w-[40px] h-[40px] rounded-full" />
                    <span className="number">{formatTokenBalance(votePower.tokenBalance)}</span>
                  </div>
                  <button className="special-small" onClick={() => setShowQuickBuy(true)}>+ Get More</button>
                </div>
                <div className="frosted-card-divider-v" />
                <div className="flex flex-1 flex-col justify-center items-center">
                    <div className="flex items-center gap-md">
                      <span className="text-white text-sm opacity-80 text-right">TIER:</span>
                      <span className="text-white font-bold">{votePower.tiers.find(t => t.votePower === votePower.votePower)?.title || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-md">
                      <span className="text-white text-sm opacity-80 text-right">POWER:</span>
                      <span className="text-white font-bold">{votePower.votePower}</span>
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
      initialData={account ? { name: account.displayName, imageUrl: account.avatar, imageBlob: null, imageBuffer: null } : undefined}
    />
    </>
  );
}
