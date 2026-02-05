import { useState, useEffect, useRef } from 'react';
import MatchDisplay from './MatchDisplay';
import {
  fetchEpisodesByIds,
  fetchEpisodes,
  fetchEpisodesByCollection,
  fetchEpisodesByDate,
  MplEpisodeAsset,
} from '@/utils/episodeFetcher';
import './MatchLoader.css';

// Re-export types for convenience
export type { MplEpisodeAsset, EpisodeData, Actor } from '@/utils/episodeFetcher';

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

interface ByCollectionProps extends BaseProps {
  mode: 'collection';
  collectionId: string;
}

interface ByDateProps extends BaseProps {
  mode: 'date';
  timestamp: number;
  collectionId: string;
}

type MatchLoaderProps = ByIdsProps | ByOwnerProps | ByCollectionProps | ByDateProps;

export default function MatchLoader(props: MatchLoaderProps) {
  const [assets, setAssets] = useState<MplEpisodeAsset[]>([]);
  const [assetMap, setAssetMap] = useState<Map<string, MplEpisodeAsset>>(new Map());
  const [loading, setLoading] = useState(false);

  // Track the current fetch key to prevent stale updates
  const fetchKeyRef = useRef<string>('');

  const currentKey = props.mode === 'ids'
    ? props.cacheKey
    : props.mode === 'collection'
    ? `collection-${props.collectionId}`
    : props.mode === 'date'
    ? `date-${props.timestamp}-${props.collectionId}`
    : props.mode === 'owner'
    ? `${props.ownerAddress}-${props.collectionId}`
    : '';

  useEffect(() => {
    fetchKeyRef.current = currentKey;

    const fetchData = async () => {
      setLoading(true);

      try {
        if (props.mode === 'ids') {
          const { assetIds, cacheKey } = props;

          if (assetIds.length === 0) {
            return;
          }

          const result = await fetchEpisodesByIds({ assetIds, cacheKey });

          // Only update if this is still the current fetch
          if (fetchKeyRef.current !== currentKey) return;

          setAssetMap(result.assetMap);
        } else if (props.mode === 'collection') {
          const { collectionId } = props;

          const fetchedAssets = await fetchEpisodesByCollection(collectionId);

          if (fetchKeyRef.current !== currentKey) return;

          setAssets(fetchedAssets);
        } else if (props.mode === 'date') {
          const { timestamp, collectionId } = props;

          console.log('MatchLoader: Fetching episodes for date mode - timestamp:', timestamp, 'date:', new Date(timestamp).toISOString(), 'collectionId:', collectionId);

          const fetchedAssets = await fetchEpisodesByDate({
            timestamp,
            collectionId,
            includeEpisodeData: true,
          });

          console.log('MatchLoader: Fetched', fetchedAssets.length, 'episodes');

          if (fetchKeyRef.current !== currentKey) return;

          setAssets(fetchedAssets);
        } else {
          // mode === 'owner'
          const { ownerAddress, collectionId } = props;

          const fetchedAssets = await fetchEpisodes({
            ownerAddress,
            collectionId,
            includeEpisodeData: true,
          });

          if (fetchKeyRef.current !== currentKey) return;

          setAssets(fetchedAssets);
        }
      } catch (err) {
        console.error('Failed to fetch assets:', err);
        props.onError?.('Failed to load data');
      } finally {
        if (fetchKeyRef.current === currentKey) {
          setLoading(false);
        }
        props.onLoadComplete?.();
      }
    };

    fetchData();
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

  // mode === 'owner' or 'collection'
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
