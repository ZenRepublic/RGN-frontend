import { useState, useEffect } from 'react';
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
            <span className="tournament-stage-name">{currentStage[0]}</span>
            <button
              className="tournament-arrow"
              onClick={handleNextStage}
              disabled={currentStageIndex === stagesWithMatches.length - 1}
            >
              →
            </button>
          </div>

          <div className="tournament-matches">
            {currentStage[1].matches.map((nftAddress, index) => (
              <div key={index} className="tournament-match">
                {nftAddress}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
