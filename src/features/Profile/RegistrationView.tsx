import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { ConnectWalletButton } from '@/primitives/buttons/ConnectWalletButton';
import { Toast, SectionHeader } from '@/primitives';
import { useWalletRegistration } from '@/hooks/useWalletRegistration';
import { useAccount } from '@/context/AccountContext';

export default function RegistrationView() {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const register = useWalletRegistration();
  const { setAccount } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected) {
      navigate('/', { replace: true });
    }
  }, [connected, navigate]);

  const handleRegister = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const account = await register();
      setAccount(account);
      navigate('/account', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
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

      <div className="flex flex-col items-center p-lg gap-xl">
        <SectionHeader title="Create Account" actions={[<ConnectWalletButton />]} />

        <img
          src="/Images/JoinNow.jpg"
          alt="Join Now"
          className="art-visual"
        />

        <p style={{textAlign: 'center'}}>
          Sign a message with your wallet to verify ownership and create your RGN account.
        </p>

        {error && (
          <Toast
            message={error}
            type="error"
            duration={2000}
            onClose={() => setError(null)}
          />
        )}

        <button
          style={{ display: "flex", width: "100%" }}
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
