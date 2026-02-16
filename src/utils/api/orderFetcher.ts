import { fetchOrdersFromEndpoint, clearOrderCache, Order, Actor } from '../../services/episodeFetch';

// Re-export types and cache function for backward compatibility
export type { Actor, Order };
export { clearOrderCache };

export async function fetchOrderById(orderId: string, useCache: boolean = true): Promise<Order | null> {
  try {
    const orders = await fetchOrdersFromEndpoint({
      cacheKey: `order:${orderId}`,
      endpoint: `/rgn/orders/${orderId}`,
      useCache,
    });
    return orders.length > 0 ? orders[0] : null;
  } catch (err) {
    console.error(`Failed to fetch order ${orderId}:`, err);
    return null;
  }
}

export async function fetchOrdersByWallet(walletAddress: string, channelId?: string): Promise<Order[]> {
  const cacheKey = channelId ? `wallet:${walletAddress}:${channelId}` : `wallet:${walletAddress}`;
  const params = channelId ? { channelId } : undefined;

  return fetchOrdersFromEndpoint({
    cacheKey,
    endpoint: '/rgn/orders/wallet/:address'.replace(':address', walletAddress),
    params,
  });
}

export async function fetchClosestOrders(limit: number = 10, channelId?: string): Promise<Order[]> {
  const cacheKey = channelId ? `closest:${limit}:${channelId}` : `closest:${limit}`;
  const params: Record<string, string | number> = { limit };
  if (channelId) params.channelId = channelId;

  return fetchOrdersFromEndpoint({
    cacheKey,
    endpoint: '/rgn/orders/closest',
    params,
  });
}

export async function fetchCompletedOrders(limit: number = 10, channelId?: string): Promise<Order[]> {
  const cacheKey = channelId ? `completed:${limit}:${channelId}` : `completed:${limit}`;
  const params: Record<string, string | number> = { limit };
  if (channelId) params.channelId = channelId;

  return fetchOrdersFromEndpoint({
    cacheKey,
    endpoint: '/rgn/orders/completed',
    params,
  });
}

interface FetchByRangeOptions {
  startDate: Date | string;
  endDate: Date | string;
  channelId?: string;
}

export async function fetchOrdersByRange({
  startDate,
  endDate,
  channelId,
}: FetchByRangeOptions): Promise<Order[]> {
  const startStr = typeof startDate === 'string' ? startDate : startDate.toISOString();
  const endStr = typeof endDate === 'string' ? endDate : endDate.toISOString();
  const cacheKey = channelId ? `range:${startStr}-${endStr}:${channelId}` : `range:${startStr}-${endStr}`;

  const params: Record<string, string | number> = {
    start: startStr,
    end: endStr,
  };
  if (channelId) params.channelId = channelId;

  return fetchOrdersFromEndpoint({
    cacheKey,
    endpoint: '/rgn/orders/by-range',
    params,
  });
}

interface FetchByDateOptions {
  timestamp: number;
  channelId?: string;
}

export async function fetchOrdersByDate({
  timestamp,
  channelId,
}: FetchByDateOptions): Promise<Order[]> {
  const date = new Date(timestamp);
  const dateStr = date.toISOString();
  const cacheKey = channelId ? `date:${dateStr}:${channelId}` : `date:${dateStr}`;
  const params: Record<string, string | number> | undefined = channelId ? { channelId } : undefined;

  return fetchOrdersFromEndpoint({
    cacheKey,
    endpoint: '/rgn/orders/by-day/:dateStr'.replace(':dateStr', dateStr),
    params,
  });
}

export async function fetchOrdersByChannel(channelId: string): Promise<Order[]> {
  const cacheKey = `channel:${channelId}`;

  return fetchOrdersFromEndpoint({
    cacheKey,
    endpoint: '/rgn/orders/channel/:channelId'.replace(':channelId', channelId),
  });
}
