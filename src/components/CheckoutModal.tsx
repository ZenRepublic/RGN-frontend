import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { EpisodeOrderFormData } from '@/channels/channel';
import { storeOrderResult } from '@/pages/OrderSuccess';

import './CheckoutModal.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

interface PaymentInfo {
  success: boolean;
  price: string;
  wallet: string;
}

export interface OrderResult {
  channelId?: string,
  episodeId?: string;
  coverImageUrl?: string;
  queuePosition: number;
  estimatedDelivery: string;
  error?: string;
}

interface PrepareResponse {
  transaction: string;
  channelId: string,
  episodeId: string;
  error?: string;
}

type ModalStep = 'details' | 'processing' | 'confirming';

interface CheckoutModalProps {
  isOpen: boolean;
  formData: EpisodeOrderFormData;
  paymentInfo: PaymentInfo | null;
  channelId: string;
  onClose: () => void;
  onError: (message: string) => void;
}

export default function CheckoutModal({
  isOpen,
  formData,
  paymentInfo,
  channelId,
  onClose,
  onError,
}: CheckoutModalProps) {
  const navigate = useNavigate();
  const { publicKey, signTransaction, connected } = useWallet();

  const [step, setStep] = useState<ModalStep>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (!loading) {
      setStep('details');
      setError('');
      onClose();
    }
  };

  const handlePayAndOrder = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setError('Please connect your wallet first');
      return;
    }

    if (!paymentInfo) {
      setError('Payment info not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');
    setStep('processing');

    console.log('Preparing order...');

    try {
      const prepareResponse = await fetch(`${API_URL}/rgn/orders/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userWallet: publicKey.toBase58(), channelId })
      });

      const prepareData = await prepareResponse.json() as PrepareResponse;

      if (!prepareResponse.ok) {
        throw new Error(prepareData.error || 'Failed to prepare order');
      }

      const { transaction: txBase64, channelId: responseChannelId, episodeId } = prepareData;

      const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));
      const transaction = Transaction.from(txBytes);

      console.log('Signing transaction...');
      const signed = await signTransaction(transaction);
      const signedTransaction = Buffer.from(
        signed.serialize({ requireAllSignatures: false, verifySignatures: false })
      ).toString('base64');

      console.log('Sending signed transaction to server...');
      setStep('confirming');

      const confirmResponse = await fetch(`${API_URL}/rgn/orders/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signedTransaction,
          channelId,
          episodeId,
          actorData: formData.actors,
          startTime: formData.startTime
        })
      });

      const data = await confirmResponse.json() as OrderResult;

      if (!confirmResponse.ok && data.episodeId) {
        // Partial success - NFT minted but metadata failed
        storeOrderResult(data);
        navigate('/order-success');
        return;
      }

      if (!confirmResponse.ok) {
        throw new Error(data.error || 'Failed to confirm order');
      }

      storeOrderResult(data as OrderResult);
      navigate('/order-success');

    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="checkout-overlay" onClick={handleClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        {(step === 'processing' || step === 'confirming') ? (
          <div className="checkout-processing">
            <div className={`spinner large ${step === 'confirming' ? 'confirmed' : ''}`}></div>
            <h2>{step === 'processing' ? 'Waiting for Transaction' : 'Transaction Confirmed'}</h2>
            <p>{step === 'processing'
              ? 'Please approve the transaction in your wallet...'
              : 'Please wait while we finalize your order...'}</p>
          </div>
        ) : (
          <>
            <div className="checkout-header">
              <h2>Order Details</h2>
              <div className="checkout-header-right">
                <button
                  type="button"
                  className="checkout-close"
                  onClick={handleClose}
                  aria-label="Close"
                >
                  <img
                    src="/Icons/CloseIcon.PNG"
                    alt=""
                    className="checkout-close-icon"
                  />
                </button>
              </div>
            </div>

            <div className="checkout-content">
              <div className="checkout-summary">
                {formData.startTime && (
                  <div className="checkout-start-time">
                    {new Date(formData.startTime).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    }).toUpperCase()}, {new Date(formData.startTime).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    }).replace(' ', '')}
                  </div>
                )}
                <div className="checkout-preview">
                  {formData.preview.map((item, index) => (
                    <React.Fragment key={index}>
                      <div className="checkout-preview-item">
                        <img src={item.imagePreview} alt={item.name} />
                        <span>{item.name}</span>
                      </div>
                      {index < formData.preview.length - 1 && (
                        <span className="checkout-vs">VS</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="checkout-includes">
                <span>Includes:</span>
                <ul>
                  {formData.includes.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              {error && <div className="checkout-error">{error}</div>}
            </div>

            <button
              type="button"
              className="checkout-purchase-btn"
              disabled={loading || !connected || !paymentInfo}
              onClick={handlePayAndOrder}
            >
              {!connected
                ? 'Connect Wallet To Order'
                : loading
                  ? 'Processing...'
                  : `Purchase (${paymentInfo?.price || '...'} SOL)`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
