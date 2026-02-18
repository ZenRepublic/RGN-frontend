import EpisodeDisplay from './EpisodeDisplay';
import { Order } from '../../utils';

interface EpisodeGridProps {
  orders: Order[];
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  className?: string;
}

export default function EpisodeGrid({
  orders,
  loading = false,
  loadingText = 'Loading episodes...',
  emptyText = 'No episodes found.',
  className,
}: EpisodeGridProps) {
  if (loading) {
    <div className="flex items-center justify-center h-full w-full opacity-60">
        <p className="text-center">{loadingText}</p>
      </div>
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full opacity-60">
        <p className="text-center">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-md justify-start ${className ? ` ${className}` : ''}`}>
      {orders.map(order => (
        <EpisodeDisplay key={order.id} asset={order} />
      ))}
    </div>
  );
}
