import { useState, useEffect } from 'react';
import EpisodeGrid from '../Episodes/EpisodeGrid';
import { useOrdersByIds } from '@/hooks/useOrdersByIds';
import './TournamentDisplay.css';

interface TournamentStages {
  [stageName: string]: {
    episodes: string[];
  };
}

export interface TournamentData {
  _id: string;
  name: string;
  description?: string;
  channelId: string;
  maxPlayers: number;
  participants: string[];
  stages: TournamentStages;
  startTime: string;
  createdAt: string;
}

export default function TournamentDisplay({ tournament }: { tournament: TournamentData }) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Get stages that have episodes
  const stagesWithEpisodes = Object.entries(tournament.stages).filter(
    ([, stage]) => stage.episodes.length > 0
  );

  const currentStage = stagesWithEpisodes[currentStageIndex];
  const episodeIds = currentStage?.[1].episodes ?? [];
  const { orders, loading } = useOrdersByIds(episodeIds);

  const handlePrevStage = () => {
    setCurrentStageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextStage = () => {
    setCurrentStageIndex(prev => Math.min(stagesWithEpisodes.length - 1, prev + 1));
  };

  // Reset stage index when tournament changes
  useEffect(() => {
    setCurrentStageIndex(0);
  }, [tournament._id]);

  return (
    <>
      {tournament.description && (
        <p className="tournament-details">{tournament.description}</p>
      )}

      {stagesWithEpisodes.length > 0 && currentStage && (
        <div className="tournament-stage">
          <div className="tournament-stage-nav">
            <button
              className="tournament-arrow"
              onClick={handlePrevStage}
              disabled={currentStageIndex === 0}
            >
              ←
            </button>
            <h2 className="tournament-stage-name">{currentStage[0]}</h2>
            <button
              className="tournament-arrow"
              onClick={handleNextStage}
              disabled={currentStageIndex === stagesWithEpisodes.length - 1}
            >
              →
            </button>
          </div>

          <EpisodeGrid
            orders={orders}
            loading={loading}
            className="tournament-matches"
          />
        </div>
      )}
    </>
  );
}
