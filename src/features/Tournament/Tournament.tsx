import { useState, useEffect } from 'react';
import EpisodeGrid from '../Episodes/EpisodeGrid';
import { useOrdersByIds } from '@/hooks/useOrdersByIds';
import './Tournament.css';

interface TournamentStages {
  [stageName: string]: {
    matches: string[];
  };
}

export interface TournamentData {
  _id: string;
  name: string;
  description?: string;
  stages: TournamentStages;
  createdAt: string;
}

interface TournamentProps {
  tournament: TournamentData;
}

export default function Tournament({ tournament }: TournamentProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Get stages that have matches
  const stagesWithMatches = Object.entries(tournament.stages).filter(
    ([, stage]) => stage.matches.length > 0
  );

  const currentStage = stagesWithMatches[currentStageIndex];
  const matchIds = currentStage?.[1].matches ?? [];
  const { orders, loading } = useOrdersByIds(matchIds);

  const handlePrevStage = () => {
    setCurrentStageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextStage = () => {
    setCurrentStageIndex(prev => Math.min(stagesWithMatches.length - 1, prev + 1));
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

      {stagesWithMatches.length > 0 && currentStage && (
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
              disabled={currentStageIndex === stagesWithMatches.length - 1}
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
