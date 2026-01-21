import { ComponentType } from 'react';

// Data structure each simulation must provide for checkout
export interface SimulationFormData {
  // Fighters for the order API
  fighters: Array<{
    name: string;
    imageUrl: string;
  }>;
  // Preview data for checkout modal (can include more visual info)
  preview: Array<{
    name: string;
    imagePreview: string;
  }>;
  // What the simulation includes (shown in checkout)
  includes: string[];
}

// Props passed to each simulation component
export interface SimulationProps {
  onFormDataChange: (data: SimulationFormData | null) => void;
  onError: (message: string) => void;
  onCheckout: () => void;
  disabled?: boolean;
}

// Configuration for registering a simulation
export interface SimulationConfig {
  id: string;
  name: string;
  disabled?: boolean;
  component: ComponentType<SimulationProps>;
}
