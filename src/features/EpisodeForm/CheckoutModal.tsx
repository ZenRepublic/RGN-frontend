import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Modal } from '@/primitives/Modal';
import { useToast } from '@/context/ToastContext';
import { EpisodeOrderFormData } from '@/types/channel';
import { storeOrderResult } from '@/features/EpisodeForm/OrderSuccess';
import { usePrepareOrder, useConfirmOrder } from '@/hooks/useEpisodePurchase';
import { OrderResult } from '@/services/episodePurchase';
import {getFullAMPMDate} from "@/utils"

import './CheckoutModal.css';

interface PaymentInfo {
  success: boolean;
  price: string;
  wallet: string;
}

type ModalStep = 'details' | 'processing' | 'confirming';

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

  const handleClose = () => {
    if (!loading) {
      setStep('details');
      onClose();
    }
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

      if (data.episodeId) {
        // Partial success - NFT minted but metadata failed
        storeOrderResult(data);
        navigate('/order-success');
        return;
      }

      storeOrderResult(data as OrderResult);
      navigate('/order-success');

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
      {(step === 'processing' || step === 'confirming') ? (
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
