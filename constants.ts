
import { ModuleType, ResearchNode, ResourceType } from './types';

export const TICK_RATE_MS = 1000;
export const DAY_LENGTH_TICKS = 60; // 60 ticks per day/night cycle

// Balancing Constants
export const MANUAL_ACTION_COOLDOWN_TICKS = 10; 
export const MANUAL_ACTION_ENERGY_COST = 10;
export const MAINTENANCE_DECAY_CHANCE = 0.05; 
export const ADVANCED_DECAY_CHANCE = 0.08; // Higher chance for advanced modules
export const EVENT_CHANCE_PER_TICK = 0.008; 

export const SHIELD_MAX_CHARGE = 100;
export const SHIELD_ENERGY_COST_PER_TICK = 8; // Increased drain for strategic balance
export const SHIELD_RECHARGE_RATE = 3; // Adjusted recharge rate (1-5 range)

export const INITIAL_RESOURCES = {
  oxygen: 1000,
  water: 1000,
  energy: 1000,
  food: 500,
  materials: 100, 
  science: 0,
};

export const MAX_RESOURCES_BASE = 2000;

export const MODULE_COSTS: Record<ModuleType, { materials: number; energyCost: number }> = {
  [ModuleType.CORE]: { materials: 0, energyCost: 5 },
  [ModuleType.SOLAR]: { materials: 60, energyCost: 0 },
  [ModuleType.BATTERY]: { materials: 50, energyCost: 1 },
  [ModuleType.HYDROPONICS]: { materials: 80, energyCost: 15 },
  [ModuleType.WATER_RECYCLER]: { materials: 90, energyCost: 20 },
  [ModuleType.OXYGEN_GENERATOR]: { materials: 100, energyCost: 20 }, // Reduced from 25
  [ModuleType.QUARTERS]: { materials: 120, energyCost: 10 },
  [ModuleType.LAB]: { materials: 200, energyCost: 35 },
  [ModuleType.ORE_PROCESSOR]: { materials: 250, energyCost: 50 },
  [ModuleType.FUSION_REACTOR]: { materials: 500, energyCost: 0 },
  
  // New Modules
  [ModuleType.ADVANCED_O2]: { materials: 200, energyCost: 40 }, // High efficiency, high cost
  [ModuleType.DRONE_HANGAR]: { materials: 300, energyCost: 60 }, // Automates gathering
  [ModuleType.SHIELD_GENERATOR]: { materials: 400, energyCost: 80 }, // Very high energy
  [ModuleType.TRAINING_SIM]: { materials: 150, energyCost: 30 },
  [ModuleType.TRADING_POST]: { materials: 250, energyCost: 20 },
};

export const MODULE_DESCRIPTIONS: Record<ModuleType, string> = {
  [ModuleType.CORE]: "Central station hub. Provides basic life support.",
  [ModuleType.SOLAR]: "Generates 40 Energy per tick during daylight.",
  [ModuleType.BATTERY]: "Stores excess energy for use during eclipse.",
  [ModuleType.HYDROPONICS]: "Grows 0.4 Food per tick.",
  [ModuleType.WATER_RECYCLER]: "Purifies 1.5 Water per tick.",
  [ModuleType.OXYGEN_GENERATOR]: "Generates 2.5 Oxygen per tick.",
  [ModuleType.QUARTERS]: "Houses crew members. Essential for morale.",
  [ModuleType.LAB]: "Generates 0.1 Science points per tick.",
  [ModuleType.ORE_PROCESSOR]: "Automates mining. +0.2 Materials/tick.",
  [ModuleType.FUSION_REACTOR]: "Massive power output. +200 Energy/tick.",
  [ModuleType.ADVANCED_O2]: "High-tech scrubber. +5.0 Oxygen/tick.",
  [ModuleType.DRONE_HANGAR]: "Deploys salvage drones. +0.8 Materials/tick.",
  [ModuleType.SHIELD_GENERATOR]: "Generates a force field. Consumes power to charge.",
  [ModuleType.TRAINING_SIM]: "Trains crew. Consumes 5 Energy/tick + 50 per session.",
  [ModuleType.TRADING_POST]: "Attracts passing trade vessels.",
};

// Production per tick per active module
export const MODULE_PRODUCTION: Record<ModuleType, Partial<Record<ResourceType, number>>> = {
  [ModuleType.CORE]: {},
  [ModuleType.SOLAR]: { [ResourceType.ENERGY]: 40 }, // Buffed from 12 to 40
  [ModuleType.BATTERY]: {}, 
  [ModuleType.HYDROPONICS]: { [ResourceType.FOOD]: 0.4 },
  [ModuleType.WATER_RECYCLER]: { [ResourceType.WATER]: 1.5 },
  [ModuleType.OXYGEN_GENERATOR]: { [ResourceType.OXYGEN]: 2.5 },
  [ModuleType.QUARTERS]: {},
  [ModuleType.LAB]: { [ResourceType.SCIENCE]: 0.1 }, 
  [ModuleType.ORE_PROCESSOR]: { [ResourceType.MATERIALS]: 0.2 }, 
  [ModuleType.FUSION_REACTOR]: { [ResourceType.ENERGY]: 200 },

  // New Modules
  [ModuleType.ADVANCED_O2]: { [ResourceType.OXYGEN]: 5.0 }, // Double standard
  [ModuleType.DRONE_HANGAR]: { [ResourceType.MATERIALS]: 0.8 }, // Significant passive gain
  [ModuleType.SHIELD_GENERATOR]: {}, // Handled in engine logic
  [ModuleType.TRAINING_SIM]: {}, // Handled manually
  [ModuleType.TRADING_POST]: {}, // Enables feature
};

export const CREW_CONSUMPTION = {
  oxygen: 0.5,
  water: 0.5,
  food: 0.1, 
};

export const RESOURCE_COLORS = {
  oxygen: 'text-cyan-400',
  water: 'text-blue-500',
  energy: 'text-yellow-400',
  food: 'text-green-500',
  materials: 'text-orange-300', // Adjusted per request to differentiate
  science: 'text-fuchsia-400',
  shield: 'text-indigo-400',
};

export const RESEARCH_TREE: ResearchNode[] = [
  {
    id: 'res_botany',
    name: 'Adv. Hydroponics',
    description: 'Improves plant growth. Food production +50%.',
    cost: 50,
    prerequisiteId: null,
    effect: {
      type: 'buff_production',
      resource: ResourceType.FOOD,
      multiplier: 1.5,
    }
  },
  {
    id: 'res_recycling',
    name: 'Water Purification',
    description: 'Advanced filters. Water production +50%.',
    cost: 75,
    prerequisiteId: null,
    effect: {
      type: 'buff_production',
      resource: ResourceType.WATER,
      multiplier: 1.5,
    }
  },
  {
    id: 'res_solar',
    name: 'Photovoltaic Cells',
    description: 'Higher efficiency panels. Solar Energy +50%.',
    cost: 100,
    prerequisiteId: null,
    effect: {
      type: 'buff_production',
      resource: ResourceType.ENERGY,
      multiplier: 1.5,
    }
  },
  {
    id: 'res_mining',
    name: 'Asteroid Mining',
    description: 'Unlocks Ore Processors for automated material generation.',
    cost: 200, 
    prerequisiteId: 'res_solar',
    unlocksModule: ModuleType.ORE_PROCESSOR,
  },
  {
    id: 'res_drones',
    name: 'Drone Automation',
    description: 'Unlocks Drone Hangars for rapid material collection.',
    cost: 300,
    prerequisiteId: 'res_mining',
    unlocksModule: ModuleType.DRONE_HANGAR,
  },
  {
    id: 'res_training',
    name: 'Crew Training',
    description: 'Unlocks Training Simulators to improve crew efficiency.',
    cost: 150,
    prerequisiteId: 'res_botany',
    unlocksModule: ModuleType.TRAINING_SIM,
  },
  {
    id: 'res_adv_support',
    name: 'Adv. Life Support',
    description: 'Unlocks high-efficiency Advanced O2 Scrubbers.',
    cost: 250,
    prerequisiteId: 'res_recycling',
    unlocksModule: ModuleType.ADVANCED_O2,
  },
  {
    id: 'res_shields',
    name: 'Defensive Grids',
    description: 'Unlocks Shield Generators to protect from meteors.',
    cost: 400,
    prerequisiteId: 'res_solar',
    unlocksModule: ModuleType.SHIELD_GENERATOR,
  },
  {
    id: 'res_trade',
    name: 'Interstellar Commerce',
    description: 'Unlocks Trading Posts to barter with passing ships.',
    cost: 150,
    prerequisiteId: 'res_solar',
    unlocksModule: ModuleType.TRADING_POST,
  },
  {
    id: 'res_fusion',
    name: 'Cold Fusion',
    description: 'Unlocks Fusion Reactor technology.',
    cost: 800, 
    prerequisiteId: 'res_shields',
    unlocksModule: ModuleType.FUSION_REACTOR,
  }
];
