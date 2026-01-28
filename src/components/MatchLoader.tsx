import { useState, useEffect, useRef } from 'react';
import MatchDisplay from './MatchDisplay';
import {
  fetchSimulationAssetsByIds,
  fetchSimulationAssets,
  MplSimulationAsset,
} from '@/utils/simulationAssets';
import './MatchLoader.css';

// Re-export types for convenience
export type { MplSimulationAsset, MatchData, Fighter } from '@/utils/simulationAssets';

// Caches
const idAssetsCache = new Map<string, Map<string, MplSimulationAsset>>();
const ownerAssetsCache = new Map<string, MplSimulationAsset[]>();

// Component props
interface BaseProps {
  onError?: (message: string) => void;
  onLoadComplete?: () => void;
  loadingText?: string;
  emptyText?: string;
  className?: string;
}

interface ByIdsProps extends BaseProps {
  mode: 'ids';
  assetIds: string[];
  cacheKey: string;
}

interface ByOwnerProps extends BaseProps {
  mode: 'owner';
  ownerAddress: string;
  collectionId: string;
}

type MatchLoaderProps = ByIdsProps | ByOwnerProps;

export default function MatchLoader(props: MatchLoaderProps) {
  const [assets, setAssets] = useState<MplSimulationAsset[]>([]);
  const [assetMap, setAssetMap] = useState<Map<string, MplSimulationAsset>>(new Map());
  const [loading, setLoading] = useState(false);

  // Track the current fetch key to prevent stale updates
  const fetchKeyRef = useRef<string>('');

  const currentKey = props.mode === 'ids'
    ? props.cacheKey
    : `${props.ownerAddress}-${props.collectionId}`;

  useEffect(() => {
    fetchKeyRef.current = currentKey;

    if (props.mode === 'ids') {
      const { assetIds, cacheKey, onError, onLoadComplete } = props;

      // Check cache
      const cached = idAssetsCache.get(cacheKey);
      if (cached) {
        setAssetMap(cached);
        onLoadComplete?.();
        return;
      }

      if (assetIds.length === 0) {
        onLoadComplete?.();
        return;
      }

      const fetchAssets = async () => {
        setLoading(true);
        try {
          const fetchedAssets = await fetchSimulationAssetsByIds(assetIds);

          // Only update if this is still the current fetch
          if (fetchKeyRef.current !== cacheKey) return;

          const map = new Map<string, MplSimulationAsset>();
          fetchedAssets.forEach((asset, index) => {
            map.set(assetIds[index], asset);
          });
          setAssetMap(map);
          idAssetsCache.set(cacheKey, map);
        } catch (err) {
          console.error('Failed to fetch assets:', err);
          onError?.('Failed to load matches');
        } finally {
          if (fetchKeyRef.current === cacheKey) {
            setLoading(false);
          }
          onLoadComplete?.();
        }
      };

      fetchAssets();
    } else {
      const { ownerAddress, collectionId, onError, onLoadComplete } = props;
      const cacheKey = `${ownerAddress}-${collectionId}`;

      // Check cache
      const cached = ownerAssetsCache.get(cacheKey);
      if (cached) {
        setAssets(cached);
        onLoadComplete?.();
        return;
      }

      const fetchAssets = async () => {
        setLoading(true);
        try {
          const fetchedAssets = await fetchSimulationAssets({
            ownerAddress,
            collectionId,
            includeMatchData: true,
          });

          // Only update if this is still the current fetch
          if (fetchKeyRef.current !== cacheKey) return;

          setAssets(fetchedAssets);
          ownerAssetsCache.set(cacheKey, fetchedAssets);
        } catch (err) {
          console.error('Failed to fetch assets:', err);
          onError?.('Failed to load simulations');
        } finally {
          if (fetchKeyRef.current === cacheKey) {
            setLoading(false);
          }
          onLoadComplete?.();
        }
      };

      fetchAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  const loadingText = props.loadingText || 'Loading matches...';
  const emptyText = props.emptyText || 'No matches found.';
  const gridClass = `match-loader-grid ${props.className || ''}`.trim();

  if (loading) {
    return <div className="match-loader-loading">{loadingText}</div>;
  }

  if (props.mode === 'ids') {
    if (props.assetIds.length === 0) {
      return <div className="match-loader-empty">{emptyText}</div>;
    }

    return (
      <div className={gridClass}>
        {props.assetIds.map((id, index) => (
          <MatchDisplay key={index} asset={assetMap.get(id)} />
        ))}
      </div>
    );
  }

  // mode === 'owner'
  if (assets.length === 0) {
    return <div className="match-loader-empty">{emptyText}</div>;
  }

  return (
    <div className={gridClass}>
      {assets.map((asset) => (
        <MatchDisplay key={asset.id} asset={asset} />
      ))}
    </div>
  );
}
