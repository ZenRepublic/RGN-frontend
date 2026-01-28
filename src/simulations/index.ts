import { SimulationConfig } from '../types/simulation';
import DioDudes from './DioDudes';

// Register all available simulations here
export const SIMULATIONS: SimulationConfig[] = [
  {
    id: 'dio-dudes',
    name: 'Dio Dudes',
    component: DioDudes,
  },
  // Add more simulations here as they become available
  // {
  //   id: 'another-sim',
  //   name: 'Another Simulation',
  //   disabled: true,
  //   component: AnotherSimulation,
  // },
];

// Re-export cache clearing functions
export { clearDioDudesCache } from './DioDudesOrderForm';
