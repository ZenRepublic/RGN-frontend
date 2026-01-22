import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';  // ← from -react-ui
import { useCallback, useMemo } from 'react';
import { connectWallet, setConnectedPublicKey } from '@/wallet/wallet'; // your existing helpers
import { isSaga } from '@/wallet/platform';
import { PublicKey } from '@solana/web3.js';

export function ConnectWalletButton() {
  const { publicKey, connect, connecting, disconnect, connected } = useWallet();
  const { setVisible: setModalVisible } = useWalletModal(); // ← this opens the modal

  // Optional: show different text based on state (like WalletMultiButton does)
  const buttonText = useMemo(() => {
    if (connecting) return 'Connecting...';
    if (connected) {
      return publicKey
        ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
        : 'Connected';
    }
    return 'Connect Wallet';
  }, [connected, connecting, publicKey]);

  const onClick = useCallback(async () => {

  if (connected) {
    await disconnect?.();
    setConnectedPublicKey(null);
    console.log('[ConnectButton] Disconnected & cleared pubkey');
    return;
  }

  console.log('[ConnectButton] Opening desktop modal');
  setModalVisible(true);
}, [connected, disconnect, setModalVisible]);

  return (
    <button
      onClick={onClick}
      disabled={connecting}
      // Add your styling here – or use className / tailwind etc.
      className={`
        px-4 py-2 rounded-lg font-medium
        ${connected ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
        text-white disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {buttonText}
    </button>
  );
}