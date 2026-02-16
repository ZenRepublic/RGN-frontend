import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { ConnectWalletButton } from '@/primitives/buttons/ConnectWalletButton';
import { Toast } from '@/primitives';
import { useWalletRegistration } from '@/hooks/useWalletRegistration';
import { useAccount } from '@/context/AccountContext';
import './RegistrationView.css';

export default function RegistrationView() {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { register, step, reset } = useWalletRegistration();
  const { setAccount } = useAccount();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!connected) {
      navigate('/', { replace: true });
    }
  }, [connected, navigate]);

  // Navigate to account on successful registration
  useEffect(() => {
    if (step.status === 'success') {
      if (step.account) {
        setAccount(step.account);
      }
      navigate('/account', { replace: true });
    }
  }, [step.status, step.account, navigate, setAccount]);

  // Show error toast when error occurs
  useEffect(() => {
    if (step.status === 'error') {
      setShowError(true);
    }
  }, [step.status]);

  const handleRegister = () => {
    if (step.status === 'error') {
      setShowError(false);
      reset();
    }
    register();
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="registration-view">
      <Header />

      <div className="registration-container">
        <div className="registration-header">
          <h1>Join us!</h1>
          <ConnectWalletButton />
        </div>

        <div className="registration-image-section">
          <img
            src="/Images/JoinNow.jpg"
            alt="Join Now"
            className="registration-image"
          />
        </div>

        <div className="registration-form">
          {step.status !== 'success' && (
            <p className="instruction">
              Sign a message with your wallet to verify ownership and create your RGN account.
            </p>
          )}

          {showError && step.status === 'error' && (
            <Toast
              message={step.error || 'Registration failed'}
              type="error"
              duration={2000}
              onClose={() => {
                setShowError(false);
                reset();
              }}
            />
          )}

          {step.status !== 'success' && (
            <button
              className="special"
              onClick={handleRegister}
              disabled={step.status !== 'idle' && step.status !== 'error'}
            >
              {step.status !== 'idle' && step.status !== 'error' ? 'signing...' : 'Register Now!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
