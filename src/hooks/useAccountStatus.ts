import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from '@/context/AccountContext';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface Account {
  _id: string;
  displayName: string;
  avatar: string | null;
  createdAt: string;
  stats?: {
    totalVotes: number;
    correctVotes: number;
    winRate: number;
  };
}

export function useAccountStatus() {
  const { connected, wallet } = useWallet();
  const { account: contextAccount, setAccount: setContextAccount, clearAccount } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !wallet?.adapter.publicKey) {
      clearAccount();
      setError(null);
      return;
    }

    // If we already have the account in context, don't fetch
    if (contextAccount) {
      setLoading(false);
      return;
    }

    const walletAddress = wallet.adapter.publicKey.toBase58();

    const checkAccount = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/rgn/account/${walletAddress}`);

        // 404 means no account found - this is expected
        if (response.status === 404) {
          setContextAccount(null);
          setError(null);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setContextAccount(data.account || data);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Failed to check account status:', err);
        setContextAccount(null);
        setError(null); // Silently handle errors - 404 is expected for new accounts
        setLoading(false);
      }
    };

    checkAccount();
  }, [connected, wallet?.adapter.publicKey, contextAccount, setContextAccount, clearAccount]);

  return { account: contextAccount, loading, error, hasAccount: contextAccount !== null };
}
