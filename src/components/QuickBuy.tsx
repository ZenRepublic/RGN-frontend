import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Modal, Toast } from '../primitives';
import { executeQuickBuy } from '../services/pumpSwap';
import './QuickBuy.css';

const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
const SOL_AMOUNTS = [0.1, 0.25, 0.5];

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface QuickBuyProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickBuy({ isOpen, onClose }: QuickBuyProps) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [selectedAmount, setSelectedAmount] = useState<number>(SOL_AMOUNTS[0]);
  const [buying, setBuying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  const handleCopyCA = () => {
    if (!TOKEN_ADDRESS) return;
    navigator.clipboard.writeText(TOKEN_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleBuy = async () => {
    if (!connected || !publicKey) {
      setToastMessage('Connect your wallet first');
      setToastType('error');
      return;
    }

    if (!TOKEN_ADDRESS) {
      setToastMessage('Token address not configured');
      setToastType('error');
      return;
    }

    setBuying(true);

    const { signature, error } = await executeQuickBuy(
      connection,
      TOKEN_ADDRESS,
      selectedAmount,
      publicKey,
      sendTransaction
    );

    if (error) {
      setToastMessage(error);
      setToastType('error');
    } else if (signature) {
      setToastMessage('Transaction successful!');
      setToastType('success');
      onClose();
    }

    setBuying(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Buy"
      disabled={buying}
    >
      <img src="/Images/QuickBuy.png" alt="Quick Buy" className="art-visual" />

      <div className="quick-buy-token">
        <img src="/Branding/logo.png" alt="RGN" className="quick-buy-logo" />
        <div className="quick-buy-token-info">
          <span className="quick-buy-symbol">$RGN</span>
          {TOKEN_ADDRESS && (
            <span
              className="quick-buy-ca"
              title="Click to copy"
              onClick={handleCopyCA}
            >
              {copied ? 'Copied!' : truncateAddress(TOKEN_ADDRESS)}
            </span>
          )}
        </div>
      </div>

      <div className="quick-buy-select-row">
        <span className="quick-buy-select-label">Select amount</span>
      </div>

      <div className="quick-buy-amounts">
        {SOL_AMOUNTS.map((amount) => (
          <button
            key={amount}
            className={`quick-buy-amount-btn ${selectedAmount === amount ? 'selected' : ''}`}
            onClick={() => setSelectedAmount(amount)}
            disabled={buying}
          >
            {amount} SOL
          </button>
        ))}
      </div>

      <button
        className="special"
        onClick={handleBuy}
        disabled={buying || !connected}
      >
        {!connected ? 'Not Connected...' : buying ? 'Signing...' : `Buy ${selectedAmount} SOL`}
      </button>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
          duration={toastType === 'success' ? 3000 : 4000}
        />
      )}
    </Modal>
  );
}
