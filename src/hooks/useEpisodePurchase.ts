import { useCallback } from 'react';
import { Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { prepareOrder, confirmOrder, OrderResult } from '@/services/episodePurchase';

/**
 * Hook for preparing an episode purchase order
 * Returns a transaction ready to be signed by the wallet
 */
export function usePrepareOrder() {
  return useCallback(async (userWallet: string, channelId: string) => {
    return prepareOrder(userWallet, channelId);
  }, []);
}

/**
 * Hook for confirming an episode purchase order
 * Takes the signed transaction and completes the order
 */
export function useConfirmOrder() {
  return useCallback(
    async (
      signedTransaction: Transaction,
      channelId: string,
      episodeId: string,
      actorData: any,
      startTime: string
    ): Promise<OrderResult> => {
      const signedTxBase64 = Buffer.from(
        signedTransaction.serialize({ requireAllSignatures: false, verifySignatures: false })
      ).toString('base64');

      return confirmOrder(signedTxBase64, channelId, episodeId, actorData, startTime);
    },
    []
  );
}
