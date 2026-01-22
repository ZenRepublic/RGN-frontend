import { useState, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { SolanaMobileWalletAdapterWalletName } from '@solana-mobile/wallet-standard-mobile';

export function ConnectWalletButton() {
  const {
    wallet,
    wallets,
    connected,
    connecting,
    connect,
    disconnect,
    select,
  } = useWallet();

  const { setVisible: setModalVisible } = useWalletModal();

  const [isHovered, setIsHovered] = useState(false);

  const defaultText = useMemo(() => {
    if (connecting) return 'Connecting...';
    if (!connected) return 'Connect Wallet';

    const pk = wallet?.adapter.publicKey?.toBase58() ?? '';
    return pk ? `${pk.slice(0, 4)}..${pk.slice(-4)}` : 'Connected';
  }, [connecting, connected, wallet?.adapter.publicKey]);

  // This is the only place where we decide what to show
  const displayedText = connected && isHovered ? 'Disconnect' : defaultText;

  const handleClick = useCallback(async () => {
    if (connected) {
      await disconnect();
      return;
    }

    if (wallet?.adapter.name === SolanaMobileWalletAdapterWalletName) {
      await connect();
      return;
    }

    const mwa = wallets.find(w => w.adapter.name === SolanaMobileWalletAdapterWalletName);
    if (mwa) {
      await select(mwa.adapter.name);
      return;
    }

    setModalVisible(true);
  }, [connected, disconnect, connect, wallet, wallets, select, setModalVisible]);

  return (
    <button
      onClick={handleClick}
      disabled={connecting}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        px-4 py-2 rounded-lg font-medium min-w-[140px] text-center
        transition-colors duration-150
        ${connected
          ? 'bg-green-600 hover:bg-red-600 active:bg-red-700'
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
        text-white disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {displayedText}
    </button>
  );
}