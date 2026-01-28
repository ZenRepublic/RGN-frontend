import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSimulationAssetsByIds, MplSimulationAsset } from '@/utils/simulationAssets';
import { storeSimulationAsset } from '@/pages/SimulationView';
import './Tournament.css';

// Cache for tournament assets (persists across component re-mounts)
const tournamentAssetsCache = new Map<string, Map<string, MplSimulationAsset>>();

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
  const navigate = useNavigate();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [assets, setAssets] = useState<Map<string, MplSimulationAsset>>(new Map());
  const [loadingAssets, setLoadingAssets] = useState(false);

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

  const handleView = (asset: MplSimulationAsset) => {
    storeSimulationAsset(asset);
    navigate(`/simulation/${asset.orderId}`);
  };

  // Reset stage index when tournament changes
  useEffect(() => {
    setCurrentStageIndex(0);
  }, [tournament._id]);

  // Fetch all NFT assets for the tournament (only when tournament ID changes)
  useEffect(() => {
    // Check cache first
    const cached = tournamentAssetsCache.get(tournament._id);
    if (cached) {
      setAssets(cached);
      return;
    }

    const allNftIds = Object.values(tournament.stages)
      .flatMap(stage => stage.matches)
      .filter(id => id);

    if (allNftIds.length === 0) return;

    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const fetchedAssets = await fetchSimulationAssetsByIds(allNftIds);
        const assetMap = new Map<string, MplSimulationAsset>();
        fetchedAssets.forEach((asset, index) => {
          assetMap.set(allNftIds[index], asset);
        });
        setAssets(assetMap);
        // Store in cache
        tournamentAssetsCache.set(tournament._id, assetMap);
      } catch (err) {
        console.error('Failed to fetch tournament assets:', err);
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

          {loadingAssets ? (
            <div className="tournament-loading">Loading matches...</div>
          ) : (
            <div className="tournament-matches">
              {currentStage[1].matches.map((nftAddress, index) => {
                const asset = assets.get(nftAddress);
                const fighters = asset?.matchData?.fighters || [];
                const fighter1 = fighters[0];
                const fighter2 = fighters[1];

                return (
                  <div key={index} className="tournament-match">
                    <div className="tournament-match-content">
                      <div className="tournament-match-fighter tournament-match-fighter--left">
                        {fighter1 ? (
                          <>
                            <span className="tournament-match-fighter-name">{fighter1.name}</span>
                            <img
                              src={fighter1.imageUrl}
                              alt={fighter1.name}
                              className="tournament-match-fighter-img"
                            />
                          </>
                        ) : (
                          <div className="tournament-match-fighter-placeholder" />
                        )}
                      </div>

                      <span className="tournament-match-vs">VS</span>

                      <div className="tournament-match-fighter tournament-match-fighter--right">
                        {fighter2 ? (
                          <>
                            <span className="tournament-match-fighter-name">{fighter2.name}</span>
                            <img
                              src={fighter2.imageUrl}
                              alt={fighter2.name}
                              className="tournament-match-fighter-img"
                            />
                          </>
                        ) : (
                          <div className="tournament-match-fighter-placeholder" />
                        )}
                      </div>
                    </div>

                    <button
                      className="tournament-match-view-btn"
                      onClick={() => asset && handleView(asset)}
                      disabled={!asset}
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
