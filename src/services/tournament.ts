const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export async function joinTournament(
  tournamentId: string,
  accountId: string,
  verificationData: any
): Promise<void> {
  const response = await fetch(`${API_URL}/rgn/tournaments/${tournamentId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accountId,
      ...verificationData,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to join for tournament');
  }
}
