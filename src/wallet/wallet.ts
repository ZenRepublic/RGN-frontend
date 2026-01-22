import {
  Transaction,
  VersionedTransaction,
  Connection,
} from '@solana/web3.js';

import type {
  WalletContextState,
} from '@solana/wallet-adapter-react';

/**
 * Facade around Wallet Adapter.
 * Does NOT store state.
 */
export async function signAndSendTransaction(
  wallet: WalletContextState,
  tx: Transaction | VersionedTransaction,
  connection: Connection,
): Promise<string> {
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  if (!wallet.signTransaction) {
    throw new Error('Wallet does not support signTransaction');
  }

  const signedTx = await wallet.signTransaction(tx);

  const signature = await connection.sendRawTransaction(
    signedTx.serialize(),
    {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: 'confirmed',
    }
  );

  return signature;
}