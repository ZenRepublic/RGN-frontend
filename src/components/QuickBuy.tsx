import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { PumpAmmSdk, OnlinePumpAmmSdk, canonicalPumpPoolPda } from '@pump-fun/pump-swap-sdk';
import BN from 'bn.js';
import './QuickBuy.css';

const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
const SOL_AMOUNTS = [0.1, 0.2, 0.5];
const SLIPPAGE = 0.005; // 0.5%

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function QuickBuy() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [selectedAmount, setSelectedAmount] = useState<number>(SOL_AMOUNTS[0]);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

    try {
      const tokenMint = new PublicKey(TOKEN_ADDRESS);

      // Derive the canonical pool PDA for this token
      const poolKey = canonicalPumpPoolPda(tokenMint);

      // OnlinePumpAmmSdk fetches on-chain state, PumpAmmSdk builds instructions
      const onlineSdk = new OnlinePumpAmmSdk(connection);
      const sdk = new PumpAmmSdk();

      // Fetch pool + global config state needed for the swap
      const swapState = await onlineSdk.swapSolanaState(poolKey, publicKey);

      // buyQuoteInput: buy tokens by specifying SOL (quote) amount
      const lamports = new BN(Math.round(selectedAmount * 1e9));
      const instructions = await sdk.buyQuoteInput(
        swapState,
        lamports,
        SLIPPAGE,
      );

      const tx = new Transaction().add(...instructions);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      setTxSig(signature);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setError(msg);
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="quick-buy">
      <div className="quick-buy-token">
        <img src="/LogoTransparent.png" alt="RGN" className="quick-buy-logo" />
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
        <span className="quick-buy-hint">Select amount to buy</span>
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
  );
}
