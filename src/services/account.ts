import type { Account, UpdateProfileData, VotePowerData } from '@/types';

// Re-export types for backwards compatibility
export type { Account, UpdateProfileData, VotePowerData };

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export async function getAccountStatus(walletAddress: string): Promise<Account | null> {
  const response = await fetch(`${API_URL}/rgn/account/${walletAddress}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.account || data;
}

export async function registerAccount(verificationData: any): Promise<Account> {
  const response = await fetch(`${API_URL}/rgn/account/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verificationData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to register account');
  }

  const data = await response.json();
  return data.account || data;
}


export async function updateAccount(walletAddress: string, updateData: UpdateProfileData): Promise<Account> {
  const response = await fetch(`${API_URL}/rgn/account/${walletAddress}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update account');
  }

  const data = await response.json();
  return data.account || data;
}


export async function getAccountVotePower(accountId: string): Promise<VotePowerData> {
  const response = await fetch(`${API_URL}/rgn/account/${accountId}/vote-power`);

  if (!response.ok) {
    throw new Error('Failed to fetch vote power');
  }

  return await response.json();
}
