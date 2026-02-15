import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
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
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCA = () => {
    if (!TOKEN_ADDRESS) return;
    navigator.clipboard.writeText(TOKEN_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleBuy = async () => {
    if (!connected || !publicKey) {
      setError('Connect your wallet first');
      return;
    }

    if (!TOKEN_ADDRESS) {
      setError('Token address not configured');
      return;
    }

    setBuying(true);
    setError(null);
    setTxSig(null);

    const { signature, error } = await executeQuickBuy(
      connection,
      TOKEN_ADDRESS,
      selectedAmount,
      publicKey,
      sendTransaction
    );

    if (error) {
      setError(error);
    } else if (signature) {
      setTxSig(signature);
    }

    setBuying(false);
  };

  return (
    <div className="quick-buy-overlay" onClick={onClose}>
      <div className="quick-buy-modal" onClick={e => e.stopPropagation()}>
        <div className="quick-buy-header-row">
          <h2 className="quick-buy-title">Quick Buy</h2>
          <button className="quick-buy-close" onClick={onClose}>Close</button>
        </div>

        <img src="/Images/QuickBuy.png" alt="Quick Buy" className="quick-buy-header-img" />

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
          className="quick-buy-action primary"
          onClick={handleBuy}
          disabled={buying || !connected}
        >
          {!connected ? 'Not Connected...' : buying ? 'Signing...' : `Buy ${selectedAmount} SOL`}
        </button>

        {error && <p className="quick-buy-error">{error}</p>}
        {txSig && (
          <a
            className="quick-buy-tx"
            href={`https://solscan.io/tx/${txSig}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View transaction
          </a>
        )}
      </div>
    </div>
  );
}
