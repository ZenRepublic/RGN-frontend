

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

// ============================================================================
// Pure Service Functions (no React hooks)
// ============================================================================

/**
 * Check if user has already voted on an order
 */
export async function checkVoteStatus(
  orderId: string,
  walletAddress: string
): Promise<{ hasVoted: boolean; votedActorIndex?: number } | null> {
  try {
    const params = new URLSearchParams({
      orderId,
      walletAddress,
    });
    const response = await fetch(`${API_URL}/rgn/episodes/vote-status?${params}`);
    const data = await response.json();

    if (response.ok && data.hasVoted) {
      return { hasVoted: true, votedActorIndex: data.votedActorIndex };
    }
    return { hasVoted: false };
  } catch {
    // If check fails, just return null — let caller handle
    return null;
  }
}

/**
 * Cast a vote with wallet verification
 */
export async function castVote(
  orderId: string,
  actorIndex: number,
  verificationData: any
): Promise<{ success: boolean; votePower?: number; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/rgn/episodes/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        actorIndex,
        ...verificationData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to cast vote',
      };
    }

    return {
      success: true,
      votePower: data.votePower,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cast vote',
    };
  }
}
