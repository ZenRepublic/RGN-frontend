import { useState } from 'react';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { useWalletVerification } from '@/hooks/useWalletVerification';
import { TournamentData } from './TournamentDisplay';
import { CountdownTimer } from './CountdownTimer';
import './TournamentRegistration.css';

interface TournamentRegistrationProps {
  tournament: TournamentData;
  onRegistrationComplete?: () => void;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export default function TournamentRegistration({ tournament, onRegistrationComplete }: TournamentRegistrationProps) {
  const { account, hasAccount } = useAccountStatus();
  const { verify } = useWalletVerification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!hasAccount || !account) {
      setError('You must be logged in to register for a tournament');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get verification data (challenge, sign message, return signature)
      const verificationData = await verify();

      // Register for tournament with verification
      const response = await fetch(`${API_URL}/rgn/tournaments/${tournament._id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: account._id,
          ...verificationData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to join for tournament');
      }

      onRegistrationComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join for tournament');
    } finally {
      setLoading(false);
    }
  };

  const registeredCount = tournament.participants.length;
  const maxPlayers = tournament.maxPlayers;
  const isFull = registeredCount >= maxPlayers;
  const isAlreadyRegistered = account ? tournament.participants.includes(account._id) : false;

  const startDate = new Date(tournament.startTime).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
    {!isAlreadyRegistered && <CountdownTimer startTime={tournament.startTime} />}
    <div className="tournament-registration">
      <h2>{tournament.name}</h2>
      {tournament.description && (
        <p className="tournament-registration-description">{tournament.description}</p>
      )}
      <p className="tournament-registration-start-date">Starts on {startDate}</p>

      <div className="tournament-registration-info">
        <div className="registration-stat">
          <span className="stat-label">Actors Registered</span>
          <span className="stat-value">{registeredCount}/{maxPlayers}</span>
        </div>
      </div>

      {error && <div className="tournament-registration-error">{error}</div>}
      <button
        className="tournament-register-button"
        onClick={handleRegister}
        disabled={loading || isFull || isAlreadyRegistered}
      >
        {loading ? 'Registering...' : isAlreadyRegistered ? "You're in!" : isFull ? 'Tournament Full' : 'Register'}
      </button>
    </div>
    </>
  );
}
