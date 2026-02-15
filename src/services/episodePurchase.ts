import { Transaction } from '@solana/web3.js';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface OrderResult {
  channelId?: string;
  episodeId?: string;
  coverImageUrl?: string;
  queuePosition: number;
  estimatedDelivery: string;
  error?: string;
}

interface PrepareResponse {
  transaction: string;
  channelId: string;
  episodeId: string;
  error?: string;
}

export async function prepareOrder(
  userWallet: string,
  channelId: string
): Promise<{ transaction: Transaction; channelId: string; episodeId: string }> {
  const response = await fetch(`${API_URL}/rgn/orders/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userWallet, channelId })
  });

  const data = await response.json() as PrepareResponse;

  if (!response.ok) {
    throw new Error(data.error || 'Failed to prepare order');
  }

  const { transaction: txBase64, channelId: responseChannelId, episodeId } = data;
  const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));
  const transaction = Transaction.from(txBytes);

  return {
    transaction,
    channelId: responseChannelId,
    episodeId
  };
}

export async function confirmOrder(
  signedTransaction: string,
  channelId: string,
  episodeId: string,
  actorData: any,
  startTime: string
): Promise<OrderResult> {
  const response = await fetch(`${API_URL}/rgn/orders/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signedTransaction,
      channelId,
      episodeId,
      actorData,
      startTime
    })
  });

  const data = await response.json() as OrderResult;

  if (!response.ok && data.episodeId) {
    // Partial success - NFT minted but metadata failed
    return data;
  }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to confirm order');
  }

  return data;
}
