import { ChannelConfig } from './channel';
import DioDudes from './DioDudes';

// Register all available channels here
export const CHANNELS: ChannelConfig[] = [
  {
    name: 'Dio Dudes',
    ids: {
      devnet: '5Lu2U98R63iXJoboeLQePZKZprkt2qbn45XvpYGNSawP',
      mainnet: 'AAomnYW22PbNPu2tuQ5TzeqGCkacUey64Khsv3t6grJa',
    },
    component: DioDudes,
  },
  // Add more channels here as they become available
  // {
  //   name: 'Another Channel',
  //   ids: {
  //     devnet: 'devnet-channel-id',
  //     mainnet: 'mainnet-channel-id',
  //   },
  //   disabled: true,
  //   component: AnotherChannel,
  // },
];

// Helper function to get channel ID for current network environment
export const getIdByNetwork = (channelName: string): string => {
  const network = (import.meta.env.VITE_SOL_NETWORK as 'devnet' | 'mainnet') || 'devnet';
  const channel = CHANNELS.find(c => c.name === channelName);
  return channel?.ids[network] || '';
};
