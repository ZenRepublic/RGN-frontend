import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { useWalletRegistration } from '@/hooks/useWalletRegistration';
import './RegistrationView.css';

export default function RegistrationView() {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { register, step, reset } = useWalletRegistration();
  const [fadeOutError, setFadeOutError] = useState(false);

  useEffect(() => {
    if (!connected) {
      navigate('/', { replace: true });
    }
  }, [connected, navigate]);

  // Handle error timeout and fade out
  useEffect(() => {
    if (step.status === 'error') {
      setFadeOutError(false);

      const displayTimer = setTimeout(() => {
        setFadeOutError(true);
      }, 2000);

      const fadeTimer = setTimeout(() => {
        reset();
      }, 2300); // 2000ms + 300ms fade animation

      return () => {
        clearTimeout(displayTimer);
        clearTimeout(fadeTimer);
      };
    } else {
      setFadeOutError(false);
    }
  }, [step.status, reset]);

  const handleSuccess = () => {
    reset();
    navigate('/account', { replace: true });
  };

  const handleRegister = () => {
    if (step.status === 'error') {
      setFadeOutError(false);
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
            src={step.status === 'success' ? '/RegisterSuccess.jpg' : '/JoinNow.jpg'}
            alt={step.status === 'success' ? 'Registration Success' : 'Join Now'}
            className="registration-image"
          />
        </div>

        <div className="registration-form">
          {step.status !== 'success' && (
            <p className="instruction">
              Sign a message with your wallet to verify ownership and create your account.
            </p>
          )}

          {step.status !== 'idle' && step.status !== 'error' && step.status !== 'success' && (
            <div className={`status-section ${step.status}`}>
              <p className="status-message">
                {getStatusMessage(step.status, step.error)}
              </p>
            </div>
          )}

          {step.status === 'error' && (
            <p className={`error-message ${fadeOutError ? 'fade-out' : ''}`}>
              {step.error || 'Registration failed'}
            </p>
          )}

          {(step.status === 'idle' || step.status === 'error') && (
            <button
              className="register-button"
              onClick={handleRegister}
            >
              Register Now!
            </button>
          )}

          {step.status === 'success' && (
            <div className="success-section">
              <p className="success-message">✓ Account created successfully!</p>
              <button
                className="close-button"
                onClick={handleSuccess}
              >
                View Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusMessage(status: string, error?: string): string {
  switch (status) {
    case 'idle':
      return '';
    case 'getting-challenge':
      return 'Requesting challenge from server...';
    case 'signing':
      return 'Please sign the message with your wallet...';
    case 'registering':
      return 'Registering your account...';
    case 'success':
      return '✓ Account created successfully!';
    case 'error':
      return error || 'Registration failed';
    default:
      return '';
  }
}
