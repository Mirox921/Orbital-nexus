
import React from 'react';
import { StationModule, ModuleType } from '../types';
import { Cpu, Sun, Battery, Sprout, Filter, Wind, Home, FlaskConical, Hammer, Atom, Pickaxe, Shield, Bot, GraduationCap, ShoppingBag } from 'lucide-react';

interface ModuleGridProps {
  modules: StationModule[];
  onModuleClick: (moduleId: string) => void;
  shieldActive: boolean;
  lastShieldHit: number;
}

const getModuleIcon = (type: ModuleType) => {
  switch (type) {
    case ModuleType.CORE: return <Cpu size={24} />;
    case ModuleType.SOLAR: return <Sun size={24} />;
    case ModuleType.BATTERY: return <Battery size={24} />;
    case ModuleType.HYDROPONICS: return <Sprout size={24} />;
    case ModuleType.WATER_RECYCLER: return <Filter size={24} />;
    case ModuleType.OXYGEN_GENERATOR: return <Wind size={24} />;
    case ModuleType.QUARTERS: return <Home size={24} />;
    case ModuleType.LAB: return <FlaskConical size={24} />;
    case ModuleType.ORE_PROCESSOR: return <Pickaxe size={24} />;
    case ModuleType.FUSION_REACTOR: return <Atom size={24} />;
    case ModuleType.ADVANCED_O2: return <Wind size={24} className="text-cyan-200" />;
    case ModuleType.DRONE_HANGAR: return <Bot size={24} />;
    case ModuleType.SHIELD_GENERATOR: return <Shield size={24} />;
    case ModuleType.TRAINING_SIM: return <GraduationCap size={24} />;
    case ModuleType.TRADING_POST: return <ShoppingBag size={24} />;
    default: return <Cpu size={24} />;
  }
};

const getModuleColor = (type: ModuleType) => {
  switch (type) {
    case ModuleType.CORE: return 'border-cyan-500 bg-cyan-900/20 text-cyan-400 shadow-cyan-500/20';
    case ModuleType.SOLAR: return 'border-yellow-500 bg-yellow-900/20 text-yellow-400 shadow-yellow-500/20';
    case ModuleType.BATTERY: return 'border-orange-500 bg-orange-900/20 text-orange-400 shadow-orange-500/20';
    case ModuleType.HYDROPONICS: return 'border-green-500 bg-green-900/20 text-green-400 shadow-green-500/20';
    case ModuleType.WATER_RECYCLER: return 'border-blue-500 bg-blue-900/20 text-blue-400 shadow-blue-500/20';
    case ModuleType.OXYGEN_GENERATOR: return 'border-sky-500 bg-sky-900/20 text-sky-400 shadow-sky-500/20';
    case ModuleType.QUARTERS: return 'border-indigo-500 bg-indigo-900/20 text-indigo-400 shadow-indigo-500/20';
    case ModuleType.LAB: return 'border-purple-500 bg-purple-900/20 text-purple-400 shadow-purple-500/20';
    case ModuleType.ORE_PROCESSOR: return 'border-stone-500 bg-stone-900/20 text-stone-400 shadow-stone-500/20';
    case ModuleType.FUSION_REACTOR: return 'border-fuchsia-500 bg-fuchsia-900/20 text-fuchsia-400 shadow-fuchsia-500/20';
    case ModuleType.ADVANCED_O2: return 'border-cyan-300 bg-cyan-800/30 text-cyan-200 shadow-cyan-400/30';
    case ModuleType.DRONE_HANGAR: return 'border-amber-500 bg-amber-900/20 text-amber-400 shadow-amber-500/20';
    case ModuleType.SHIELD_GENERATOR: return 'border-violet-500 bg-violet-900/20 text-violet-400 shadow-violet-500/20';
    case ModuleType.TRAINING_SIM: return 'border-emerald-500 bg-emerald-900/20 text-emerald-400 shadow-emerald-500/20';
    case ModuleType.TRADING_POST: return 'border-rose-500 bg-rose-900/20 text-rose-400 shadow-rose-500/20';
    default: return 'border-slate-500';
  }
};

export const ModuleGrid: React.FC<ModuleGridProps> = ({ modules, onModuleClick, shieldActive, lastShieldHit }) => {
  const GRID_SIZE = 6; // Expanded grid
  const grid = Array(GRID_SIZE * GRID_SIZE).fill(null);
  
  modules.forEach(mod => {
    const index = mod.y * GRID_SIZE + mod.x;
    if (index >= 0 && index < grid.length) {
      grid[index] = mod;
    }
  });

  const isHitRecent = Date.now() - lastShieldHit < 1000;

  return (
    <div className="relative p-8 bg-slate-900/80 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden min-h-[500px] flex items-center justify-center backdrop-blur-sm">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>

      {/* Shield Overlay */}
      {shieldActive && (
          <div className={`absolute inset-0 z-20 pointer-events-none rounded-3xl border-4 transition-all duration-300
              ${isHitRecent 
                  ? 'border-red-500/80 bg-red-500/20 shadow-[0_0_100px_rgba(239,68,68,0.5)] animate-pulse' 
                  : 'border-violet-500/30 bg-violet-500/5 shadow-[0_0_50px_rgba(139,92,246,0.3)] animate-pulse'}
          `} />
      )}

      <div className={`grid grid-cols-6 gap-3 relative z-10 transform md:scale-100 scale-75 transition-transform duration-100 ${isHitRecent ? 'translate-x-1 translate-y-1' : ''}`}>
        {grid.map((mod: StationModule | null, i) => {
          if (!mod) {
            return (
              <div key={i} className="w-20 h-20 rounded-xl border border-slate-800/50 bg-slate-900/50 flex items-center justify-center opacity-30">
                <div className="w-1 h-1 rounded-full bg-slate-700" />
              </div>
            );
          }

          const colorClass = getModuleColor(mod.type);
          
          return (
            <button
              key={mod.id}
              onClick={() => onModuleClick(mod.id)}
              className={`
                group relative w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center
                transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg
                ${colorClass}
                ${!mod.isActive ? 'grayscale opacity-50' : ''}
              `}
            >
              {/* Status Indicator Overlay */}
              <div className="absolute -top-1 -right-1 flex space-x-1">
                 <div className={`w-3 h-3 rounded-full border border-slate-900 ${
                     mod.integrity > 80 ? 'bg-green-500' : mod.integrity > 40 ? 'bg-yellow-500' : 'bg-red-500 animate-ping'
                 }`} title="Integrity"/>
                 {!mod.isActive && <div className="w-3 h-3 rounded-full border border-slate-900 bg-slate-500" title="Offline" />}
              </div>

              {mod.constructionProgress < 100 ? (
                 <div className="flex flex-col items-center animate-pulse text-slate-400">
                    <Hammer size={16} className="mb-1" />
                    <span className="text-[9px]">{mod.constructionProgress}%</span>
                 </div>
              ) : (
                <>
                  <div className="mb-1 group-hover:animate-bounce">
                    {getModuleIcon(mod.type)}
                  </div>
                  {/* Hover tooltip for quick info */}
                  <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-xl pb-1">
                      <span className="text-[8px] font-mono text-white">{Math.floor(mod.integrity)}%</span>
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
