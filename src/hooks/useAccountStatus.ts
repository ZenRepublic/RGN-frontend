import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from '@/context/AccountContext';
import { getAccountStatus } from '@/services/account';

export interface Account {
  _id: string;
  displayName: string;
  avatar: string | null;
  createdAt: string;
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
        const account = await getAccountStatus(walletAddress);

        if (account === null) {
          setContextAccount(null);
          setError(null);
          setLoading(false);
          return;
        }

        setContextAccount(account);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Failed to check account status:', err);
        setContextAccount(null);
        setError(null);
        setLoading(false);
      }
    };

    checkAccount();
  }, [connected, wallet?.adapter.publicKey, contextAccount, setContextAccount, clearAccount]);

  return { account: contextAccount, loading, error, hasAccount: contextAccount !== null };
}
