import { ComponentType } from 'react';

// Data structure each episode must provide for checkout
export interface EpisodeOrderFormData {
  // Actors for the order API
  actors: Array<{
    name: string;
    imageBuffer: string;
  }>;
  // Preview data for checkout modal (can include more visual info)
  preview: Array<{
    name: string;
    imagePreview: string;
  }>;
  // What the episode includes (shown in checkout)
  includes: string[];
  // Scheduled start time (UTC ISO string)
  startTime?: string;
}

// Props passed to each Channel component
export interface ChannelProps {
  onError: (message: string) => void;
}

// Configuration for registering a Channel
export interface ChannelConfig {
  id: string;
  name: string;
  disabled?: boolean;
  component: ComponentType<ChannelProps>;
}
