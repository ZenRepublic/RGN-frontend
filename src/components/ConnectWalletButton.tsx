import { useCallback, useMemo } from 'react';
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

  const buttonText = useMemo(() => {
    if (connecting) return 'Connecting...';
    if (connected && wallet?.adapter.publicKey) {
      const pk = wallet.adapter.publicKey.toBase58();
      return `${pk.slice(0, 4)}...${pk.slice(-4)}`;
    }
    return 'Connect Wallet';
  }, [connected, connecting, wallet]);

  const onClick = useCallback(async () => {
    if (connected) {
      await disconnect();
      return;
    }

    // 1. If MWA is already selected, connect directly
    if (wallet?.adapter.name === SolanaMobileWalletAdapterWalletName) {
      await connect();
      return;
    }

    // 2. Prefer MWA if it exists
    const mwaWallet = wallets.find(
      (w) => w.adapter.name === SolanaMobileWalletAdapterWalletName
    );

    if (mwaWallet) {
      await select(mwaWallet.adapter.name);
      return;
    }

    // 3. Fallback: open wallet modal
    setModalVisible(true);
  }, [
    connected,
    disconnect,
    connect,
    wallet,
    wallets,
    select,
    setModalVisible,
  ]);

  return (
    <button
      onClick={onClick}
      disabled={connecting}
      className="
        px-4 py-2 rounded-lg font-medium
        bg-blue-600 hover:bg-blue-700
        text-white disabled:opacity-50
      "
    >
      {buttonText}
    </button>
  );
}