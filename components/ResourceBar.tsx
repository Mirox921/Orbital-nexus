
import React, { useState, useRef } from 'react';
import { Resources, ResourceRate, ResourceType } from '../types';
import { Droplets, Wind, Zap, Utensils, Box, FlaskConical, Shield, ArrowUp, ArrowDown } from 'lucide-react';
import { RESOURCE_COLORS, SHIELD_MAX_CHARGE } from '../constants';

interface ResourceBarProps {
  resources: Resources;
  dayCycle: number;
  tick: number;
  shieldCharge: number;
  rates?: Record<ResourceType, ResourceRate>;
}

const ResourceItem: React.FC<{ 
  icon: React.ReactNode; 
  value: number; 
  max: number; 
  label: string; 
  color: string;
  rate?: ResourceRate;
  onHover: (rect: DOMRect) => void;
  onLeave: () => void;
}> = ({ icon, value, max, label, color, rate, onHover, onLeave }) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const isLow = percent < 20;

  return (
    <div 
      className={`relative flex flex-col items-center justify-center min-w-[60px] md:w-auto px-2 md:px-3 py-1 rounded-lg bg-slate-900/50 backdrop-blur-md border ${isLow ? 'border-red-500 animate-pulse' : 'border-slate-700/50'}`}
      onMouseEnter={(e) => onHover(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center space-x-1 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider hidden md:inline">{label}</span>
      </div>
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${isLow ? 'bg-red-500' : color.replace('text-', 'bg-')}`} 
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-slate-400 mt-1">{Math.floor(value)}</span>
    </div>
  );
};

export const ResourceBar: React.FC<ResourceBarProps> = ({ resources, dayCycle, tick, shieldCharge, rates }) => {
  const isDay = dayCycle > 25 && dayCycle < 75;
  const [hoveredRate, setHoveredRate] = useState<{ rate: ResourceRate, rect: DOMRect } | null>(null);

  const handleHover = (type: ResourceType, rect: DOMRect) => {
    if (rates && rates[type]) {
      setHoveredRate({ rate: rates[type], rect });
    }
  };

  const handleLeave = () => {
    setHoveredRate(null);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center space-x-4 w-full lg:w-auto justify-between lg:justify-start">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
                ORBITAL NEXUS
              </h1>
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 border-l border-slate-700 pl-4">
                <span>SOL: {Math.floor(tick / 60)}</span>
                <span>|</span>
                <span className={isDay ? "text-yellow-400" : "text-indigo-400"}>
                  {isDay ? "SUNLIGHT" : "ECLIPSE"}
                </span>
              </div>
            </div>

            <div className="flex flex-1 w-full justify-center lg:justify-end gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              <ResourceItem 
                icon={<Shield size={14} />} 
                value={shieldCharge} 
                max={SHIELD_MAX_CHARGE} 
                label="Shields" 
                color={RESOURCE_COLORS.shield}
                onHover={() => {}} 
                onLeave={handleLeave}
              />
              <div className="w-px bg-slate-700 mx-1"></div>
              <ResourceItem 
                icon={<Wind size={14} />} 
                value={resources.oxygen} 
                max={resources.maxOxygen} 
                label="O2" 
                color={RESOURCE_COLORS.oxygen}
                onHover={(rect) => handleHover(ResourceType.OXYGEN, rect)}
                onLeave={handleLeave}
              />
              <ResourceItem 
                icon={<Droplets size={14} />} 
                value={resources.water} 
                max={resources.maxWater} 
                label="H2O" 
                color={RESOURCE_COLORS.water}
                onHover={(rect) => handleHover(ResourceType.WATER, rect)}
                onLeave={handleLeave}
              />
              <ResourceItem 
                icon={<Zap size={14} />} 
                value={resources.energy} 
                max={resources.maxEnergy} 
                label="PWR" 
                color={RESOURCE_COLORS.energy}
                onHover={(rect) => handleHover(ResourceType.ENERGY, rect)}
                onLeave={handleLeave}
              />
              <ResourceItem 
                icon={<Utensils size={14} />} 
                value={resources.food} 
                max={resources.maxFood} 
                label="Food" 
                color={RESOURCE_COLORS.food}
                onHover={(rect) => handleHover(ResourceType.FOOD, rect)}
                onLeave={handleLeave}
              />
              <ResourceItem 
                icon={<Box size={14} />} 
                value={resources.materials} 
                max={resources.maxMaterials} 
                label="Mat" 
                color={RESOURCE_COLORS.materials}
                onHover={(rect) => handleHover(ResourceType.MATERIALS, rect)}
                onLeave={handleLeave}
              />
              <ResourceItem 
                icon={<FlaskConical size={14} />} 
                value={resources.science} 
                max={resources.maxScience} 
                label="Sci" 
                color={RESOURCE_COLORS.science}
                onHover={(rect) => handleHover(ResourceType.SCIENCE, rect)}
                onLeave={handleLeave}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Floating Tooltip - Rendered outside of the overflow container */}
      {hoveredRate && (
        <div 
          className="fixed z-[100] pointer-events-none transition-opacity duration-200"
          style={{ 
            top: `${hoveredRate.rect.bottom + 8}px`, 
            left: `${hoveredRate.rect.left + (hoveredRate.rect.width / 2)}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded p-2 shadow-2xl whitespace-nowrap">
            <div className="flex items-center space-x-2 text-[10px] font-mono mb-1 text-green-400">
               <ArrowUp size={10} />
               <span>+{hoveredRate.rate.production.toFixed(1)}/t</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-red-400">
               <ArrowDown size={10} />
               <span>-{hoveredRate.rate.consumption.toFixed(1)}/t</span>
            </div>
            <div className="border-t border-slate-800 mt-1 pt-1 text-[9px] text-slate-500 text-center">
               Net: <span className={(hoveredRate.rate.production - hoveredRate.rate.consumption) >= 0 ? 'text-slate-300' : 'text-red-400'}>
                 {(hoveredRate.rate.production - hoveredRate.rate.consumption).toFixed(1)}
               </span>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 border-t border-l border-slate-700 rotate-45"></div>
        </div>
      )}
    </>
  );
};
