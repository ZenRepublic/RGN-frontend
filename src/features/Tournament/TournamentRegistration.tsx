import { useState } from 'react';
import { TournamentData } from './TournamentDisplay';
import { CountdownTimer } from '../../primitives';
import { useJoinTournament } from '@/hooks/useTournament';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { getLongMonthDayYearDate } from '../../utils'
import './TournamentRegistration.css';

interface TournamentRegistrationProps {
  tournament: TournamentData;
  onRegistrationComplete?: () => void;
}

export default function TournamentRegistration({ tournament, onRegistrationComplete }: TournamentRegistrationProps) {
  const joinTournament = useJoinTournament();
  const { account } = useAccountStatus();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlreadyRegistered = !!account && tournament.participants.includes(account._id);
  const registeredCount = tournament.participants.length;
  const maxPlayers = tournament.maxPlayers;
  const isFull = registeredCount >= maxPlayers;

  const handleRegister = async () => {
    if (!tournament._id) return;
    setLoading(true);
    setError(null);
    try {
      await joinTournament(tournament._id);
      onRegistrationComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isAlreadyRegistered && <CountdownTimer startTime={tournament.startTime} />}
      <div className="tournament-registration">
        <h2>{tournament.name}</h2>
        {tournament.description && (
          <p className="tournament-registration-description">{tournament.description}</p>
        )}
        <p className="tournament-registration-start-date">Starts on {getLongMonthDayYearDate(new Date(tournament.startTime))}</p>

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
