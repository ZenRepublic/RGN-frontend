/**
 * Network configuration based on VITE_SOL_NETWORK environment variable.
 * Set VITE_SOL_NETWORK to 'mainnet' or 'devnet' in .env
 */

type SolanaNetwork = 'devnet' | 'mainnet-beta';

const networkEnv = import.meta.env.VITE_SOL_NETWORK || 'devnet';

// Map env value to Solana cluster name
export const SOLANA_NETWORK: SolanaNetwork =
  networkEnv === 'mainnet' ? 'mainnet-beta' : 'devnet';

// Chain identifier for Mobile Wallet Adapter
export const SOLANA_CHAIN = `solana:${networkEnv}` as `solana:${string}`;

// RPC URL via backend proxy (keeps API key private)
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const HELIUS_RPC_URL = networkEnv === 'mainnet'
  ? `${API_URL}/mainnet-rpc`
  : `${API_URL}/devnet-rpc`;

// Helper to check if we're on mainnet
export const IS_MAINNET = networkEnv === 'mainnet';
