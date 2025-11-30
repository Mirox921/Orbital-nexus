
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, ResourceType, ModuleType, StationModule, CrewMember, CrewRole, EventLog, GameEvent, TradeOffer, LogType } from '../types';
import { 
    TICK_RATE_MS, 
    INITIAL_RESOURCES, 
    MAX_RESOURCES_BASE, 
    MODULE_PRODUCTION, 
    CREW_CONSUMPTION, 
    MODULE_COSTS, 
    RESEARCH_TREE,
    MANUAL_ACTION_COOLDOWN_TICKS,
    MANUAL_ACTION_ENERGY_COST,
    MAINTENANCE_DECAY_CHANCE,
    ADVANCED_DECAY_CHANCE,
    EVENT_CHANCE_PER_TICK,
    SHIELD_MAX_CHARGE,
    SHIELD_ENERGY_COST_PER_TICK,
    SHIELD_RECHARGE_RATE
} from '../constants';
import { generateEventNarrative } from '../services/geminiService';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>({
    tick: 0,
    resources: { ...INITIAL_RESOURCES, maxOxygen: MAX_RESOURCES_BASE, maxWater: MAX_RESOURCES_BASE, maxEnergy: MAX_RESOURCES_BASE, maxFood: MAX_RESOURCES_BASE, maxMaterials: 500, maxScience: 1000 },
    modules: [
        { id: 'core', type: ModuleType.CORE, integrity: 100, isActive: true, constructionProgress: 100, x: 2, y: 2 },
        { id: 'solar1', type: ModuleType.SOLAR, integrity: 100, isActive: true, constructionProgress: 100, x: 2, y: 1 },
        { id: 'oxy1', type: ModuleType.OXYGEN_GENERATOR, integrity: 100, isActive: true, constructionProgress: 100, x: 2, y: 3 },
    ],
    crew: [
        { id: 'c1', name: 'Cmdr. Shepard', role: CrewRole.COMMANDER, health: 100, morale: 100, activity: 'Idle', efficiency: 1.0 },
        { id: 'c2', name: 'Eng. Isaac', role: CrewRole.ENGINEER, health: 100, morale: 100, activity: 'Maintenance', efficiency: 1.0 },
        { id: 'c3', name: 'Sci. Ripley', role: CrewRole.SCIENTIST, health: 100, morale: 100, activity: 'Research', efficiency: 1.0 },
    ],
    events: [],
    isPaused: false,
    gameOver: false,
    gameSpeed: 1,
    dayCycle: 50,
    unlockedResearch: [],
    lastSalvageTick: -100,
    lastAnalyzeTick: -100,
    shieldCharge: 0,
    maxShieldCharge: SHIELD_MAX_CHARGE,
    lastShieldHit: 0,
    tradeOffers: [],
    resourceRates: {
        [ResourceType.OXYGEN]: { production: 0, consumption: 0 },
        [ResourceType.WATER]: { production: 0, consumption: 0 },
        [ResourceType.ENERGY]: { production: 0, consumption: 0 },
        [ResourceType.FOOD]: { production: 0, consumption: 0 },
        [ResourceType.MATERIALS]: { production: 0, consumption: 0 },
        [ResourceType.SCIENCE]: { production: 0, consumption: 0 },
    }
  });

  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);

  const addLog = (message: string, type: LogType = 'info', category: 'system' | 'crew' | 'event' = 'system') => {
    setEventLogs(prev => [...prev, { timestamp: Date.now(), message, type, category }]);
  };

  const calculateResources = useCallback((current: GameState): GameState => {
    const { resources, modules, crew, dayCycle, unlockedResearch, shieldCharge } = current;
    const nextResources = { ...resources };
    let nextShieldCharge = shieldCharge;
    let logs: { msg: string, type: LogType, cat: 'system'|'event'|'crew' }[] = [];

    // Rate Tracking
    const rates: Record<ResourceType, { production: number, consumption: number }> = {
        [ResourceType.OXYGEN]: { production: 0, consumption: 0 },
        [ResourceType.WATER]: { production: 0, consumption: 0 },
        [ResourceType.ENERGY]: { production: 0, consumption: 0 },
        [ResourceType.FOOD]: { production: 0, consumption: 0 },
        [ResourceType.MATERIALS]: { production: 0, consumption: 0 },
        [ResourceType.SCIENCE]: { production: 0, consumption: 0 },
    };

    // 0. Calculate Buffs from Research
    const multipliers: Partial<Record<ResourceType, number>> = {};
    RESEARCH_TREE.forEach(tech => {
        if (unlockedResearch.includes(tech.id) && tech.effect?.type === 'buff_production') {
            multipliers[tech.effect.resource] = (multipliers[tech.effect.resource] || 1) * tech.effect.multiplier;
        }
    });

    // 1. Maintenance Decay (Wear and Tear)
    const nextModules = modules.map(mod => {
        if (mod.isActive && mod.constructionProgress >= 100) {
            // Advanced modules break faster
            const isAdvanced = [ModuleType.ADVANCED_O2, ModuleType.SHIELD_GENERATOR, ModuleType.FUSION_REACTOR, ModuleType.DRONE_HANGAR].includes(mod.type);
            const chance = isAdvanced ? ADVANCED_DECAY_CHANCE : MAINTENANCE_DECAY_CHANCE;
            
            if (Math.random() < chance) {
                return { ...mod, integrity: Math.max(0, mod.integrity - 1) };
            }
        }
        return mod;
    });

    // 2. Calculate Consumption
    const crewCount = crew.length;
    
    // Crew Needs
    rates[ResourceType.OXYGEN].consumption += crewCount * CREW_CONSUMPTION.oxygen;
    rates[ResourceType.WATER].consumption += crewCount * CREW_CONSUMPTION.water;
    rates[ResourceType.FOOD].consumption += crewCount * CREW_CONSUMPTION.food;

    // Module Energy Consumption
    const activeShieldGen = nextModules.find(m => m.type === ModuleType.SHIELD_GENERATOR && m.isActive && m.integrity > 20);
    if (activeShieldGen) {
        rates[ResourceType.ENERGY].consumption += SHIELD_ENERGY_COST_PER_TICK;
    }

    // Training Sim Passive Consumption
    const activeSim = nextModules.find(m => m.type === ModuleType.TRAINING_SIM && m.isActive && m.integrity > 20);
    if (activeSim) {
        rates[ResourceType.ENERGY].consumption += 5; // Standby power
    }

    nextModules.forEach(mod => {
        if (mod.isActive && mod.constructionProgress >= 100) {
            const cost = MODULE_COSTS[mod.type].energyCost;
            if (cost > 0) rates[ResourceType.ENERGY].consumption += cost;
        }
    });

    // 3. Calculate Production
    const isSunlight = dayCycle > 25 && dayCycle < 75;

    nextModules.forEach(mod => {
        if (mod.isActive && mod.constructionProgress >= 100 && mod.integrity > 0) {
            const efficiency = (mod.integrity < 50 ? 0.5 : 1.0);
            const production = MODULE_PRODUCTION[mod.type];

            if (production) {
                // Solar Check
                if (mod.type === ModuleType.SOLAR && !isSunlight) return;

                if (production[ResourceType.OXYGEN]) rates[ResourceType.OXYGEN].production += production[ResourceType.OXYGEN]! * efficiency;
                if (production[ResourceType.WATER]) rates[ResourceType.WATER].production += production[ResourceType.WATER]! * efficiency;
                if (production[ResourceType.ENERGY]) rates[ResourceType.ENERGY].production += production[ResourceType.ENERGY]! * efficiency;
                if (production[ResourceType.FOOD]) rates[ResourceType.FOOD].production += production[ResourceType.FOOD]! * efficiency;
                if (production[ResourceType.MATERIALS]) rates[ResourceType.MATERIALS].production += production[ResourceType.MATERIALS]! * efficiency;
                if (production[ResourceType.SCIENCE]) rates[ResourceType.SCIENCE].production += production[ResourceType.SCIENCE]! * efficiency;
            }
        }
    });

    // Apply Research Multipliers
    if (multipliers[ResourceType.OXYGEN]) rates[ResourceType.OXYGEN].production *= multipliers[ResourceType.OXYGEN]!;
    if (multipliers[ResourceType.WATER]) rates[ResourceType.WATER].production *= multipliers[ResourceType.WATER]!;
    if (multipliers[ResourceType.ENERGY]) rates[ResourceType.ENERGY].production *= multipliers[ResourceType.ENERGY]!;
    if (multipliers[ResourceType.FOOD]) rates[ResourceType.FOOD].production *= multipliers[ResourceType.FOOD]!;

    // 4. Apply changes (Consuming first)
    const requiredEnergy = rates[ResourceType.ENERGY].consumption;

    // Energy Check
    if (nextResources.energy < requiredEnergy) {
        // Not enough energy! Brownout.
        nextResources.energy = 0;
        if (Math.random() < 0.2) logs.push({msg: "WARNING: Power Overload. Systems failing.", type: 'alert', cat: 'system'});
        
        // Shields fail without power
        nextShieldCharge = Math.max(0, nextShieldCharge - 5);
    } else {
        nextResources.energy -= requiredEnergy;
        // Charge shields if generator is active and power exists
        if (activeShieldGen) {
            nextShieldCharge = Math.min(SHIELD_MAX_CHARGE, nextShieldCharge + SHIELD_RECHARGE_RATE);
        } else {
             // Slowly decay shields if no generator
             nextShieldCharge = Math.max(0, nextShieldCharge - 1);
        }
    }

    // Apply Production (capped at max)
    nextResources.energy = Math.min(nextResources.maxEnergy, nextResources.energy + rates[ResourceType.ENERGY].production);
    nextResources.oxygen = Math.min(nextResources.maxOxygen, nextResources.oxygen + rates[ResourceType.OXYGEN].production);
    nextResources.water = Math.min(nextResources.maxWater, nextResources.water + rates[ResourceType.WATER].production);
    nextResources.food = Math.min(nextResources.maxFood, nextResources.food + rates[ResourceType.FOOD].production);
    nextResources.materials = Math.min(nextResources.maxMaterials, nextResources.materials + rates[ResourceType.MATERIALS].production);
    nextResources.science = Math.min(nextResources.maxScience, nextResources.science + rates[ResourceType.SCIENCE].production);

    // Apply Consumption of other resources
    nextResources.oxygen = Math.max(0, nextResources.oxygen - rates[ResourceType.OXYGEN].consumption);
    nextResources.water = Math.max(0, nextResources.water - rates[ResourceType.WATER].consumption);
    nextResources.food = Math.max(0, nextResources.food - rates[ResourceType.FOOD].consumption);

    // Critical State Checks
    if (nextResources.oxygen <= 0 && Math.random() < 0.05) logs.push({msg:"CRITICAL: OXYGEN DEPLETED", type: 'critical', cat: 'system'});
    if (nextResources.water <= 0 && Math.random() < 0.05) logs.push({msg:"CRITICAL: WATER DEPLETED", type: 'critical', cat: 'system'});
    if (nextResources.food <= 0 && Math.random() < 0.05) logs.push({msg:"CRITICAL: FOOD DEPLETED", type: 'critical', cat: 'system'});

    logs.forEach(l => addLog(l.msg, l.type, l.cat));

    // Update Trading (Randomly add/remove offers)
    let nextTradeOffers = [...current.tradeOffers];
    const hasTradingPost = nextModules.some(m => m.type === ModuleType.TRADING_POST && m.isActive && m.integrity > 50);
    
    // Clear offers if post destroyed
    if (!hasTradingPost) {
        nextTradeOffers = [];
    } else if (current.tick % 100 === 0 && hasTradingPost) {
        // Refresh offers every ~100 seconds
        if (Math.random() < 0.5) {
            nextTradeOffers = []; // Wipe old
            const numOffers = 1 + Math.floor(Math.random() * 3);
            for(let i=0; i<numOffers; i++) {
                // Generate random trade
                const rIn = Math.random() < 0.5 ? ResourceType.MATERIALS : ResourceType.SCIENCE;
                const rOut = Math.random() < 0.5 ? ResourceType.FOOD : ResourceType.ENERGY;
                nextTradeOffers.push({
                    id: generateId(),
                    costResource: rIn,
                    costAmount: 20 + Math.floor(Math.random() * 50),
                    gainResource: rOut,
                    gainAmount: 50 + Math.floor(Math.random() * 100),
                    description: `Trader ${generateId().slice(0,3).toUpperCase()}`
                });
            }
            if (nextTradeOffers.length > 0) addLog("Incoming transmission: Trade vessel docked.", 'info', 'event');
        }
    }

    return {
        ...current,
        resources: nextResources,
        modules: nextModules,
        shieldCharge: nextShieldCharge,
        tradeOffers: nextTradeOffers,
        resourceRates: rates
    };
  }, []);

  const triggerEvent = async (state: GameState) => {
      if (Math.random() > EVENT_CHANCE_PER_TICK) return;
      
      const eventTypes = ['Meteor Shower', 'System Malfunction', 'Solar Flare', 'Space Debris', 'Alien Scan'];
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const narrative = await generateEventNarrative(type, `Shields: ${Math.floor(state.shieldCharge)}%`);
      
      let severity: 'low' | 'medium' | 'critical' = 'medium';
      if (type === 'Meteor Shower' || type === 'System Malfunction') severity = 'critical';

      const newEvent: GameEvent = {
          id: generateId(),
          title: narrative.title,
          description: narrative.description,
          type: 'generic', 
          severity,
          resolved: false,
          timestamp: Date.now()
      };

      setActiveEvent(newEvent);
      addLog(`EVENT: ${newEvent.title}`, severity === 'critical' ? 'critical' : 'alert', 'event');

      setGameState(prev => {
          let updatedModules = [...prev.modules];
          let updatedResources = { ...prev.resources };
          let updatedShields = prev.shieldCharge;
          let shieldHitTime = prev.lastShieldHit;

          if (type === 'Meteor Shower') {
              if (updatedShields > 20) {
                   updatedShields -= 30; // Shields take the hit
                   shieldHitTime = Date.now(); // Record hit for visual fx
                   addLog("Shields absorbed meteor impact!", 'success', 'system');
              } else {
                  // Heavy damage
                  const count = 1 + Math.floor(Math.random() * 2);
                  for(let i=0; i<count; i++) {
                     const targetIdx = Math.floor(Math.random() * updatedModules.length);
                     updatedModules[targetIdx] = { 
                         ...updatedModules[targetIdx], 
                         integrity: Math.max(0, updatedModules[targetIdx].integrity - 50) 
                     };
                  }
                  addLog("Hull breach detected! Modules damaged.", 'critical', 'system');
              }
          } else if (type === 'System Malfunction') {
              const targetIdx = Math.floor(Math.random() * updatedModules.length);
              updatedModules[targetIdx] = { ...updatedModules[targetIdx], isActive: false };
          } else if (type === 'Solar Flare') {
              updatedResources.energy = Math.floor(updatedResources.energy * 0.2); 
              addLog("Energy surge! Batteries drained.", 'alert', 'system');
          }

          return {
              ...prev,
              modules: updatedModules,
              resources: updatedResources,
              shieldCharge: Math.max(0, updatedShields),
              lastShieldHit: shieldHitTime
          };
      });
  };

  useEffect(() => {
    if (gameState.isPaused || gameState.gameOver) return;

    const timer = setInterval(() => {
        setGameState(current => {
            let next = { ...current };
            next.dayCycle = (next.dayCycle + 1) % 100;
            next.tick += 1;
            next = calculateResources(next);
            
            // Construction
            next.modules = next.modules.map(m => ({
                ...m,
                constructionProgress: Math.min(100, m.constructionProgress + 5) // Slower build for balance
            }));

            // Game Over
            if (next.resources.oxygen <= 0 && next.tick > 100) {
                 if (Math.random() < 0.01) next.gameOver = true;
            }

            return next;
        });

    }, TICK_RATE_MS / gameState.gameSpeed);

    return () => clearInterval(timer);
  }, [gameState.isPaused, gameState.gameSpeed, calculateResources]);

  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  useEffect(() => {
      if (gameState.isPaused || gameState.gameOver) return;
      const timer = setInterval(() => {
          triggerEvent(stateRef.current);
      }, 1000 / gameState.gameSpeed); 
      return () => clearInterval(timer);
  }, [gameState.isPaused, gameState.gameSpeed]);

  const buildModule = (type: ModuleType) => {
    const cost = MODULE_COSTS[type];
    if (gameState.resources.materials >= cost.materials) {
        const occupied = new Set(gameState.modules.map(m => `${m.x},${m.y}`));
        let x = 0, y = 0, placed = false;
        // Simple placement logic
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                if (!occupied.has(`${j},${i}`)) {
                    x = j; y = i; placed = true; break;
                }
            }
            if (placed) break;
        }

        if (placed) {
            setGameState(prev => ({
                ...prev,
                resources: { ...prev.resources, materials: prev.resources.materials - cost.materials },
                modules: [...prev.modules, {
                    id: generateId(),
                    type,
                    integrity: 100,
                    isActive: true,
                    constructionProgress: 0,
                    x, y
                }]
            }));
            addLog(`Construction started: ${type}`, 'info', 'system');
        } else {
            addLog("No space available for new module.", 'alert', 'system');
        }
    }
  };

  const repairModule = (id: string) => {
      setGameState(prev => {
          const mod = prev.modules.find(m => m.id === id);
          if (mod && prev.resources.materials >= 10 && mod.integrity < 100) {
              addLog(`Repaired ${mod.type}`, 'success', 'crew');
              return {
                  ...prev,
                  resources: { ...prev.resources, materials: prev.resources.materials - 10 },
                  modules: prev.modules.map(m => m.id === id ? { ...m, integrity: Math.min(100, m.integrity + 50) } : m)
              };
          }
          return prev;
      });
  };

  const toggleModulePower = (id: string) => {
      setGameState(prev => ({
          ...prev,
          modules: prev.modules.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m)
      }));
  };

  const researchTech = (techId: string) => {
    const tech = RESEARCH_TREE.find(t => t.id === techId);
    if (!tech) return;

    setGameState(prev => {
        if (prev.resources.science >= tech.cost && !prev.unlockedResearch.includes(techId)) {
            addLog(`Research Complete: ${tech.name}`, 'success', 'system');
            return {
                ...prev,
                resources: { ...prev.resources, science: prev.resources.science - tech.cost },
                unlockedResearch: [...prev.unlockedResearch, techId]
            };
        }
        return prev;
    });
  };

  const salvageMaterials = () => {
      setGameState(prev => {
          if (prev.tick - prev.lastSalvageTick < MANUAL_ACTION_COOLDOWN_TICKS) return prev;
          if (prev.resources.energy < MANUAL_ACTION_ENERGY_COST) return prev;

          return {
              ...prev,
              lastSalvageTick: prev.tick,
              resources: { 
                  ...prev.resources, 
                  energy: prev.resources.energy - MANUAL_ACTION_ENERGY_COST,
                  materials: Math.min(prev.resources.maxMaterials, prev.resources.materials + 15) 
              }
          }
      });
  };

  const analyzeData = () => {
    setGameState(prev => {
        if (prev.tick - prev.lastAnalyzeTick < MANUAL_ACTION_COOLDOWN_TICKS) return prev;
        if (prev.resources.energy < MANUAL_ACTION_ENERGY_COST) return prev;

        return {
            ...prev,
            lastAnalyzeTick: prev.tick,
            resources: { 
                ...prev.resources, 
                energy: prev.resources.energy - MANUAL_ACTION_ENERGY_COST,
                science: Math.min(prev.resources.maxScience, prev.resources.science + 8) 
            }
        }
    });
  };

  const executeTrade = (offerId: string) => {
      setGameState(prev => {
          const offer = prev.tradeOffers.find(o => o.id === offerId);
          if (!offer) return prev;
          
          const canAfford = prev.resources[offer.costResource.toLowerCase() as keyof typeof prev.resources] >= offer.costAmount;
          if (!canAfford) {
              addLog("Insufficient resources for trade.", 'alert', 'system');
              return prev;
          }

          addLog("Trade executed successfully.", 'success', 'event');
          const nextResources = { ...prev.resources };
          // Deduct cost
          const costKey = offer.costResource.toLowerCase() as keyof typeof prev.resources;
          // @ts-ignore
          nextResources[costKey] -= offer.costAmount;
          // Add gain
          const gainKey = offer.gainResource.toLowerCase() as keyof typeof prev.resources;
          // @ts-ignore
          nextResources[gainKey] += offer.gainAmount;

          return {
              ...prev,
              resources: nextResources,
              tradeOffers: prev.tradeOffers.filter(o => o.id !== offerId) // Remove offer once taken
          };
      });
  };

  const trainCrew = (crewId: string) => {
      setGameState(prev => {
          const crewIdx = prev.crew.findIndex(c => c.id === crewId);
          if (crewIdx === -1) return prev;
          
          // Verify Training Sim exists and is active
          const hasSim = prev.modules.some(m => m.type === ModuleType.TRAINING_SIM && m.isActive && m.integrity > 50);
          if (!hasSim) {
             addLog("Training Simulation module required.", 'alert', 'crew');
             return prev;
          }

          if (prev.resources.energy < 50) {
              addLog("Insufficient energy for simulation.", 'alert', 'crew');
              return prev;
          }

          const updatedCrew = [...prev.crew];
          updatedCrew[crewIdx] = {
              ...updatedCrew[crewIdx],
              efficiency: updatedCrew[crewIdx].efficiency + 0.1,
              morale: Math.max(0, updatedCrew[crewIdx].morale - 5) // Training is tiring
          };

          addLog(`${updatedCrew[crewIdx].name} completed training. Efficiency improved.`, 'success', 'crew');

          return {
              ...prev,
              resources: { ...prev.resources, energy: prev.resources.energy - 50 },
              crew: updatedCrew
          };
      });
  };

  return {
    gameState,
    setGameState,
    eventLogs,
    activeEvent,
    setActiveEvent,
    actions: {
        buildModule,
        repairModule,
        toggleModulePower,
        researchTech,
        salvageMaterials,
        analyzeData,
        executeTrade,
        trainCrew,
        togglePause: () => setGameState(p => ({ ...p, isPaused: !p.isPaused })),
        setSpeed: (s: number) => setGameState(p => ({ ...p, gameSpeed: s }))
    }
  };
};
