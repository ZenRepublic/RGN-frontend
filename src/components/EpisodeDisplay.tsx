import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWalletButton } from './ConnectWalletButton';
import MatchLoader from './MatchLoader';
import './EpisodeDisplay.css';

interface EpisodeDisplayProps {
  collectionId: string;
  orderUrl?: string;
  onError?: (message: string) => void;
  onLoadComplete?: () => void;
}

export default function EpisodeDisplay({ collectionId, orderUrl, onError, onLoadComplete }: EpisodeDisplayProps) {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();

  return (
    <>
      <div className="episode-display">
        {orderUrl && (
          <div className="episode-display-header">
            <button
              className="episode-display-new-order-btn"
              onClick={() => navigate(orderUrl)}
            >
              + Create New
            </button>
          </div>
        )}

        {!connected || !publicKey ? (
          <div className="episode-display-wallet-prompt">
            <h2>Connect Your Wallet to Proceed</h2>
            <div className="episode-display-wallet-button">
              <ConnectWalletButton />
            </div>
          </div>
        ) : (
          <MatchLoader
            mode="owner"
            ownerAddress={publicKey.toBase58()}
            collectionId={collectionId}
            onError={onError}
            onLoadComplete={onLoadComplete}
            loadingText="Loading your Episodes..."
            emptyText="No Episodes found for this collection."
          />
        )}
      </div>
    </>
  );
}
