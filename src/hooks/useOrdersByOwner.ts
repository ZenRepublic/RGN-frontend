import { useState, useEffect, useRef } from 'react';
import { fetchOrdersByWallet, Order } from '../services/episodeFetch';
import { useToast } from '../context/ToastContext';

export function useOrdersByOwner(ownerAddress: string, channelId: string): { orders: Order[]; loading: boolean } {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchKeyRef = useRef('');

  useEffect(() => {
    if (!ownerAddress) return;

    const key = `${ownerAddress}-${channelId}`;
    fetchKeyRef.current = key;
    setLoading(true);

    fetchOrdersByWallet(ownerAddress, channelId)
      .then(results => {
        if (fetchKeyRef.current !== key) return;
        setOrders(results);
      })
      .catch(() => showToast('Failed to load episodes'))
      .finally(() => {
        if (fetchKeyRef.current === key) setLoading(false);
      });
  }, [ownerAddress, channelId]);

  return { orders, loading };
}
