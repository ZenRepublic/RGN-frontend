const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface Account {
  _id: string;
  displayName: string;
  avatar: string | null;
  createdAt: string;
}

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

export interface UpdateProfileData {
  displayName: string;
  imageBuffer: string;
  challengeId: string;
  message: string;
  signature: string;
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

export interface VotePowerData {
  tokenBalance: number;
  votePower: number;
  tiers: Array<{
    title: string;
    minTokens: number;
    votePower: number;
  }>;
}

export async function getAccountVotePower(accountId: string): Promise<VotePowerData> {
  const response = await fetch(`${API_URL}/rgn/account/${accountId}/vote-power`);

  if (!response.ok) {
    throw new Error('Failed to fetch vote power');
  }

  return await response.json();
}
