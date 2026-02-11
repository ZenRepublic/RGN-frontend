import { useState, useEffect, useRef } from 'react';
import EpisodeDisplay from './EpisodeDisplay';
import {
  fetchOrderById,
  fetchOrdersByWallet,
  fetchOrdersByChannel,
  fetchOrdersByDate,
  Order,
} from '@/utils/orderFetcher';
import './EpisodeLoader.css';

// Re-export types for convenience
export type { Order, Actor } from '@/utils/orderFetcher';

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
  channelId: string;
}

interface ByCollectionProps extends BaseProps {
  mode: 'collection';
  channelId: string;
}

interface ByDateProps extends BaseProps {
  mode: 'date';
  timestamp: number;
  channelId: string;
}

interface ByAssetsProps extends BaseProps {
  mode: 'assets';
  assets: Order[];
  loading?: boolean;
}

type EpisodeLoaderProps = ByIdsProps | ByOwnerProps | ByCollectionProps | ByDateProps | ByAssetsProps;

export default function EpisodeLoader(props: EpisodeLoaderProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderMap, setOrderMap] = useState<Map<string, Order>>(new Map());
  const [loading, setLoading] = useState(false);

  // Track the current fetch key to prevent stale updates
  const fetchKeyRef = useRef<string>('');

  const currentKey = props.mode === 'ids'
    ? props.cacheKey
    : props.mode === 'collection'
    ? `collection-${props.channelId}`
    : props.mode === 'date'
    ? `date-${props.timestamp}-${props.channelId}`
    : props.mode === 'owner'
    ? `${props.ownerAddress}-${props.channelId}`
    : '';

  // Separate effect for 'assets' mode to properly react to prop changes
  useEffect(() => {
    if (props.mode === 'assets') {
      setOrders(props.assets);
      setLoading(props.loading ?? false);
    }
  }, [props.mode === 'assets' ? props.assets : null, props.mode === 'assets' ? props.loading : null]);

  useEffect(() => {
    // Skip if in 'assets' mode - handled by separate effect above
    if (props.mode === 'assets') {
      return;
    }

    fetchKeyRef.current = currentKey;

    const fetchData = async () => {
      setLoading(true);

      try {
        if (props.mode === 'ids') {
          const { assetIds } = props;

          if (assetIds.length === 0) {
            return;
          }

          const results = await Promise.all(assetIds.map(id => fetchOrderById(id)));

          if (fetchKeyRef.current !== currentKey) return;

          const map = new Map<string, Order>();
          results.forEach((order, idx) => {
            if (order) map.set(assetIds[idx], order);
          });
          setOrderMap(map);
        } else if (props.mode === 'collection') {
          const { channelId } = props;

          const fetched = await fetchOrdersByChannel(channelId);

          if (fetchKeyRef.current !== currentKey) return;

          setOrders(fetched);
        } else if (props.mode === 'date') {
          const { timestamp, channelId } = props;

          console.log('EpisodeLoader: Fetching orders for date mode - timestamp:', timestamp, 'date:', new Date(timestamp).toISOString(), 'channelId:', channelId);

          const fetched = await fetchOrdersByDate({ timestamp, channelId });

          console.log('EpisodeLoader: Fetched', fetched.length, 'orders');

          if (fetchKeyRef.current !== currentKey) return;

          setOrders(fetched);
        } else if (props.mode === 'owner') {
          const { ownerAddress, channelId } = props;

          const fetched = await fetchOrdersByWallet(ownerAddress, channelId);
          if (fetchKeyRef.current !== currentKey) return;

          setOrders(fetched);
  
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
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

  const loadingText = props.loadingText || 'Loading episodes...';
  const emptyText = props.emptyText || 'No episodes found.';
  const gridClass = `episode-loader-grid ${props.className || ''}`.trim();

  if (loading) {
    return <div className="episode-loader-loading">{loadingText}</div>;
  }

  if (props.mode === 'ids') {
    if (props.assetIds.length === 0) {
      return <div className="episode-loader-empty">{emptyText}</div>;
    }

    return (
      <div className={gridClass}>
        {props.assetIds.map((id) => (
          <EpisodeDisplay key={id} asset={orderMap.get(id)} />
        ))}
      </div>
    );
  }

  // mode === 'owner', 'collection', 'date', or 'assets'
  if (orders.length === 0) {
    return <div className="episode-loader-empty">{emptyText}</div>;
  }

  return (
    <div className={gridClass}>
      {orders.map((order) => (
        <EpisodeDisplay key={order.id} asset={order} />
      ))}
    </div>
  );
}
