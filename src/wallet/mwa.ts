import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  Transaction,
  VersionedTransaction,
  PublicKey,
} from '@solana/web3.js';

const APP_IDENTITY = { 
    name: 'Ruby Global Network',
    uri:  'https://rgn.cool' ,
    icon: "logo.png", // Full path resolves to https://yourdapp.com/favicon.ico
};

let authToken: string | null = null;
let publicKey: PublicKey | null = null;

/**
 * Initial authorization (first connect).
 * Call this ONCE per session.
 */
export async function mwaAuthorize(
  cluster: 'devnet' | 'mainnet-beta' = 'devnet'
): Promise<PublicKey> {
  const result = await transact(async (wallet: Web3MobileWallet) => {
    return wallet.authorize({
      cluster,
      identity: APP_IDENTITY,
    });
  });

  authToken = result.auth_token;
  publicKey = new PublicKey(result.accounts[0].address);

  return publicKey;
}

/**
 * Reauthorize using an existing auth token.
 * Useful on app reload or scope upgrade.
 */
export async function mwaReauthorize() {
  if (!authToken) {
    throw new Error('No auth token available for reauthorization');
  }

  await transact(async (wallet: Web3MobileWallet) => {
    if (!authToken) return;
    await wallet.reauthorize({
      auth_token: authToken,
      identity: APP_IDENTITY,
    });
  });
}

/**
 * Sign + send a transaction.
 * Assumes authorize() or reauthorize() was already called.
 */
export async function mwaSignAndSend(
  transaction: Transaction | VersionedTransaction
): Promise<string> {
  if (!authToken) {
    throw new Error('MWA not authorized');
  }

  return transact(async (wallet: Web3MobileWallet) => {
    const [signature] = await wallet.signAndSendTransactions({
      transactions: [transaction],
    });

    return signature;
  });
}

/**
 * Sign only (no send).
 */
export async function mwaSignOnly(
  transaction: Transaction | VersionedTransaction
): Promise<Transaction | VersionedTransaction> {
  if (!authToken) {
    throw new Error('MWA not authorized');
  }

  return transact(async (wallet: Web3MobileWallet) => {
    const [signedTx] = await wallet.signTransactions({
      transactions: [transaction],
    });

    return signedTx;
  });
}

/**
 * Disconnect wallet.
 */
export async function mwaDeauthorize() {
  if (!authToken) return;

  await transact(async (wallet: Web3MobileWallet) => {
    if (!authToken) return;
    await wallet.deauthorize({ auth_token: authToken });
  });

  authToken = null;
  publicKey = null;
}