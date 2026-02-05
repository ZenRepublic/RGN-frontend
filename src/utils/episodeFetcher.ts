const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface Actor {
  name: string;
  imageUrl: string;
  votes: number;
}

export interface EpisodeData {
  orderId: string;
  actors: Actor[];
  status: string;
  startTime: string;
}

export interface MplEpisodeAsset {
  id: string; // NFT address
  orderId: string;
  name: string;
  image: string;
  animationUrl: string | null;
  episodeData: EpisodeData | null;
}

// Single source of truth for assets (by asset ID)
const assetCache = new Map<string, MplEpisodeAsset>();

// Query cache stores just IDs (pointers to assetCache)
const queryCache = new Map<string, string[]>();

function getAssetsFromCache(ids: string[]): MplEpisodeAsset[] {
  return ids.map(id => assetCache.get(id)).filter((a): a is MplEpisodeAsset => a !== null);
}

function cacheAssets(assets: MplEpisodeAsset[]): void {
  assets.forEach(asset => assetCache.set(asset.id, asset));
}

function filterAndSortAssets(assets: MplEpisodeAsset[]): MplEpisodeAsset[] {
  return assets
    .filter(asset => asset.episodeData?.startTime)
    .sort((a, b) => {
      const timeA = new Date(a.episodeData!.startTime).getTime();
      const timeB = new Date(b.episodeData!.startTime).getTime();
      return timeB - timeA; // Descending (most recent first)
    });
}

interface BaseAsset {
  id: string;
  orderId: string;
  name: string;
  image: string;
  animationUrl: string | null;
  jsonUri: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseHeliusItems(items: any[]): BaseAsset[] {
  return items
    .filter((item) => item)
    .map((item) => {
      const name = item.content?.metadata?.name || 'Unnamed';
      // Extract order ID from name like "Dio Dudes #OMF561" -> "OMF561"
      const hashIndex = name.indexOf('#');
      const orderId = hashIndex !== -1 ? name.substring(hashIndex + 1) : name;

      return {
        id: item.id,
        orderId,
        name,
        image: item.content?.links?.image || '',
        animationUrl: item.content?.links?.animation_url || null,
        jsonUri: item.content?.json_uri || null,
      };
    });
}

async function enrichWithEpisodeData(
  baseAssets: BaseAsset[],
  includeEpisodeData: boolean
): Promise<MplEpisodeAsset[]> {
  if (!includeEpisodeData) {
    return baseAssets.map(({ jsonUri, ...asset }) => ({
      ...asset,
      episodeData: null,
    }));
  }

  return Promise.all(
    baseAssets.map(async ({ jsonUri, ...asset }) => {
      // Check if we already have this asset enriched in cache
      const cached = assetCache.get(asset.id);
      if (cached?.episodeData) {
        return cached;
      }

      let episodeData: EpisodeData | null = null;

      if (jsonUri) {
        try {
          const metadataResponse = await fetch(jsonUri);
          const metadata = await metadataResponse.json();
          episodeData = metadata.episodeData || null;
        } catch (err) {
          console.error(`Failed to fetch metadata for ${asset.orderId}:`, err);
        }
      }

      return {
        ...asset,
        episodeData: episodeData,
      };
    })
  );
}

interface FetchEpisodesOptions {
  ownerAddress: string;
  collectionId: string;
  includeEpisodeData?: boolean;
  page?: number;
  limit?: number;
}

interface FetchByIdsOptions {
  assetIds: string[];
  cacheKey: string;
  includeEpisodeData?: boolean;
}

interface FetchByIdsResult {
  assets: MplEpisodeAsset[];
  assetMap: Map<string, MplEpisodeAsset>;
}

export async function fetchEpisodesByIds({
  assetIds,
  cacheKey,
  includeEpisodeData = true,
}: FetchByIdsOptions): Promise<FetchByIdsResult> {
  if (assetIds.length === 0) return { assets: [], assetMap: new Map() };

  // Check query cache
  const cachedIds = queryCache.get(cacheKey);
  if (cachedIds) {
    const assets = getAssetsFromCache(cachedIds);
    const assetMap = new Map<string, MplEpisodeAsset>();
    cachedIds.forEach(id => {
      const asset = assetCache.get(id);
      if (asset) assetMap.set(id, asset);
    });
    return { assets, assetMap };
  }

  const response = await fetch(`${API_URL}/rgn/episodes/fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'by_ids',
      params: { ids: assetIds },
    }),
  });

  const data = await response.json();
  const items = data?.result || [];
  const baseAssets = parseHeliusItems(items);
  const enrichedAssets = await enrichWithEpisodeData(baseAssets, includeEpisodeData);
  const assets = filterAndSortAssets(enrichedAssets);

  // Cache assets and query result
  cacheAssets(assets);
  queryCache.set(cacheKey, assets.map(a => a.id));

  // Build map
  const assetMap = new Map<string, MplEpisodeAsset>();
  assets.forEach(asset => {
    assetMap.set(asset.id, asset);
  });

  return { assets, assetMap };
}

export async function fetchEpisodesByCollection(
  collectionId: string,
  includeMatchData = true
): Promise<MplEpisodeAsset[]> {
  const cacheKey = `collection:${collectionId}`;

  // Check query cache
  const cachedIds = queryCache.get(cacheKey);
  if (cachedIds) {
    return getAssetsFromCache(cachedIds);
  }

  const response = await fetch(`${API_URL}/rgn/episodes/fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'by_collection',
      params: { collectionId, page: 1, limit: 100 },
    }),
  });

  const data = await response.json();
  const items = data?.result?.items || [];
  const baseAssets = parseHeliusItems(items);
  const enrichedAssets = await enrichWithEpisodeData(baseAssets, includeMatchData);
  const assets = filterAndSortAssets(enrichedAssets);

  // Cache assets and query result
  cacheAssets(assets);
  queryCache.set(cacheKey, assets.map(a => a.id));

  return assets;
}

export async function fetchEpisodes({
  ownerAddress,
  collectionId,
  includeEpisodeData = false,
  page = 1,
  limit = 100,
}: FetchEpisodesOptions): Promise<MplEpisodeAsset[]> {
  const cacheKey = `owner:${ownerAddress}:${collectionId}`;

  // Check query cache
  const cachedIds = queryCache.get(cacheKey);
  if (cachedIds) {
    return getAssetsFromCache(cachedIds);
  }

  const response = await fetch(`${API_URL}/rgn/episodes/fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'by_owner',
      params: { ownerAddress, collectionId, page, limit },
    }),
  });

  const data = await response.json();
  const items = data?.result?.items || [];
  const baseAssets = parseHeliusItems(items);
  const enrichedAssets = await enrichWithEpisodeData(baseAssets, includeEpisodeData);
  const assets = filterAndSortAssets(enrichedAssets);

  // Cache assets and query result
  cacheAssets(assets);
  queryCache.set(cacheKey, assets.map(a => a.id));

  return assets;
}

interface FetchEpisodesByDateOptions {
  timestamp: number;
  collectionId: string;
  includeEpisodeData?: boolean;
}

interface FetchEpisodesByDateRangeOptions {
  startTimestamp: number;
  endTimestamp: number;
  collectionId: string;
  includeEpisodeData?: boolean;
}

export async function fetchEpisodesByDate({
  timestamp,
  collectionId,
  includeEpisodeData = true,
}: FetchEpisodesByDateOptions): Promise<MplEpisodeAsset[]> {
  const cacheKey = `date:${timestamp}:${collectionId}`;

  console.log('fetchEpisodesByDate: Called with timestamp:', timestamp, 'date:', new Date(timestamp).toISOString(), 'collectionId:', collectionId);

  // Check query cache
  const cachedIds = queryCache.get(cacheKey);
  if (cachedIds) {
    console.log('fetchEpisodesByDate: Using cached data, found', cachedIds.length, 'episodes');
    return getAssetsFromCache(cachedIds);
  }

  // Step 1: Fetch orders from database by date
  const date = new Date(timestamp);
  const dateStr = date.toISOString();

  console.log('fetchEpisodesByDate: Fetching orders from API:', `${API_URL}/rgn/orders/by-day/${dateStr}`);

  const response = await fetch(`${API_URL}/rgn/orders/by-day/${dateStr}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  console.log('fetchEpisodesByDate: API response:', data);

  if (!data.success) {
    console.error('Failed to fetch orders by date:', data.error);
    return [];
  }

  const orders = data.orders || [];

  console.log('fetchEpisodesByDate: Found', orders.length, 'orders');

  // Step 2: Extract NFT addresses from orders
  const nftAddresses = orders
    .map((order: any) => order.nftAddress)
    .filter((addr: string | undefined) => addr !== undefined && addr !== null);

  console.log('fetchEpisodesByDate: Extracted', nftAddresses.length, 'NFT addresses:', nftAddresses);

  if (nftAddresses.length === 0) {
    console.log('fetchEpisodesByDate: No NFT addresses found, returning empty array');
    return [];
  }

  // Step 3: Fetch full episode data from Helius using the NFT addresses
  console.log('fetchEpisodesByDate: Fetching full episode data from Helius');
  const { assets } = await fetchEpisodesByIds({
    assetIds: nftAddresses,
    cacheKey,
    includeEpisodeData,
  });

  console.log('fetchEpisodesByDate: Returning', assets.length, 'episodes');

  return assets;
}

export async function fetchEpisodesByDateRange({
  startTimestamp,
  endTimestamp,
  collectionId,
  includeEpisodeData = true,
}: FetchEpisodesByDateRangeOptions): Promise<MplEpisodeAsset[]> {
  const cacheKey = `dateRange:${startTimestamp}-${endTimestamp}:${collectionId}`;

  console.log('fetchEpisodesByDateRange: Called with range:', new Date(startTimestamp).toISOString(), 'to', new Date(endTimestamp).toISOString());

  // Check query cache
  const cachedIds = queryCache.get(cacheKey);
  if (cachedIds) {
    console.log('fetchEpisodesByDateRange: Using cached data, found', cachedIds.length, 'episodes');
    return getAssetsFromCache(cachedIds);
  }

  // Fetch orders from database by date range
  const startDate = new Date(startTimestamp).toISOString();
  const endDate = new Date(endTimestamp).toISOString();

  console.log('fetchEpisodesByDateRange: Fetching orders from API:', `${API_URL}/rgn/orders/by-range?start=${startDate}&end=${endDate}`);

  const response = await fetch(`${API_URL}/rgn/orders/by-range?start=${startDate}&end=${endDate}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  console.log('fetchEpisodesByDateRange: API response:', data);

  if (!data.success) {
    console.error('Failed to fetch orders by date range:', data.error);
    return [];
  }

  const orders = data.orders || [];

  console.log('fetchEpisodesByDateRange: Found', orders.length, 'orders');

  // Extract NFT addresses from orders
  const nftAddresses = orders
    .map((order: any) => order.nftAddress)
    .filter((addr: string | undefined) => addr !== undefined && addr !== null);

  console.log('fetchEpisodesByDateRange: Extracted', nftAddresses.length, 'NFT addresses');

  if (nftAddresses.length === 0) {
    console.log('fetchEpisodesByDateRange: No NFT addresses found, returning empty array');
    return [];
  }

  // Fetch full episode data from Helius using the NFT addresses
  console.log('fetchEpisodesByDateRange: Fetching full episode data from Helius');
  const { assets } = await fetchEpisodesByIds({
    assetIds: nftAddresses,
    cacheKey,
    includeEpisodeData,
  });

  console.log('fetchEpisodesByDateRange: Returning', assets.length, 'episodes');

  return assets;
}
