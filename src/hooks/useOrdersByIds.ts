import { useState, useEffect, useRef } from 'react';
import { fetchOrderById, Order } from '../services/episodeFetch';
import { useToast } from '../context/ToastContext';

export function useOrdersByIds(assetIds: string[]): { orders: Order[]; loading: boolean } {
  const { showToast } = useToast();
  const [orderMap, setOrderMap] = useState<Map<string, Order>>(new Map());
  const [loading, setLoading] = useState(false);
  const fetchKeyRef = useRef('');

  const idsKey = assetIds.join(',');

  useEffect(() => {
    if (!idsKey) {
      setOrderMap(new Map());
      return;
    }

    fetchKeyRef.current = idsKey;
    setLoading(true);

    Promise.all(assetIds.map(id => fetchOrderById(id)))
      .then(results => {
        if (fetchKeyRef.current !== idsKey) return;
        const map = new Map<string, Order>();
        results.forEach((order, idx) => {
          if (order) map.set(assetIds[idx], order);
        });
        setOrderMap(map);
      })
      .catch(() => showToast('Failed to load episodes'))
      .finally(() => {
        if (fetchKeyRef.current === idsKey) setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const orders = assetIds.map(id => orderMap.get(id)).filter((o): o is Order => !!o);
  return { orders, loading };
}
