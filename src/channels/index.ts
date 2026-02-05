import { ChannelConfig } from './channel';
import DioDudes from './DioDudes';

// Register all available channels here
export const CHANNELS: ChannelConfig[] = [
  {
    id: 'dio-dudes',
    name: 'Dio Dudes',
    component: DioDudes,
  },
  // Add more channels here as they become available
  // {
  //   id: 'another-channel',
  //   name: 'Another Channel',
  //   disabled: true,
  //   component: AnotherChannel,
  // },
];
