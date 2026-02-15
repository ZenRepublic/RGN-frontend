const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface VerificationData {
  walletAddress: string;
  challengeId: string;
  message: string;
  signature: string;
}

export async function getVerificationChallenge(walletAddress: string): Promise<VerificationData> {
  const challengeRes = await fetch(`${API_URL}/rgn/verification/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });

  if (!challengeRes.ok) {
    const error = await challengeRes.json();
    throw new Error(error.error || 'Failed to get challenge');
  }

  return await challengeRes.json();
}
