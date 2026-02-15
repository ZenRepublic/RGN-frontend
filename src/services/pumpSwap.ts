import { PublicKey, Transaction, Connection } from '@solana/web3.js';
import { PumpAmmSdk, OnlinePumpAmmSdk, canonicalPumpPoolPda } from '@pump-fun/pump-swap-sdk';
import BN from 'bn.js';
import type { PublicKey as WalletPublicKey } from '@solana/web3.js';

const SLIPPAGE = 0.005;

export async function executeQuickBuy(
  connection: Connection,
  tokenAddress: string,
  solAmount: number,
  walletPublicKey: WalletPublicKey,
  sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>
): Promise<{ signature: string | null; error: string | null }> {
  try {
    const tokenMint = new PublicKey(tokenAddress);

    const poolKey = canonicalPumpPoolPda(tokenMint);

    const onlineSdk = new OnlinePumpAmmSdk(connection);
    const sdk = new PumpAmmSdk();

    const swapState = await onlineSdk.swapSolanaState(poolKey, walletPublicKey);

    const lamports = new BN(Math.round(solAmount * 1e9));
    const instructions = await sdk.buyQuoteInput(
      swapState,
      lamports,
      SLIPPAGE,
    );

    const tx = new Transaction().add(...instructions);
    tx.feePayer = walletPublicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signature = await sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, 'confirmed');

    return { signature, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Transaction failed';
    return { signature: null, error: msg };
  }
}
