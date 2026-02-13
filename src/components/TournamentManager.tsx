import { useState, useEffect } from 'react';
import TournamentDisplay, { TournamentData } from './TournamentDisplay';
import TournamentRegistration from './TournamentRegistration';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

interface TournamentManagerProps {
  onLoadComplete?: () => void;
}

export default function TournamentManager({ onLoadComplete }: TournamentManagerProps) {
  const [tournaments, setTournaments] = useState<TournamentData[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = async () => {
    try {
      const response = await fetch(`${API_URL}/rgn/get-tournaments`);
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      const data = await response.json();
      // Handle both array response and wrapped response (e.g., { tournaments: [...] })
      const tournamentsArray = Array.isArray(data) ? data : (data.tournaments || data.data || []);
      setTournaments(tournamentsArray);
      if (tournamentsArray.length > 0 && !selectedTournamentId) {
        setSelectedTournamentId(tournamentsArray[0]._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
    } finally {
      setLoading(false);
      onLoadComplete?.();
    }
  };

  useEffect(() => {
    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);
  console.log(selectedTournament);
  const isBeforeStartTime = selectedTournament
    ? new Date() < new Date(selectedTournament.startTime)
    : false;

  return (
    <section className="tournament-section">
      {loading ? (
        <div className="tournament-loading">Loading tournaments...</div>
      ) : error ? (
        <div className="tournament-error">{error}</div>
      ) : tournaments.length === 0 ? (
        <div className="tournament-empty">No tournaments available</div>
      ) : (
        <div className="tournament-content">
          <select
            className="tournament-dropdown"
            value={selectedTournamentId || ''}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
          >
            {tournaments.map(tournament => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
          </select>

          {selectedTournament && (
            isBeforeStartTime ? (
              <TournamentRegistration tournament={selectedTournament} onRegistrationComplete={fetchTournaments} />
            ) : (
              <TournamentDisplay tournament={selectedTournament} />
            )
          )}
        </div>
      )}
    </section>
  );
}
