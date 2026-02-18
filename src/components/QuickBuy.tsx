import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Modal, TokenDisplay } from '../primitives';
import { useToast } from '../context/ToastContext';
import { executeQuickBuy } from '../services/pumpSwap';

const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
const SOL_AMOUNTS = [0.1, 0.25, 0.5];

interface QuickBuyProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickBuy({ isOpen, onClose }: QuickBuyProps) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { showToast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number>(SOL_AMOUNTS[0]);
  const [buying, setBuying] = useState(false);

  const handleBuy = async () => {
    if (!connected || !publicKey) {
      showToast('Connect your wallet first');
      return;
    }

    if (!TOKEN_ADDRESS) {
      showToast('Token address not configured');
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
      showToast(error);
    } else if (signature) {
      showToast('Transaction successful!', 'success');
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
      <img
        src="/Images/QuickBuy.png"
        alt="Quick Buy"
        className="rounded-lg border-md border-white shadow-xl"
        />

      <div className='flex justify-between items-end'>
        <TokenDisplay
          image="/Branding/logo.png"
          symbol="$RGN"
          tokenAddress={TOKEN_ADDRESS}
        />
        <label>SELECT AMOUNT</label>
      </div>

      <div className="flex flex-col gap-sm">
        {SOL_AMOUNTS.map((amount) => (
          <button
            key={amount}
            className={`toggle-btn-alt ${selectedAmount === amount ? 'selected' : ''}`}
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
    </Modal>
  );
}
