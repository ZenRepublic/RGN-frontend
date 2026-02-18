import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { ConnectWalletButton } from '@/primitives/buttons/ConnectWalletButton';
import { useToast } from '@/context/ToastContext';
import { useWalletRegistration } from '@/hooks/useWalletRegistration';
import { useAccount } from '@/context/AccountContext';

export default function RegistrationView() {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const register = useWalletRegistration();
  const { setAccount } = useAccount();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!connected) {
      navigate('/', { replace: true });
    }
  }, [connected, navigate]);

  const handleRegister = async () => {
    setIsLoading(true);

    try {
      const account = await register();
      setAccount(account);
      navigate('/account', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      showToast(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <div>
      <Header />

      <div className="flex flex-col p-2xl gap-xl">
        <div className="flex items-center justify-between">
          <h1>Create Account</h1>
          <ConnectWalletButton />
        </div>

        <img
          src="/Images/JoinNow.jpg"
          alt="Join Now"
          className="rounded-lg border-md border-white shadow-xl"
        />

        <p className="text-center">
          Sign a message with your wallet to verify ownership and create your RGN account.
        </p>

        <button
          className="special"
          onClick={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? 'signing...' : 'Register Now!'}
        </button>
      </div>
    </div>
  );
}
