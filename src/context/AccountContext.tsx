import { createContext, useContext, useState, useCallback } from 'react';
import type { Account } from '@/services/account';

export type { Account };

interface AccountContextType {
  account: Account | null;
  hasAccount: boolean;
  setAccount: (account: Account | null) => void;
  clearAccount: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);

  const clearAccount = useCallback(() => {
    setAccount(null);
  }, []);

  return (
    <AccountContext.Provider
      value={{
        account,
        hasAccount: account !== null,
        setAccount,
        clearAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within AccountProvider');
  }
  return context;
}
