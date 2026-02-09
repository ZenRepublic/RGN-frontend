import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import './AccountButton.css';

export function AccountButton() {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { hasAccount, loading } = useAccountStatus();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading && connected) {
      setIsReady(true);
    }
  }, [loading, connected]);

  const handleClick = () => {
    if (!connected) {
      navigate('/');
      return;
    }

    // Route to registration if no account, otherwise to account view
    if (hasAccount) {
      navigate('/account');
    } else {
      navigate('/registration');
    }
  };

  return (
    <button
      className="account-button"
      onClick={handleClick}
      disabled={!isReady}
      title="Go to account page"
    >
      {"My Account"}
    </button>
  );
}
