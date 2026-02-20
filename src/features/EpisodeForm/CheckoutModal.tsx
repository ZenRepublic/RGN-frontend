import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Modal } from '@/primitives/Modal';
import { useToast } from '@/context/ToastContext';
import { EpisodeOrderFormData } from '@/types/channel';
import { usePrepareOrder, useConfirmOrder } from '@/hooks/useEpisodePurchase';
import { fetchOrderById } from '@/services/episodeFetch';
import {getFullAMPMDate} from "@/utils"

import './CheckoutModal.css';

interface PaymentInfo {
  success: boolean;
  price: string;
  wallet: string;
}

type ModalStep = 'details' | 'processing' | 'confirming' | 'success' | 'partial-error';

interface CheckoutModalProps {
  isOpen: boolean;
  formData: EpisodeOrderFormData;
  paymentInfo: PaymentInfo | null;
  channelId: string;
  onClose: () => void;
}

export default function CheckoutModal({
  isOpen,
  formData,
  paymentInfo,
  channelId,
  onClose,
}: CheckoutModalProps) {
  const navigate = useNavigate();
  const { publicKey, signTransaction, connected } = useWallet();
  const prepareOrder = usePrepareOrder();
  const confirmOrder = useConfirmOrder();
  const { showToast } = useToast();

  const [step, setStep] = useState<ModalStep>('details');
  const [loading, setLoading] = useState(false);
  const [partialErrorId, setPartialErrorId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const handleClose = () => {
    if (!loading) {
      stopPolling();
      setStep('details');
      setPartialErrorId(null);
      onClose();
    }
  };

  const startPolling = (orderId: string) => {
    const poll = async () => {
      const order = await fetchOrderById(orderId, false);
      console.log(order);
      if (order) {
        navigate(`/episode/${orderId}`);
      } else {
        pollRef.current = setTimeout(poll, 3000);
      }
    };
    pollRef.current = setTimeout(poll, 2000);
  };

  const handlePayAndOrder = async () => {
    if (!connected || !publicKey || !signTransaction) {
      showToast('Please connect your wallet first');
      return;
    }

    if (!paymentInfo) {
      showToast('Payment info not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setStep('processing');

    console.log('Preparing order...');

    try {
      const { transaction, episodeId } = await prepareOrder(
        publicKey.toBase58(),
        channelId
      );

      console.log('Signing transaction...');
      const signed = await signTransaction(transaction);

      console.log('Sending signed transaction to server...');
      setStep('confirming');

      const data = await confirmOrder(
        signed,
        channelId,
        episodeId,
        formData.actors,
        formData.startTime || ''
      );

      if (data.error) {
        // Partial success - NFT minted but backend processing failed
        setPartialErrorId(data.orderId || episodeId);
        setStep('partial-error');
        return;
      }

      setStep('success');
      startPolling(data.orderId!);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      showToast(errorMessage);
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Order Details"
      disabled={loading}
    >
      {step === 'partial-error' ? (
        <div className="flex flex-col items=center text-center gap-lg">
          <h2>Order Minted</h2>
          <p>
            Your order was minted, but an unexpected error occurred on the server.
            Please reach out to <strong>@rgn_brainrot</strong> on X providing your order ID:
          </p>
          <p className="intense-red">{partialErrorId}</p>
          <button className="primary" onClick={handleClose}>Close</button>
        </div>
      ) : step === 'success' ? (
        <div className="flex flex-col items-center text-center gap-lg">
          <img
          src="/Images/Success.jpg"
          alt="Success"
          className="rounded-lg border-md border-white shadow-xl"
          />
          <h2>Order Confirmed!</h2>
          <p>Please wait to be redirected...</p>
        </div>
      ) : (step === 'processing' || step === 'confirming') ? (
        <div className="checkout-processing">
          <div className={`spinner large ${step}`}></div>
          <h2>{step === 'processing' ? 'Waiting for Signature' : 'Transaction Confirmed'}</h2>
          <p>{step === 'processing'
            ? 'Please approve the transaction in your wallet...'
            : 'Finalizing your purchase...'}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-lg">
            <div className="bg-bg-primary p-xl rounded-lg">
              {formData.startTime && (
                <div className="text-white text-bold text-center mb-lg">
                  {getFullAMPMDate(new Date(formData.startTime))}
                </div>
              )}
              <div className="flex justify-center items-center gap-2xl">
                {formData.preview.map((item, index) => (
                  <React.Fragment key={index}>
                    <div className="flex flex-col justify-center items-center gap-sm">
                      <img 
                      className='rounded-full w-[100px] object-cover border-lg border-yellow bg-black'
                      src={item.imagePreview} 
                      alt={item.name} 
                      />
                      <span>{item.name}</span>
                    </div>
                    {index < formData.preview.length - 1 && (
                      <span className="intense-red">VS</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="checkout-includes">
              <label>INCLUDES</label>
              <ul>
                {formData.includes.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <button
            type="button"
            className="special"
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
    </Modal>
  );
}
