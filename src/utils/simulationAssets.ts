const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface Fighter {
  name: string;
  imageUrl: string;
  aura: number;
}

export interface MatchData {
  orderId: string;
  fighters: Fighter[];
  status: string;
  startTime: string;
}

export interface MplSimulationAsset {
  id: string; // NFT address
  orderId: string;
  name: string;
  image: string;
  animationUrl: string | null;
  matchData: MatchData | null;
}

// Single source of truth for assets (by asset ID)
const assetCache = new Map<string, MplSimulationAsset>();

// Query cache stores just IDs (pointers to assetCache)
const queryCache = new Map<string, string[]>();

function getAssetsFromCache(ids: string[]): MplSimulationAsset[] {
  return ids.map(id => assetCache.get(id)).filter((a): a is MplSimulationAsset => a !== null);
}

function cacheAssets(assets: MplSimulationAsset[]): void {
  assets.forEach(asset => assetCache.set(asset.id, asset));
}

function filterAndSortAssets(assets: MplSimulationAsset[]): MplSimulationAsset[] {
  return assets
    .filter(asset => asset.matchData?.startTime)
    .sort((a, b) => {
      const timeA = new Date(a.matchData!.startTime).getTime();
      const timeB = new Date(b.matchData!.startTime).getTime();
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

async function enrichWithMatchData(
  baseAssets: BaseAsset[],
  includeMatchData: boolean
): Promise<MplSimulationAsset[]> {
  if (!includeMatchData) {
    return baseAssets.map(({ jsonUri, ...asset }) => ({
      ...asset,
      matchData: null,
    }));
  }

  return Promise.all(
    baseAssets.map(async ({ jsonUri, ...asset }) => {
      // Check if we already have this asset enriched in cache
      const cached = assetCache.get(asset.id);
      if (cached?.matchData) {
        return cached;
      }

      let matchData: MatchData | null = null;

      if (jsonUri) {
        try {
          const metadataResponse = await fetch(jsonUri);
          const metadata = await metadataResponse.json();
          matchData = metadata.matchData || null;
        } catch (err) {
          console.error(`Failed to fetch metadata for ${asset.orderId}:`, err);
        }
      }

      return {
        ...asset,
        matchData,
      };
    })
  );
}

interface FetchSimulationAssetsOptions {
  ownerAddress: string;
  collectionId: string;
  includeMatchData?: boolean;
  page?: number;
  limit?: number;
}

interface FetchByIdsOptions {
  assetIds: string[];
  cacheKey: string;
  includeMatchData?: boolean;
}

interface FetchByIdsResult {
  assets: MplSimulationAsset[];
  assetMap: Map<string, MplSimulationAsset>;
}

export async function fetchSimulationAssetsByIds({
  assetIds,
  cacheKey,
  includeMatchData = true,
}: FetchByIdsOptions): Promise<FetchByIdsResult> {
  if (assetIds.length === 0) return { assets: [], assetMap: new Map() };

  // Check query cache
  const cachedIds = queryCache.get(cacheKey);
  if (cachedIds) {
    const assets = getAssetsFromCache(cachedIds);
    const assetMap = new Map<string, MplSimulationAsset>();
    cachedIds.forEach(id => {
      const asset = assetCache.get(id);
      if (asset) assetMap.set(id, asset);
    });
    return { assets, assetMap };
  }

  const response = await fetch(`${API_URL}/rgn/fetch-orders`, {
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
  const enrichedAssets = await enrichWithMatchData(baseAssets, includeMatchData);
  const assets = filterAndSortAssets(enrichedAssets);

  // Cache assets and query result
  cacheAssets(assets);
  queryCache.set(cacheKey, assets.map(a => a.id));

  // Build map
  const assetMap = new Map<string, MplSimulationAsset>();
  assets.forEach(asset => {
    assetMap.set(asset.id, asset);
  });

  return { assets, assetMap };
}

export async function fetchSimulationAssetsByCollection(
  collectionId: string,
  includeMatchData = true
): Promise<MplSimulationAsset[]> {
  const cacheKey = `collection:${collectionId}`;

  // Check query cache
  const cachedIds = queryCache.get(cacheKey);
  if (cachedIds) {
    return getAssetsFromCache(cachedIds);
  }

  const response = await fetch(`${API_URL}/rgn/fetch-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
    body: JSON.stringify({
      method: 'by_collection',
      params: { collectionId, page: 1, limit: 100 },
    }),
  });

  const data = await response.json();
  const items = data?.result?.items || [];
  const baseAssets = parseHeliusItems(items);
  const enrichedAssets = await enrichWithMatchData(baseAssets, includeMatchData);
  const assets = filterAndSortAssets(enrichedAssets);

  // Cache assets and query result
  cacheAssets(assets);
  queryCache.set(cacheKey, assets.map(a => a.id));

  return assets;
}

export async function fetchSimulationAssets({
  ownerAddress,
  collectionId,
  includeMatchData = false,
  page = 1,
  limit = 100,
}: FetchSimulationAssetsOptions): Promise<MplSimulationAsset[]> {
  const cacheKey = `owner:${ownerAddress}:${collectionId}`;

  // Check query cache
  const cachedIds = queryCache.get(cacheKey);
  if (cachedIds) {
    return getAssetsFromCache(cachedIds);
  }

  const response = await fetch(`${API_URL}/rgn/fetch-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
    body: JSON.stringify({
      method: 'by_owner',
      params: { ownerAddress, collectionId, page, limit },
    }),
  });

  const data = await response.json();
  const items = data?.result?.items || [];
  const baseAssets = parseHeliusItems(items);
  const enrichedAssets = await enrichWithMatchData(baseAssets, includeMatchData);
  const assets = filterAndSortAssets(enrichedAssets);

  // Cache assets and query result
  cacheAssets(assets);
  queryCache.set(cacheKey, assets.map(a => a.id));

  return assets;
}
