
import React, { useState } from 'react';
import { ModuleType, StationModule, CrewMember, EventLog, CrewRole, TradeOffer, LogType } from '../types';
import { MODULE_COSTS, RESEARCH_TREE, MANUAL_ACTION_COOLDOWN_TICKS, MANUAL_ACTION_ENERGY_COST, MODULE_DESCRIPTIONS } from '../constants';
import { Hammer, Users, Activity, Play, Pause, FlaskConical, Lock, CheckCircle, ArrowRight, Pickaxe, HardDrive, Zap, ShoppingBag, GraduationCap, Filter } from 'lucide-react';
import { generateCrewChatter } from '../services/geminiService';

interface ControlPanelProps {
  resources: { materials: number; science: number; energy: number; food: number; oxygen: number; water: number };
  onBuild: (type: ModuleType) => void;
  crew: CrewMember[];
  eventLogs: EventLog[];
  isPaused: boolean;
  gameSpeed: number;
  onTogglePause: () => void;
  onSetSpeed: (speed: number) => void;
  selectedModule: StationModule | null;
  onRepair: (id: string) => void;
  onToggleModulePower: (id: string) => void;
  unlockedResearch: string[];
  onResearch: (techId: string) => void;
  onSalvage: () => void;
  onAnalyze: () => void;
  onTrade: (offerId: string) => void;
  onTrainCrew: (crewId: string) => void;
  tradeOffers: TradeOffer[];
  tick: number; 
  lastSalvageTick: number;
  lastAnalyzeTick: number;
  modules: StationModule[]; // Added to check for Training Sim
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  resources,
  onBuild,
  crew,
  eventLogs,
  isPaused,
  gameSpeed,
  onTogglePause,
  onSetSpeed,
  selectedModule,
  onRepair,
  onToggleModulePower,
  unlockedResearch,
  onResearch,
  onSalvage,
  onAnalyze,
  onTrade,
  onTrainCrew,
  tradeOffers,
  tick,
  lastSalvageTick,
  lastAnalyzeTick,
  modules
}) => {
  const [activeTab, setActiveTab] = useState<'build' | 'crew' | 'research' | 'trade' | 'logs'>('build');
  const [chatter, setChatter] = useState<Record<string, string>>({});
  const [logFilter, setLogFilter] = useState<LogType | 'all'>('all');

  const handleCrewClick = async (member: CrewMember) => {
    const text = await generateCrewChatter(member.role, member.morale);
    setChatter(prev => ({...prev, [member.id]: text}));
    setTimeout(() => {
        setChatter(prev => {
            const next = {...prev};
            delete next[member.id];
            return next;
        });
    }, 4000);
  };

  const isModuleUnlocked = (type: ModuleType) => {
    if ([ModuleType.CORE, ModuleType.SOLAR, ModuleType.BATTERY, ModuleType.HYDROPONICS, ModuleType.WATER_RECYCLER, ModuleType.OXYGEN_GENERATOR, ModuleType.QUARTERS, ModuleType.LAB].includes(type)) return true;
    return RESEARCH_TREE.some(tech => 
        unlockedResearch.includes(tech.id) && tech.unlocksModule === type
    );
  };

  const getCooldownPercent = (lastTick: number) => {
      const elapsed = tick - lastTick;
      if (elapsed >= MANUAL_ACTION_COOLDOWN_TICKS) return 0;
      return 100 - ((elapsed / MANUAL_ACTION_COOLDOWN_TICKS) * 100);
  };

  const salvageCooldown = getCooldownPercent(lastSalvageTick);
  const analyzeCooldown = getCooldownPercent(lastAnalyzeTick);

  const hasTrainingSim = modules.some(m => m.type === ModuleType.TRAINING_SIM && m.isActive && m.integrity > 50);

  const filteredLogs = logFilter === 'all' ? eventLogs : eventLogs.filter(l => l.type === logFilter);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 h-80 z-40 flex flex-col md:flex-row shadow-2xl">
      
      {/* Left Sidebar: Controls & Selected Info */}
      <div className="w-full md:w-64 border-r border-slate-800 p-4 flex flex-col gap-4 bg-slate-900/50">
        <div className="flex items-center justify-between bg-slate-800 rounded p-2">
            <button onClick={onTogglePause} className={`p-2 rounded hover:bg-slate-700 ${isPaused ? 'text-yellow-400' : 'text-slate-300'}`}>
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>
            <div className="flex space-x-1">
                <button onClick={() => onSetSpeed(1)} className={`px-2 py-1 text-xs rounded ${gameSpeed === 1 ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}>1x</button>
                <button onClick={() => onSetSpeed(2)} className={`px-2 py-1 text-xs rounded ${gameSpeed === 2 ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}>2x</button>
            </div>
        </div>

        {selectedModule ? (
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">{selectedModule.type}</h3>
            <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                    <span>Integrity:</span>
                    <span className={selectedModule.integrity < 50 ? 'text-red-400' : 'text-green-400'}>{Math.round(selectedModule.integrity)}%</span>
                </div>
                <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={selectedModule.isActive ? 'text-green-400' : 'text-red-400'}>{selectedModule.isActive ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
                
                <div className="flex gap-2 mt-4">
                     <button 
                        onClick={() => onRepair(selectedModule.id)}
                        disabled={resources.materials < 10 || selectedModule.integrity >= 100}
                        className="flex-1 bg-amber-600/20 border border-amber-600/50 hover:bg-amber-600/40 text-amber-500 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        Repair (-10 Mat)
                     </button>
                     <button 
                         onClick={() => onToggleModulePower(selectedModule.id)}
                         className={`flex-1 border py-1 rounded transition-colors ${selectedModule.isActive ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30'}`}
                     >
                        {selectedModule.isActive ? 'Disable' : 'Enable'}
                     </button>
                </div>
            </div>
          </div>
        ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-xs italic">
                Select a module for details
            </div>
        )}
      </div>

      {/* Center: Tabs Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs Header */}
        <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('build')} className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'build' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <Hammer size={16} /> <span>Construction</span>
          </button>
          <button onClick={() => setActiveTab('crew')} className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'crew' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <Users size={16} /> <span>Crew Roster</span>
          </button>
          <button onClick={() => setActiveTab('research')} className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'research' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <FlaskConical size={16} /> <span>Research</span>
          </button>
          <button onClick={() => setActiveTab('trade')} className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'trade' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <ShoppingBag size={16} /> <span>Trading</span>
          </button>
          <button onClick={() => setActiveTab('logs')} className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'logs' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
            <Activity size={16} /> <span>Logs</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-slate-900/30">
            {activeTab === 'build' && (
                <div className="flex space-x-4 h-full items-center">
                    <button
                        onClick={onSalvage}
                        disabled={salvageCooldown > 0 || resources.energy < MANUAL_ACTION_ENERGY_COST}
                        className="relative flex flex-col justify-center items-center p-3 w-40 h-full rounded-lg border border-dashed border-slate-600 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-400 transition-all group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         <div className="bg-slate-800 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform relative z-10">
                             <Pickaxe size={24} className="text-slate-400" />
                         </div>
                         <span className="font-bold text-slate-300 text-sm relative z-10">Drone Salvage</span>
                         <span className="text-[10px] text-slate-500 mt-1 relative z-10 flex items-center gap-1">
                            <span>+15 Mat</span>
                            <span className="text-yellow-500 ml-1">-{MANUAL_ACTION_ENERGY_COST} En</span>
                         </span>
                         <div className="absolute bottom-0 left-0 right-0 bg-slate-700/50 transition-all duration-100 ease-linear" style={{ height: `${salvageCooldown}%` }} />
                    </button>

                    {Object.values(ModuleType).filter(t => t !== ModuleType.CORE && isModuleUnlocked(t)).map((type) => {
                        const cost = MODULE_COSTS[type];
                        const canAfford = resources.materials >= cost.materials;
                        const description = MODULE_DESCRIPTIONS[type];

                        return (
                            <button
                                key={type}
                                onClick={() => onBuild(type)}
                                disabled={!canAfford}
                                className={`
                                    group flex flex-col justify-between p-3 w-44 h-full rounded-lg border text-left transition-all flex-shrink-0 relative overflow-hidden
                                    ${canAfford ? 'bg-slate-800 border-slate-700 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10' : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'}
                                `}
                            >
                                <div>
                                    <span className="font-bold text-slate-200 text-sm block mb-1 truncate">{type}</span>
                                    <p className="text-[10px] text-slate-400 leading-tight mb-2 h-8 overflow-hidden">{description}</p>
                                </div>
                                <div className="text-xs text-slate-500 space-y-1 mt-auto">
                                    <div className="flex justify-between"><span>Mat:</span> <span className="text-slate-300">{cost.materials}</span></div>
                                    <div className="flex justify-between"><span>Pwr:</span> <span className="text-yellow-500">-{cost.energyCost}</span></div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {activeTab === 'crew' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto pr-2">
                    {crew.map(member => (
                        <div key={member.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex items-center space-x-3 cursor-pointer hover:bg-slate-750 group" onClick={() => handleCrewClick(member)}>
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 ${
                                 member.role === CrewRole.COMMANDER ? 'bg-yellow-500' :
                                 member.role === CrewRole.ENGINEER ? 'bg-orange-500' :
                                 member.role === CrewRole.SCIENTIST ? 'bg-cyan-500' : 'bg-green-500'
                             }`}>
                                 {member.name.charAt(0)}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-center">
                                     <h4 className="text-slate-200 font-medium text-sm truncate">{member.name}</h4>
                                     <span className="text-[10px] uppercase text-slate-500">{member.role}</span>
                                 </div>
                                 <div className="flex items-center space-x-2 mt-1">
                                    <div className="flex-1 bg-slate-900 h-1 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full" style={{width: `${member.health}%`}} />
                                    </div>
                                    <span className="text-[10px] text-slate-400">Eff: {member.efficiency.toFixed(1)}x</span>
                                 </div>
                                 
                                 <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onTrainCrew(member.id); }}
                                        disabled={!hasTrainingSim}
                                        className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 ${hasTrainingSim ? 'bg-slate-700 hover:bg-emerald-600 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                                        title={hasTrainingSim ? "Train (-50 Energy, +0.1 Efficiency)" : "Training Sim Module Required"}
                                    >
                                        <GraduationCap size={12} /> {hasTrainingSim ? "Train" : "No Sim"}
                                    </button>
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'research' && (
                <div className="flex space-x-6 h-full items-center overflow-x-auto px-2">
                     <button
                        onClick={onAnalyze}
                        disabled={analyzeCooldown > 0 || resources.energy < MANUAL_ACTION_ENERGY_COST}
                        className="relative flex flex-col justify-center items-center p-3 w-40 h-full rounded-lg border border-dashed border-fuchsia-900/50 bg-slate-900/50 hover:bg-slate-800 hover:border-fuchsia-500/50 transition-all flex-shrink-0 group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         <div className="bg-slate-800 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform relative z-10">
                             <HardDrive size={24} className="text-fuchsia-400" />
                         </div>
                         <span className="font-bold text-slate-300 text-sm relative z-10">Sensor Sweep</span>
                         <span className="text-[10px] text-fuchsia-400 mt-1 relative z-10 flex items-center gap-1">
                            <span>+8 Sci</span>
                            <span className="text-yellow-500 ml-1">-{MANUAL_ACTION_ENERGY_COST} En</span>
                         </span>
                         <div className="absolute bottom-0 left-0 right-0 bg-fuchsia-900/40 transition-all duration-100 ease-linear" style={{ height: `${analyzeCooldown}%` }} />
                    </button>

                    {RESEARCH_TREE.map((tech) => {
                        const isUnlocked = unlockedResearch.includes(tech.id);
                        const isPrereqMet = !tech.prerequisiteId || unlockedResearch.includes(tech.prerequisiteId);
                        const canAfford = resources.science >= tech.cost;
                        const isAvailable = !isUnlocked && isPrereqMet;

                        return (
                            <div key={tech.id} className="relative flex-shrink-0 group">
                                <button
                                    onClick={() => onResearch(tech.id)}
                                    disabled={!isAvailable || !canAfford}
                                    className={`
                                        w-64 h-full p-4 rounded-xl border flex flex-col relative overflow-hidden transition-all
                                        ${isUnlocked 
                                            ? 'bg-fuchsia-900/20 border-fuchsia-500/50' 
                                            : isAvailable 
                                                ? canAfford 
                                                    ? 'bg-slate-800 border-slate-600 hover:border-fuchsia-400 hover:shadow-[0_0_20px_rgba(192,38,211,0.2)]' 
                                                    : 'bg-slate-800 border-slate-700 opacity-80'
                                                : 'bg-slate-900/50 border-slate-800 opacity-40 grayscale'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`font-bold ${isUnlocked ? 'text-fuchsia-400' : 'text-slate-200'}`}>{tech.name}</h4>
                                        {isUnlocked ? <CheckCircle size={16} className="text-fuchsia-400" /> : <Lock size={16} className="text-slate-500" />}
                                    </div>
                                    <p className="text-xs text-slate-400 mb-4 flex-1">{tech.description}</p>
                                    {!isUnlocked && (
                                        <div className="mt-auto">
                                            <div className="flex items-center space-x-2 text-xs font-mono mb-2">
                                                <FlaskConical size={12} className={canAfford ? 'text-fuchsia-400' : 'text-red-400'} />
                                                <span className={canAfford ? 'text-white' : 'text-red-400'}>{tech.cost} Science</span>
                                            </div>
                                            {isAvailable ? (
                                                 <div className={`w-full py-1 text-center text-xs font-bold rounded ${canAfford ? 'bg-fuchsia-600 text-white animate-pulse' : 'bg-slate-700 text-slate-500'}`}>
                                                     {canAfford ? 'RESEARCH' : 'INSUFFICIENT DATA'}
                                                 </div>
                                            ) : (
                                                <div className="text-[10px] text-slate-600 uppercase tracking-widest text-center">Locked</div>
                                            )}
                                        </div>
                                    )}
                                    {isUnlocked && <div className="mt-auto text-xs text-fuchsia-400 font-mono text-center border-t border-fuchsia-900/50 pt-2">RESEARCH COMPLETE</div>}
                                </button>
                                {tech.prerequisiteId && (
                                     <div className="absolute top-1/2 -left-6 transform -translate-y-1/2 text-slate-700">
                                         <ArrowRight size={24} />
                                     </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {activeTab === 'trade' && (
                <div className="flex flex-col h-full w-full">
                    {tradeOffers.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                            <ShoppingBag size={48} className="mb-4 opacity-50" />
                            <p>No trade vessels in range.</p>
                            <p className="text-xs">Build a Trading Post to attract merchants.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
                            {tradeOffers.map(offer => {
                                // @ts-ignore
                                const canAfford = resources[offer.costResource.toLowerCase()] >= offer.costAmount;
                                return (
                                    <div key={offer.id} className="bg-slate-800 border border-slate-700 p-4 rounded-lg flex flex-col justify-between">
                                        <div className="mb-2">
                                            <div className="text-xs text-slate-400 mb-1">{offer.description}</div>
                                            <div className="font-bold text-slate-200">OFFER:</div>
                                        </div>
                                        <div className="flex items-center justify-between bg-slate-900 p-2 rounded mb-3">
                                            <div className="text-red-400 flex flex-col items-center">
                                                <span className="text-lg font-bold">-{offer.costAmount}</span>
                                                <span className="text-[10px] uppercase">{offer.costResource}</span>
                                            </div>
                                            <ArrowRight size={16} className="text-slate-600" />
                                            <div className="text-green-400 flex flex-col items-center">
                                                <span className="text-lg font-bold">+{offer.gainAmount}</span>
                                                <span className="text-[10px] uppercase">{offer.gainResource}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onTrade(offer.id)}
                                            disabled={!canAfford}
                                            className={`w-full py-2 rounded font-bold text-xs ${canAfford ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                        >
                                            {canAfford ? 'ACCEPT DEAL' : 'INSUFFICIENT FUNDS'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex space-x-2 mb-2 border-b border-slate-800 pb-2">
                        {(['all', 'info', 'alert', 'critical', 'success'] as const).map(f => (
                            <button 
                                key={f} 
                                onClick={() => setLogFilter(f)}
                                className={`text-[10px] px-2 py-1 rounded uppercase ${logFilter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 pr-2">
                        {filteredLogs.slice().reverse().map((log, i) => (
                            <div key={i} className={`flex space-x-2 border-l-2 pl-2 py-1 ${
                                log.type === 'alert' ? 'border-yellow-500/50 text-yellow-200 bg-yellow-900/10' : 
                                log.type === 'critical' ? 'border-red-500 text-red-200 bg-red-900/20' : 
                                log.type === 'success' ? 'border-green-500/50 text-green-200 bg-green-900/10' : 
                                'border-slate-700 text-slate-400'
                            }`}>
                                <span className="opacity-50 w-16 text-right">[{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                                <span className="flex-1">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
