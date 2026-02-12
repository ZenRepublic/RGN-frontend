import { useEffect, useState } from 'react';
import './ProfileDisplay.css';
import { QuickBuy } from './QuickBuy';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

interface VotePowerData {
  tokenBalance: number;
  votePower: number;
  tiers: Array<{
    title: string;
    minTokens: number;
    votePower: number;
  }>;
}

interface ProfileDisplayProps {
  loading: boolean;
  account: {
    _id: string;
    avatar: string | null;
    displayName: string;
    createdAt: string;
  } | null;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function ProfileDisplay({ loading, account }: ProfileDisplayProps) {
  const [votePower, setVotePower] = useState<VotePowerData | null>(null);
  const [votePowerLoading, setVotePowerLoading] = useState(false);
  const [showQuickBuy, setShowQuickBuy] = useState(false);

  useEffect(() => {
    if (!account?._id) return;

    const fetchVotePower = async () => {
      try {
        setVotePowerLoading(true);
        const response = await fetch(`${API_URL}/rgn/account/${account._id}/vote-power`);
        console.log(response)
        if (!response.ok) throw new Error('Failed to fetch vote power');
        const data = await response.json();
        setVotePower(data);
      } catch (error) {
        console.error('Error fetching vote power:', error);
      } finally {
        setVotePowerLoading(false);
      }
    };

    fetchVotePower();
  }, [account?._id]);

  const formatTokenBalance = (balance: number): string => {
    if (balance >= 1000000) {
      return (balance / 1000000).toFixed(2) + 'M';
    }
    if (balance >= 1000) {
      return (balance / 1000).toFixed(2) + 'K';
    }
    return balance.toString();
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
          <div className="profile-top">
            <div className="profile-image-section">
              <img
                src={account.avatar || '/mystery-actor.png'}
                alt={account.displayName}
                className="profile-image"
                onError={(e) => {
                  e.currentTarget.src = '/mystery-actor.png';
                }}
              />
            </div>

            <div className="profile-info-section">
              <h2 className="profile-username">{account.displayName}</h2>
              <p className="profile-joined">Joined {formatDate(account.createdAt)}</p>
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
                    <img src="/RGNTokenLogo.png" alt="RGN Token" className="token-logo" />
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
