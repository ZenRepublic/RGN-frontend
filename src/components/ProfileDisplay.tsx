import { useState } from 'react';
import './ProfileDisplay.css';
import { QuickBuy } from './QuickBuy';
import { useAccountVotePower } from '@/hooks/useAccountVotePower';
import { formatTokenBalance } from '@/utils/tokenFormatter';
import { getShortYearMonthDayDate } from '@/utils/dateTimeFormatter';

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
  const [showQuickBuy, setShowQuickBuy] = useState(false);


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
                  <button className="get-more-btn" onClick={() => setShowQuickBuy(true)}>Get More</button>
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
    </>
  );
}
