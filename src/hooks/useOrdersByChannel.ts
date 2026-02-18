import { useState, useEffect, useRef } from 'react';
import { fetchOrdersByChannel, Order } from '../utils';
import { useToast } from '../context/ToastContext';

export function useOrdersByChannel(channelId: string): { orders: Order[]; loading: boolean } {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchKeyRef = useRef('');

  useEffect(() => {
    if (!channelId) return;

    const key = `channel-${channelId}`;
    fetchKeyRef.current = key;
    setLoading(true);

    fetchOrdersByChannel(channelId)
      .then(results => {
        if (fetchKeyRef.current !== key) return;
        setOrders(results);
      })
      .catch(() => showToast('Failed to load episodes'))
      .finally(() => {
        if (fetchKeyRef.current === key) setLoading(false);
      });
  }, [channelId]);

  return { orders, loading };
}
