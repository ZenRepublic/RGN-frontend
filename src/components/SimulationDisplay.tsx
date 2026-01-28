import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWalletButton } from './ConnectWalletButton';
import MatchLoader from './MatchLoader';
import './SimulationDisplay.css';

interface SimulationDisplayProps {
  collectionId: string;
  orderUrl?: string;
  onError?: (message: string) => void;
  onLoadComplete?: () => void;
}

export default function SimulationDisplay({ collectionId, orderUrl, onError, onLoadComplete }: SimulationDisplayProps) {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();

  return (
    <>
      <div className="sim-display">
        {orderUrl && (
          <div className="sim-display-header">
            <button
              className="sim-display-new-order-btn"
              onClick={() => navigate(orderUrl)}
            >
              + New Order
            </button>
          </div>
        )}

        {!connected || !publicKey ? (
          <div className="sim-display-wallet-prompt">
            <h2>Connect Your Wallet to Proceed</h2>
            <div className="sim-display-wallet-button">
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
            loadingText="Loading your simulations..."
            emptyText="No simulations found for this collection."
          />
        )}
      </div>
    </>
  );
}
