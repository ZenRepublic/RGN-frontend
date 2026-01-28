import { HELIUS_RPC_URL } from '@/config/network';

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

export async function fetchSimulationAssetsByIds(
  assetIds: string[],
  includeMatchData = true
): Promise<MplSimulationAsset[]> {
  if (assetIds.length === 0) return [];

  const response = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'fetch-assets-by-ids',
      method: 'getAssetBatch',
      params: {
        ids: assetIds,
      },
    }),
  });

  const data = await response.json();
  const items = data?.result || [];
  const baseAssets = parseHeliusItems(items);

  return enrichWithMatchData(baseAssets, includeMatchData);
}

export async function fetchSimulationAssets({
  ownerAddress,
  collectionId,
  includeMatchData = false,
  page = 1,
  limit = 100,
}: FetchSimulationAssetsOptions): Promise<MplSimulationAsset[]> {
  const response = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'fetch-simulation-assets',
      method: 'searchAssets',
      params: {
        ownerAddress,
        grouping: ['collection', collectionId],
        burnt: false,
        page,
        limit,
      },
    }),
  });

  const data = await response.json();
  const items = data?.result?.items || [];
  console.log(items);
  const baseAssets = parseHeliusItems(items);

  return enrichWithMatchData(baseAssets, includeMatchData);
}
