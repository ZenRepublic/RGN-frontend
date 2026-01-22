import { PublicKey, Transaction, VersionedTransaction, Connection } from '@solana/web3.js';
import { isSaga } from './platform';
import {
  mwaAuthorize,
  mwaSignAndSend,
} from './mwa';

let connectedPublicKey: PublicKey | null = null;

export async function connectWallet(desktopPublicKey?: PublicKey): Promise<PublicKey> {
//   if (isSaga()) {
//     // MWA path
//     connectedPublicKey = await mwaAuthorize('devnet');
//     return connectedPublicKey;
//     throw new Error('MWA wallet not connected');
//   }

  // Desktop path: optionally set pubkey if provided (wallet-adapter handles actual connect via UI)
  if (desktopPublicKey) {
    connectedPublicKey = desktopPublicKey;
    return connectedPublicKey;
  }

  throw new Error('Desktop connect should be handled via wallet-adapter UI');
}

export function setConnectedPublicKey(pk: PublicKey | null) {
  connectedPublicKey = pk;
}

export function getConnectedPublicKey() {
  return connectedPublicKey;
}

export async function signAndSendTransaction(
  tx: Transaction | VersionedTransaction,
  connection?: Connection,
  signTransaction?: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>
): Promise<string> {
//   if (isSaga()) {
//     if (!connectedPublicKey) {
//       throw new Error('MWA wallet not connected');
//     }
//     return mwaSignAndSend(tx);
//   }

  // Classic Desktop/Wallet Browser path
  if (!connection || !signTransaction) {
    throw new Error('Connection and signTransaction required for desktop wallet');
  }

  const signedTx = await signTransaction(tx);
  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
    preflightCommitment: 'confirmed',
  });

  return signature;
}