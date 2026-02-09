import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface Account {
  _id: string;
  displayName: string;
  avatar: string | null;
  createdAt: string;
}

export function useAccountStatus() {
  const { connected, wallet } = useWallet();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !wallet?.adapter.publicKey) {
      setAccount(null);
      setError(null);
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
          setAccount(null);
          setError(null);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setAccount(data.account || data);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Failed to check account status:', err);
        setAccount(null);
        setError(null); // Silently handle errors - 404 is expected for new accounts
        setLoading(false);
      }
    };

    checkAccount();
  }, [connected, wallet?.adapter.publicKey]);

  return { account, loading, error, hasAccount: account !== null };
}
