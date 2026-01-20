import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import { SpeedInsights } from "@vercel/speed-insights/react"
import './App.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

// Detect if user is on mobile but not in a wallet browser
const isMobileNonWalletBrowser = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!isMobile) return false;

  // Check if we're inside a wallet's in-app browser
  const isPhantomBrowser = window.phantom?.solana?.isPhantom;
  const isSolflareBrowser = window.solflare?.isSolflare;
  const hasWalletExtension = isPhantomBrowser || isSolflareBrowser;

  return !hasWalletExtension;
};

const DEMO_VIDEO_URL = 'https://arweave.net/3WReLIrdjuqEnV1buT9CbYXRhhBJ5fEXQmQ19pUXS5o?ext=mp4';
const VIDEO_CACHE_KEY = 'rgn-demo-video';

function App() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected, connecting, disconnect, wallet, connect, select } = useWallet();
  const [showMobileWalletPrompt, setShowMobileWalletPrompt] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);

  // Load video from cache or fetch and cache it
  useEffect(() => {
    const loadVideo = async () => {
      // Check localStorage first
      const cached = localStorage.getItem(VIDEO_CACHE_KEY);
      if (cached) {
        setVideoSrc(cached);
        return;
      }

      // Fetch and cache the video
      try {
        const response = await fetch(DEMO_VIDEO_URL);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result;
          try {
            localStorage.setItem(VIDEO_CACHE_KEY, base64);
          } catch (e) {
            // localStorage quota exceeded, just use the URL directly
            console.log('Video too large for cache, streaming instead');
          }
          setVideoSrc(base64);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        // Fallback to direct URL if fetch fails
        console.error('Failed to fetch video:', err);
        setVideoSrc(DEMO_VIDEO_URL);
      }
    };

    loadVideo();
  }, []);

  // Check if mobile user needs to connect wallet first
  useEffect(() => {
    setShowMobileWalletPrompt(isMobileNonWalletBrowser());
  }, []);

  // Disconnect on initial page load to prevent auto-reconnect from previous session
  useEffect(() => {
    if (wallet) {
      disconnect();
      select(null);
    }
  }, []);

  const handleCancelConnect = () => {
    select(null);
    disconnect();
  };

  const [step, setStep] = useState('form'); // 'form', 'processing', 'confirming', 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Payment info from backend
  const [paymentInfo, setPaymentInfo] = useState(null);

  // Form state - load from localStorage if available
  const [fighters, setFighters] = useState(() => {
    const saved = localStorage.getItem('rgn-fighters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [
          { name: '', image: null, imagePreview: '/mystery-fighter.png' },
          { name: '', image: null, imagePreview: '/mystery-fighter.png' }
        ];
      }
    }
    return [
      { name: '', image: null, imagePreview: '/mystery-fighter.png' },
      { name: '', image: null, imagePreview: '/mystery-fighter.png' }
    ];
  });

  // Save fighters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('rgn-fighters', JSON.stringify(fighters));
  }, [fighters]);

  // Success state
  const [orderResult, setOrderResult] = useState(null);

  // Check if form is valid (both fighters have names and images)
  const isFormValid = fighters.every(f => f.name.trim() !== '' && f.image !== null);

  // Fetch payment info on mount
  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/rgn/payment-info`);
        const data = await response.json();
        if (data.success) {
          setPaymentInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch payment info:', err);
      }
    };
    fetchPaymentInfo();
  }, []);

  const updateFighter = (index, field, value) => {
    if (field === 'name') {
      // Only allow alphanumeric, underscore, and space
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

  const handleImageUpload = (index, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      if (img.width !== img.height) {
        setError('Image must be square (same width and height)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setError('');
        setFighters(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            image: reader.result,
            imagePreview: reader.result
          };
          return updated;
        });
      };
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  };

  const handlePayAndOrder = async () => {
    // TEMP: Disabled for testing
    console.log('Payment disabled for testing');
    return;

    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!paymentInfo) {
      setError('Payment info not loaded. Please refresh the page.');
      return;
    }

    // Validate fighters
    for (let i = 0; i < fighters.length; i++) {
      if (!fighters[i].name) {
        setError(`Please enter a name for Fighter ${i + 1}`);
        return;
      }
    }

    setLoading(true);
    setError('');
    setShowCheckoutModal(false);
    setStep('processing');

    try {
      // 1. Call prepare endpoint to get partially signed transaction
      console.log('Preparing order...');
      const prepareResponse = await fetch(`${API_URL}/rgn/orders/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userWallet: publicKey.toBase58() })
      });

      const prepareData = await prepareResponse.json();

      if (!prepareResponse.ok) {
        throw new Error(prepareData.error || 'Failed to prepare order');
      }

      const { transaction: txBase64, assetAddress } = prepareData;

      // 2. Deserialize the partially signed transaction (browser-compatible base64 decode)
      const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));
      const transaction = Transaction.from(txBytes);

      // 3. Send transaction (wallet will add user's signature)
      console.log('Requesting signature...');
      const signature = await sendTransaction(transaction, connection);
      console.log('Transaction sent:', signature);

      // 4. Wait for confirmation
      console.log('Waiting for confirmation...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed on chain');
      }

      console.log('Transaction confirmed!');

      // Update UI to show second phase
      setStep('confirming');

      // 5. Confirm order with backend
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

      const data = await confirmResponse.json();

      // 6. Handle response - show success even if metadata update failed
      // (NFT was still minted, user needs to see it)
      if (!confirmResponse.ok && data.nftAddress) {
        // Metadata update failed but NFT was minted - show success with warning
        setOrderResult({
          ...data,
          warning: data.error || 'NFT minted but metadata update failed. Please contact @RGN_Forever on X for support.'
        });
        setStep('success');
        return;
      }

      if (!confirmResponse.ok) {
        throw new Error(data.error || 'Failed to confirm order');
      }

      // Full success!
      localStorage.removeItem('rgn-fighters');
      setOrderResult(data);
      setStep('success');

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <img src="/BannerWithLogo.png" alt="RGN Banner" className="banner" />
        <h1>The World's Leading Brainrot Broadcaster</h1>
        <p>Own the brainrot, don't just watch it. Select a simulation, customize it, and receive an organically recorded NFT with a short-form video you can share anywhere.</p>
      </header>

      <div className="tab-group">
        <button className="tab-btn active">Dio Dudes</button>
        <button className="tab-btn" disabled>More Coming Soon...</button>
      </div>

      <section className="about-section">
        <p>
          1v1 Boxing Simulation of locally trained AI Agents. Set your fighters and send them off to the match of the ages, in which the victor will be forever inscribed on the blockchain!
        </p>
        <div className="video-container">
          {videoSrc ? (
            <video autoPlay loop muted playsInline>
              <source src={videoSrc} type="video/mp4" />
            </video>
          ) : (
            <div className="video-loading">
              <div className="spinner"></div>
              <span>Loading preview...</span>
            </div>
          )}
        </div>
      </section>

      {step === 'form' && (
        <div className="order-form">
          {/* Mobile wallet prompt overlay */}
          {showMobileWalletPrompt && (
            <div className="mobile-wallet-overlay">
              <div className="mobile-wallet-prompt">
                <h2>Open in Wallet</h2>
                <p>To place an order, please open this site in your Phantom or Solflare wallet app.</p>
                <WalletMultiButton />
              </div>
            </div>
          )}

          {/* Fighter Setup */}
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
                    onChange={(e) => handleImageUpload(index, e.target.files[0])}
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
                      onChange={(e) => updateFighter(index, 'name', e.target.value)}
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

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="processing-screen">
          <div className="spinner large"></div>
          <h2>Waiting for Transaction</h2>
          <p>Please approve the transaction in your wallet...</p>
          {error && <div className="error">{error}</div>}
        </div>
      )}

      {step === 'confirming' && (
        <div className="processing-screen">
          <div className="spinner large"></div>
          <h2>Transaction Confirmed</h2>
          <p>Please wait while we finalize your order...</p>
          {error && <div className="error">{error}</div>}
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
          <br></br>
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
