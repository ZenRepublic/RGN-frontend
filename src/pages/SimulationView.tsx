import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MplSimulationAsset } from '@/utils/simulationAssets';
import './SimulationView.css';

const SIMULATION_VIEW_KEY = 'rgn-simulation-view';

// Helper to store asset before navigating
export function storeSimulationAsset(asset: MplSimulationAsset): void {
  localStorage.setItem(SIMULATION_VIEW_KEY, JSON.stringify(asset));
}

// Helper to get stored asset
function getStoredSimulationAsset(): MplSimulationAsset | null {
  const stored = localStorage.getItem(SIMULATION_VIEW_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as MplSimulationAsset;
    } catch {
      return null;
    }
  }
  return null;
}

export default function SimulationView() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [asset, setAsset] = useState<MplSimulationAsset | null>(null);

  useEffect(() => {
    const stored = getStoredSimulationAsset();
    if (stored && stored.orderId === orderId) {
      setAsset(stored);
    } else {
      // No matching asset found, redirect to home
      navigate('/', { replace: true });
    }
  }, [orderId, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  if (!asset) {
    return null;
  }

  return (
    <div className="simulation-view-page">
      <div className="simulation-view-container">
        <button onClick={handleBack} className="simulation-view-back">
          ← Back
        </button>

        <h1 className="simulation-view-title">#{asset.orderId}</h1>

        {asset.animationUrl ? (
          <video
            className="simulation-view-video"
            src={asset.animationUrl}
            controls
            autoPlay
            loop
          />
        ) : (
          <div className="simulation-view-pending">
            <p>Video is still processing...</p>
          </div>
        )}
      </div>
    </div>
  );
}
