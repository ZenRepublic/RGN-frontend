import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderResult } from '../services/episodePurchase';
import './OrderSuccess.css';

const ORDER_RESULT_KEY = 'rgn-order-result';

// Helper to get and clear the stored order result
export function getStoredOrderResult(): OrderResult | null {
  const stored = localStorage.getItem(ORDER_RESULT_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as OrderResult;
    } catch {
      return null;
    }
  }
  return null;
}

// Helper to store order result (called from CheckoutModal)
export function storeOrderResult(result: OrderResult): void {
  localStorage.setItem(ORDER_RESULT_KEY, JSON.stringify(result));
}

// Helper to clear stored order result
export function clearStoredOrderResult(): void {
  localStorage.removeItem(ORDER_RESULT_KEY);
}

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  useEffect(() => {
    const result = getStoredOrderResult();
    if (result) {
      setOrderResult(result);
    } else {
      // No order result found, redirect to home
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleBackToHome = () => {
    clearStoredOrderResult();
    navigate('/', { replace: true });
  };

  if (!orderResult) {
    return null; // Will redirect
  }

  return (
    <div className="order-success-page">
      {/* Sparkles effect */}
      <div className="sparkles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="sparkle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }} />
        ))}
      </div>

      <div className="success-container">
        {orderResult.coverImageUrl && (
          <div className="success-nft-preview">
            <img src={orderResult.coverImageUrl} alt="Your Episode NFT" className="success-nft-image" />
          </div>
        )}

        <h2>{orderResult.error ? 'NFT MINTED' : 'BRAINROT AWAITS'}</h2>

        {orderResult.error ? (
          <div className="success-warning">
            <p>{orderResult.error}</p>
          </div>
        ) : (
          <p className="success-message">
            Your Episode NFT has been minted and sent to your wallet. Once it is done simulating, the NFT will be updated with the video.
          </p>
        )}

        <div className="success-info">
          <div className="success-info-row">
            <span>Queue Position:</span>
            <strong>#{orderResult.queuePosition}</strong>
          </div>
          <div className="success-info-row">
            <span>Estimated Time:</span>
            <strong>{orderResult.estimatedDelivery}</strong>
          </div>
          {orderResult.episodeId && (
            <div className="success-info-row">
              <span>Asset Reference:</span>
              <a
                href={`https://solscan.io/token/${orderResult.episodeId}?cluster=${import.meta.env.VITE_SOL_NETWORK || 'devnet'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="success-view-link"
              >
                View
              </a>
            </div>
          )}
        </div>

        <button onClick={handleBackToHome} className="success-btn">
          Hell yea
        </button>
      </div>
    </div>
  );
}
