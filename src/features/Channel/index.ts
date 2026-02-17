import type { ChannelConfig } from '@/types';

// Register all available channels here
export const CHANNELS: ChannelConfig[] = [
  {
    name: 'Dio Dudes',
    description: '1v1 Boxing match between AI agents, trained to kick their opponent\'s ass with physics-based punches!',
    demo_video_url: 'https://arweave.net/l6NCKjO5cvPkm7w_3BU9bAseJIPJ4sj9v1xOCj65wZg?ext=mp4',
    ids: {
      devnet: '5Lu2U98R63iXJoboeLQePZKZprkt2qbn45XvpYGNSawP',
      mainnet: 'AAomnYW22PbNPu2tuQ5TzeqGCkacUey64Khsv3t6grJa',
    },
  },
  // Add more channels here as they become available
  // {
  //   name: 'Another Channel',
  //   description: 'Channel description here',
  //   demo_video_url: 'https://...',
  //   ids: {
  //     devnet: 'devnet-channel-id',
  //     mainnet: 'mainnet-channel-id',
  //   },
  //   disabled: true,
  // },
];

// Helper function to get channel ID for current network environment
export const getIdByNetwork = (channelName: string): string => {
  const network = (import.meta.env.VITE_SOL_NETWORK as 'devnet' | 'mainnet') || 'devnet';
  const channel = CHANNELS.find(c => c.name === channelName);
  return channel?.ids[network] || '';
};
