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
  const orders = data.orders || data || [];

  // Ensure we have an array and normalize _id -> id
  const orderArray = (Array.isArray(orders) ? orders : []).map((o: Order & { _id?: string }) => ({
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
