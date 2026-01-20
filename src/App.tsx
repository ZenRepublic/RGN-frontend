import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { useIsInAppWalletBrowser } from './utils/walletUtils';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import './App.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

const DEMO_VIDEO_URL = 'https://arweave.net/3WReLIrdjuqEnV1buT9CbYXRhhBJ5fEXQmQ19pUXS5o?ext=mp4';

// Types
interface Fighter {
  name: string;
  image: string | null;
  imagePreview: string;
}

interface PaymentInfo {
  success: boolean;
  price: string;
  wallet: string;
}

interface OrderResult {
  nftImageUrl?: string;
  nftAddress?: string;
  queuePosition: number;
  estimatedDelivery: string;
  warning?: string;
}

interface PrepareResponse {
  transaction: string;
  assetAddress: string;
  error?: string;
}

interface ConfirmResponse {
  nftImageUrl?: string;
  nftAddress?: string;
  queuePosition: number;
  estimatedDelivery: string;
  error?: string;
}

type Step = 'form' | 'processing' | 'confirming' | 'success';

// Helper to load image
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

async function createCroppedImage(imageSrc: string, pixelCrop: Area): Promise<string> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const OUTPUT_SIZE = 512;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (error) {
    console.error('createCroppedImage failed:', error);
    throw error;
  }
}

const DEFAULT_FIGHTERS: Fighter[] = [
  { name: '', image: null, imagePreview: '/mystery-fighter.png' },
  { name: '', image: null, imagePreview: '/mystery-fighter.png' }
];

const FIGHTERS_CACHE_KEY = 'rgn-fighters-v2';

function App() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const [videoError, setVideoError] = useState(false);

  const inWalletBrowser = useIsInAppWalletBrowser();

  // Cropping state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropFighterIndex, setCropFighterIndex] = useState<number | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Payment info from backend
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  // Form state - load from localStorage if available
  const [fighters, setFighters] = useState<Fighter[]>(() => {
    const saved = localStorage.getItem(FIGHTERS_CACHE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as Fighter[];
      } catch {
        return DEFAULT_FIGHTERS;
      }
    }
    return DEFAULT_FIGHTERS;
  });

  // Save fighters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(FIGHTERS_CACHE_KEY, JSON.stringify(fighters));
  }, [fighters]);

  // Success state
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  // Check if form is valid (both fighters have names and images)
  const isFormValid = fighters.every(f => f.name.trim() !== '' && f.image !== null);

  // Fetch payment info on mount
  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/rgn/payment-info`);
        const data = await response.json() as PaymentInfo;
        if (data.success) {
          setPaymentInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch payment info:', err);
      }
    };
    fetchPaymentInfo();
  }, []);

  const updateFighter = (index: number, field: keyof Fighter, value: string) => {
    if (field === 'name') {
      const filteredValue = value.replace(/[^a-zA-Z0-9_ ]/g, '');

      if (filteredValue.length > 12) {
        setError('Fighter name must be 12 characters or less');
        return;
      }

      setError('');
      setFighters(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: filteredValue };
        return updated;
      });
    } else {
      setFighters(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    }
  };

  const handleImageUpload = (index: number, file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError('');

    const blobUrl = URL.createObjectURL(file);

    setCropImage(blobUrl);
    setCropFighterIndex(index);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropModalOpen(true);
  };

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels || cropFighterIndex === null || !cropImage) return;

    try {
      const croppedImage = await createCroppedImage(cropImage, croppedAreaPixels);

      setFighters(prev => {
        const updated = [...prev];
        if (updated[cropFighterIndex]?.imagePreview?.startsWith('blob:')) {
          URL.revokeObjectURL(updated[cropFighterIndex].imagePreview);
        }
        updated[cropFighterIndex] = {
          ...updated[cropFighterIndex],
          image: croppedImage,
          imagePreview: croppedImage
        };
        return updated;
      });

      URL.revokeObjectURL(cropImage);

      setCropModalOpen(false);
      setCropImage(null);
      setCropFighterIndex(null);
    } catch (err) {
      console.error('Crop failed:', err);
      setError('Failed to crop image. Please try again.');
      setCropModalOpen(false);
      setCropImage(null);
      setCropFighterIndex(null);
    }
  };

  const handleCropCancel = () => {
    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }
    setCropModalOpen(false);
    setCropImage(null);
    setCropFighterIndex(null);
  };

  const handlePayAndOrder = async () => {
    const allowPurchase = import.meta.env.VITE_ALLOW_PURCHASE === 'true';
    const adminIdsRaw = import.meta.env.VITE_ADMIN_IDS || '';

    let adminIds: string[] = [];
    if (adminIdsRaw) {
      try {
        adminIds = JSON.parse(adminIdsRaw) as string[];
      } catch {
        adminIds = adminIdsRaw
          .split(',')
          .map((id: string) => id.trim().toLowerCase())
          .filter(Boolean);
      }
    }

    const currentPubkey = publicKey?.toBase58()?.toLowerCase();

    const isAdmin = currentPubkey && adminIds.includes(currentPubkey);
    const canProceed = allowPurchase || isAdmin;

    if (!canProceed) {
      if (isAdmin) {
        console.log('Admin detected — purchase allowed despite global flag');
      } else {
        setError('Purchases are currently disabled. Contact admin if needed.');
        return;
      }
    }

    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!paymentInfo) {
      setError('Payment info not loaded. Please refresh the page.');
      return;
    }

    for (let i = 0; i < fighters.length; i++) {
      if (!fighters[i].name) {
        setError(`Please enter a name for Fighter ${i + 1}`);
        return;
      }
    }

    setLoading(true);
    setError('');
    setStep('processing');

    try {
      console.log('Preparing order...');
      const prepareResponse = await fetch(`${API_URL}/rgn/orders/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userWallet: publicKey.toBase58() })
      });

      const prepareData = await prepareResponse.json() as PrepareResponse;

      if (!prepareResponse.ok) {
        throw new Error(prepareData.error || 'Failed to prepare order');
      }

      const { transaction: txBase64, assetAddress } = prepareData;

      const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));
      const transaction = Transaction.from(txBytes);

      console.log('Requesting signature...');
      if (!signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }
      const signedTransaction = await signTransaction(transaction);

      console.log('Sending transaction...');
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      console.log('Transaction sent:', signature);

      console.log('Waiting for confirmation...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed on chain');
      }

      console.log('Transaction confirmed!');

      setStep('confirming');

      const confirmResponse = await fetch(`${API_URL}/rgn/orders/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txSignature: signature,
          assetAddress,
          fighters: fighters.map(f => ({
            name: f.name,
            imageUrl: f.image || f.imagePreview
          }))
        })
      });

      const data = await confirmResponse.json() as ConfirmResponse;

      if (!confirmResponse.ok && data.nftAddress) {
        setOrderResult({
          ...data,
          warning: data.error || 'NFT minted but metadata update failed. Please contact @RGN_Forever on X for support.'
        } as OrderResult);
        setShowCheckoutModal(false);
        setStep('success');
        return;
      }

      if (!confirmResponse.ok) {
        throw new Error(data.error || 'Failed to confirm order');
      }

      localStorage.removeItem('rgn-fighters-v2');
      setOrderResult(data as OrderResult);
      setShowCheckoutModal(false);
      setStep('success');

    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <img src="/BannerWithLogo.png" alt="RGN Banner" className="banner" />
        <h1 style={{ textAlign: 'left' }}>Onchain Brainrot Broadcast</h1>
        <p style={{ textAlign: 'left' }}>Stop consuming brainrot - it's time to own it! <br /> <br /> Select a simulation, customize it, and receive an organically recorded NFT with a short-form video you can share anywhere.</p>
      </header>

      <div className="tab-group">
        <button className="tab-btn active">Dio Dudes</button>
        <button className="tab-btn" disabled>More Soon...</button>
      </div>

      <section className="about-section">
        <p>
          1v1 Boxing Simulation of locally trained AI Agents. Set your fighters and send them off to the match of the ages, in which the victor will be forever inscribed on the blockchain!
        </p>
        {!inWalletBrowser && (
          <div className="video-container">
            {!videoError ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
              >
                <source src={DEMO_VIDEO_URL} type="video/mp4" />
              </video>
            ) : (
              <div className="video-loading">
                <span>Video unavailable</span>
              </div>
            )}
          </div>
        )}
      </section>

      {step !== 'success' && (
        <div className="order-form">
          {!connected && (
            <div className="mobile-wallet-overlay">
              <div className="mobile-wallet-prompt">
                <h2>Connect your wallet to order a match</h2>
                <WalletMultiButton />
              </div>
            </div>
          )}

          {fighters.map((fighter, index) => (
            <section key={index} className="section fighter-section">
              <h2>Fighter {index + 1}</h2>
              <div className="fighter-content">
                <div className="fighter-image-container">
                  <img
                    src={fighter.imagePreview}
                    alt={`Fighter ${index + 1}`}
                    className="fighter-image"
                  />
                  <label htmlFor={`f${index}-image`} className="upload-button">
                    {fighter.image ? 'Change' : 'Upload'}
                  </label>
                  <input
                    id={`f${index}-image`}
                    type="file"
                    accept="image/*"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleImageUpload(index, e.target.files?.[0])}
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="fighter-fields">
                  <div className="field">
                    <label htmlFor={`f${index}-name`}>Name* (max 12 chars)</label>
                    <input
                      id={`f${index}-name`}
                      type="text"
                      required
                      maxLength={12}
                      value={fighter.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateFighter(index, 'name', e.target.value)}
                      placeholder="e.g. Solana"
                    />
                  </div>
                </div>
              </div>
            </section>
          ))}

          {error && <div className="error">{error}</div>}

          <button
            type="button"
            className="primary checkout-btn"
            disabled={!isFormValid}
            onClick={() => setShowCheckoutModal(true)}
          >
            Go To Checkout
          </button>
        </div>
      )}

      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowCheckoutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {(step === 'processing' || step === 'confirming') ? (
              <div className="modal-processing">
                <div className="spinner large"></div>
                <h2>{step === 'processing' ? 'Waiting for Transaction' : 'Transaction Confirmed'}</h2>
                <p>{step === 'processing'
                  ? 'Please approve the transaction in your wallet...'
                  : 'Please wait while we finalize your order...'}</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h2>Order Details</h2>
                  <div className="modal-header-right">
                    <WalletMultiButton />
                    <button
                      className="modal-close"
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setError('');
                      }}
                    >
                      &times;
                    </button>
                  </div>
                </div>

                <div className="modal-content">
                  <div className="order-summary">
                    <div className="fighters-preview">
                      <div className="fighter-preview-item">
                        <img src={fighters[0].imagePreview} alt={fighters[0].name} />
                        <span>{fighters[0].name}</span>
                      </div>
                      <span className="vs-text">VS</span>
                      <div className="fighter-preview-item">
                        <img src={fighters[1].imagePreview} alt={fighters[1].name} />
                        <span>{fighters[1].name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="payment-includes">
                    <span>Includes:</span>
                    <ul>
                      <li>Custom AI Battle Video</li>
                      <li>NFT with your fighters</li>
                      <li>Permanent on-chain storage</li>
                    </ul>
                  </div>

                  {error && <div className="error">{error}</div>}
                </div>

                <button
                  type="button"
                  className="btn-purchase"
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
      )}

      {cropModalOpen && cropImage && (
        <div className="modal-overlay">
          <div className="crop-modal">
            <div className="modal-header">
              <h2>Crop Image</h2>
              <button className="modal-close" onClick={handleCropCancel}>
                &times;
              </button>
            </div>

            <div className="crop-container">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="crop-controls">
              <label>Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setZoom(Number(e.target.value))}
                className="zoom-slider"
              />
            </div>

            <button className="primary crop-confirm-btn" onClick={handleCropConfirm}>
              Confirm
            </button>
          </div>
        </div>
      )}

      {step === 'success' && orderResult && (
        <div className="success-screen">
          {orderResult.nftImageUrl && (
            <div className="nft-preview">
              <img src={orderResult.nftImageUrl} alt="Your Battle NFT" className="nft-image" />
            </div>
          )}
          <h2>{orderResult.warning ? 'NFT MINTED' : 'BRAINROT AWAITS'}</h2>
          {orderResult.warning ? (
            <div className="warning-box">
              <p>{orderResult.warning}</p>
            </div>
          ) : (
            <p>Your Order Asset has been minted and sent to your wallet. Once the battle is done simulating, the NFT will be updated with the video.</p>
          )}
          <div className="queue-info">
            <div className="info-row">
              <span>Queue Position:</span>
              <strong>#{orderResult.queuePosition}</strong>
            </div>
            <div className="info-row">
              <span>Estimated Time:</span>
              <strong>{orderResult.estimatedDelivery}</strong>
            </div>
            {orderResult.nftAddress && (
              <div className="info-row">
                <span>Asset Reference:</span>
                <a
                  href={`https://solscan.io/token/${orderResult.nftAddress}?cluster=${import.meta.env.VITE_SOL_NETWORK || 'devnet'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-nft-link"
                >
                  View
                </a>
              </div>
            )}
          </div>
          <br />
          <button onClick={() => window.location.reload()} className="primary">
            Hell yea
          </button>
        </div>
      )}
      <footer className="powered-by">
        <span>Powered by</span>
        <img src="/mplx_logo.png" alt="Metaplex" />
      </footer>
      <SpeedInsights />
    </div>
  );
}

export default App;
