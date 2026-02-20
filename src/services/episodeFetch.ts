const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface Actor {
  name: string;
  imageUrl: string;
  votes: number;
}

export interface Order {
  id: string;
  channelId?: string;
  episodeId?: string;
  coverImageUrl?: string;
  videoUrl?: string;
  actors?: Actor[];
  startTime: string;
  status: string;
  payerWallet?: string;
}

// Single source of truth for orders (by order ID)
const orderCache = new Map<string, Order>();

// Query cache stores just IDs (pointers to orderCache)
const queryCache = new Map<string, string[]>();

function getOrdersFromCache(ids: string[]): Order[] {
  return ids.map(id => orderCache.get(id)).filter((o): o is Order => o !== null);
}

function cacheOrders(orders: Order[]): void {
  orders.forEach(order => orderCache.set(order.id, order));
}

function filterAndSortOrders(orders: Order[]): Order[] {
  return orders
    .filter(order => order.startTime)
    .sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeB - timeA; // Descending (most recent first)
    });
}

interface FetchOrdersOptions {
  cacheKey: string;
  endpoint: string;
  params?: Record<string, string | number>;
  useCache?: boolean;
}

export async function fetchOrdersFromEndpoint({
  cacheKey,
  endpoint,
  params,
  useCache = true,
}: FetchOrdersOptions): Promise<Order[]> {
  // Check query cache only if useCache is true
  if (useCache) {
    const cachedIds = queryCache.get(cacheKey);
    if (cachedIds) {
      return getOrdersFromCache(cachedIds);
    }
  }

  const url = new URL(`${API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders from ${endpoint}: ${response.statusText}`);
  }

  const data = await response.json();
  const orders = data.orders || [data.order] || data;

  // Normalize _id -> id
  const orderArray = orders.map((o: Order & { _id?: string }) => ({
    ...o,
    id: o.id || o._id || '',
  }));

  const filteredOrders = filterAndSortOrders(orderArray);
  // Cache orders and query result
  cacheOrders(filteredOrders);
  queryCache.set(cacheKey, filteredOrders.map(o => o.id));

  return filteredOrders;
}

export function clearOrderCache(): void {
  orderCache.clear();
  queryCache.clear();
}

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
    endpoint: `/rgn/orders/wallet/${walletAddress}`,
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

export async function fetchOrdersByRange({ startDate, endDate, channelId }: FetchByRangeOptions): Promise<Order[]> {
  const startStr = typeof startDate === 'string' ? startDate : startDate.toISOString();
  const endStr = typeof endDate === 'string' ? endDate : endDate.toISOString();
  const cacheKey = channelId ? `range:${startStr}-${endStr}:${channelId}` : `range:${startStr}-${endStr}`;

  const params: Record<string, string | number> = { start: startStr, end: endStr };
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

export async function fetchOrdersByDate({ timestamp, channelId }: FetchByDateOptions): Promise<Order[]> {
  const dateStr = new Date(timestamp).toISOString();
  const cacheKey = channelId ? `date:${dateStr}:${channelId}` : `date:${dateStr}`;
  const params: Record<string, string | number> | undefined = channelId ? { channelId } : undefined;

  return fetchOrdersFromEndpoint({
    cacheKey,
    endpoint: `/rgn/orders/by-day/${dateStr}`,
    params,
  });
}

export async function fetchOrdersByChannel(channelId: string): Promise<Order[]> {
  return fetchOrdersFromEndpoint({
    cacheKey: `channel:${channelId}`,
    endpoint: `/rgn/orders/channel/${channelId}`,
  });
}
