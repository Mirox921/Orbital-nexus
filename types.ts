
export enum ResourceType {
  OXYGEN = 'Oxygen',
  WATER = 'Water',
  ENERGY = 'Energy',
  FOOD = 'Food',
  MATERIALS = 'Materials',
  SCIENCE = 'Science',
}

export enum ModuleType {
  CORE = 'Core Command',
  SOLAR = 'Solar Array',
  BATTERY = 'Battery Bank',
  HYDROPONICS = 'Hydroponics',
  WATER_RECYCLER = 'Water Recycler',
  OXYGEN_GENERATOR = 'O2 Generator',
  QUARTERS = 'Living Quarters',
  LAB = 'Science Lab',
  ORE_PROCESSOR = 'Ore Processor',
  FUSION_REACTOR = 'Fusion Reactor',
  // New Advanced Modules
  ADVANCED_O2 = 'Adv. O2 Scrubber',
  DRONE_HANGAR = 'Drone Hangar',
  SHIELD_GENERATOR = 'Shield Generator',
  TRAINING_SIM = 'Training Sim',
  TRADING_POST = 'Trading Post',
}

export enum CrewRole {
  COMMANDER = 'Commander',
  ENGINEER = 'Engineer',
  SCIENTIST = 'Scientist',
  MEDIC = 'Medic',
}

export interface CrewMember {
  id: string;
  name: string;
  role: CrewRole;
  health: number; // 0-100
  morale: number; // 0-100
  activity: string;
  efficiency: number; // 1.0 base, can increase with training
}

export interface StationModule {
  id: string;
  type: ModuleType;
  integrity: number; // 0-100
  isActive: boolean;
  constructionProgress: number; // 0-100 (if < 100, it's building)
  x: number; // Grid position for visual layout
  y: number;
}

export interface Resources {
  oxygen: number;
  maxOxygen: number;
  water: number;
  maxWater: number;
  energy: number;
  maxEnergy: number;
  food: number;
  maxFood: number;
  materials: number;
  maxMaterials: number;
  science: number;
  maxScience: number;
}

export interface ResourceRate {
    production: number;
    consumption: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'critical';
  resolved: boolean;
  timestamp: number;
  type: 'system_failure' | 'meteor' | 'alien' | 'illness' | 'generic' | 'trade';
}

export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  prerequisiteId: string | null;
  unlocksModule?: ModuleType;
  effect?: {
    type: 'buff_production';
    resource: ResourceType;
    multiplier: number;
  };
}

export interface TradeOffer {
  id: string;
  costResource: ResourceType;
  costAmount: number;
  gainResource: ResourceType;
  gainAmount: number;
  description: string;
}

export interface GameState {
  tick: number;
  resources: Resources;
  modules: StationModule[];
  crew: CrewMember[];
  events: GameEvent[];
  isPaused: boolean;
  gameOver: boolean;
  gameSpeed: number;
  dayCycle: number; // 0-100, representing position in orbit (Day/Night)
  unlockedResearch: string[];
  lastSalvageTick: number; // For cooldowns
  lastAnalyzeTick: number; // For cooldowns
  
  // New Mechanics
  shieldCharge: number;
  maxShieldCharge: number;
  lastShieldHit: number; // Timestamp of last shield impact
  tradeOffers: TradeOffer[];
  
  // Rates for UI
  resourceRates: Record<ResourceType, ResourceRate>;
}

export type LogType = 'info' | 'alert' | 'critical' | 'success';

export interface EventLog {
    timestamp: number;
    message: string;
    type: LogType;
    category: 'system' | 'crew' | 'event';
}
