import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import './App.css';

const API_URL = import.meta.env.API_URL || 'http://localhost:5000';

function App() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected, connecting, disconnect, wallet, connect, select } = useWallet();

  // Auto-connect when wallet is selected from modal
  useEffect(() => {
    if (wallet && !connected && !connecting) {
      connect().catch((err) => {
        console.log('Auto-connect failed:', err.message);
      });
    }
  }, [wallet, connected, connecting, connect]);

  const handleCancelConnect = () => {
    select(null);
    disconnect();
  };

  const [step, setStep] = useState('form'); // 'form', 'processing', 'confirming', 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Payment info from backend
  const [paymentInfo, setPaymentInfo] = useState(null);

  // Form state
  const [fighters, setFighters] = useState([
    { name: '', image: null, imagePreview: '/mystery-fighter.png' },
    { name: '', image: null, imagePreview: '/mystery-fighter.png' }
  ]);

  // Success state
  const [orderResult, setOrderResult] = useState(null);

  // Fetch payment info only when wallet is connected
  useEffect(() => {
    if (!connected) {
      setPaymentInfo(null);
      return;
    }

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
  }, [connected]);

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
        <img src="/logo.png" alt="RGN Logo" className="logo" />
        <h1>DioDudes Battle Arena</h1>
        <p>Order a custom AI battle. Get an NFT with your battle video!</p>
      </header>

      {step === 'form' && (
        <div className="order-form">
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

          {/* Payment Section */}
          <section className="section payment-section">
            <div className="order-header">
              <h2>Order Details</h2>
              <div className="wallet-area">
                <WalletMultiButton />
                {connecting && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCancelConnect}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="payment-details">
              <div className="payment-includes">
                <span>Includes:</span>
                <ul>
                  <li>Custom AI Battle Video</li>
                  <li>NFT with your fighters</li>
                  <li>Permanent on-chain storage</li>
                </ul>
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <button
              type="button"
              className="primary place-order-btn"
              disabled={loading || !connected || !paymentInfo}
              onClick={handlePayAndOrder}
            >
              {!connected
                ? 'Connect Wallet to Order'
                : loading
                  ? 'Processing...'
                  : `Place Order   (${paymentInfo?.price || '...'} SOL)`}
            </button>
          </section>
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
                  href={`https://solscan.io/token/${orderResult.nftAddress}?cluster=${import.meta.env.SOL_NETWORK || 'devnet'}`}
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
    </div>
  );
}

export default App;
