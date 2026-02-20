import { useState, useEffect, useRef } from 'react';
import { fetchOrdersByRange, Order } from '../services/episodeFetch';
import { useToast } from '../context/ToastContext';

interface UseOrdersByRangeParams {
  startDate: Date;
  endDate: Date;
  channelId: string;
}

export function useOrdersByRange({ startDate, endDate, channelId }: UseOrdersByRangeParams): { orders: Order[]; loading: boolean } {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchKeyRef = useRef('');

  const fetchKey = `${channelId}:${startDate.getTime()}:${endDate.getTime()}`;

  useEffect(() => {
    if (!channelId) {
      setOrders([]);
      return;
    }

    fetchKeyRef.current = fetchKey;
    setLoading(true);

    fetchOrdersByRange({ startDate, endDate, channelId })
      .then(result => {
        if (fetchKeyRef.current !== fetchKey) return;
        setOrders(result);
      })
      .catch(() => showToast('Failed to load episodes'))
      .finally(() => {
        if (fetchKeyRef.current === fetchKey) setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  return { orders, loading };
}
