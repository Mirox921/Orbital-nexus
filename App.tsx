
import React, { useState } from 'react';
import { ResourceBar } from './components/ResourceBar';
import { ModuleGrid } from './components/ModuleGrid';
import { ControlPanel } from './components/ControlPanel';
import { EventModal } from './components/EventModal';
import { useGameEngine } from './hooks/useGameEngine';

const App: React.FC = () => {
  const { gameState, eventLogs, activeEvent, setActiveEvent, actions } = useGameEngine();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const selectedModule = gameState.modules.find(m => m.id === selectedModuleId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden relative selection:bg-cyan-500/30">
      {/* Background Starfield */}
      <div className="absolute inset-0 z-0 opacity-40" style={{
          backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
      }}></div>

      <ResourceBar 
        resources={gameState.resources} 
        dayCycle={gameState.dayCycle} 
        tick={gameState.tick}
        shieldCharge={gameState.shieldCharge}
        rates={gameState.resourceRates}
      />

      <main className="relative z-10 pt-24 pb-80 px-4 h-screen flex flex-col items-center justify-center">
        {gameState.gameOver ? (
            <div className="text-center p-8 bg-red-900/20 rounded-2xl border border-red-500/50 backdrop-blur-xl animate-in fade-in zoom-in">
                <h1 className="text-4xl font-bold text-red-500 mb-4">CRITICAL MISSION FAILURE</h1>
                <p className="text-slate-300 mb-6">Station life support systems have failed. Crew lost.</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all"
                >
                    REBOOT SYSTEM
                </button>
            </div>
        ) : (
            <ModuleGrid 
                modules={gameState.modules} 
                onModuleClick={setSelectedModuleId}
                shieldActive={gameState.shieldCharge > 0}
                lastShieldHit={gameState.lastShieldHit}
            />
        )}
      </main>

      <ControlPanel 
        resources={gameState.resources}
        crew={gameState.crew}
        eventLogs={eventLogs}
        onBuild={actions.buildModule}
        isPaused={gameState.isPaused}
        gameSpeed={gameState.gameSpeed}
        onTogglePause={actions.togglePause}
        onSetSpeed={actions.setSpeed}
        selectedModule={selectedModule}
        onRepair={actions.repairModule}
        onToggleModulePower={actions.toggleModulePower}
        unlockedResearch={gameState.unlockedResearch}
        onResearch={actions.researchTech}
        onSalvage={actions.salvageMaterials}
        onAnalyze={actions.analyzeData}
        onTrade={actions.executeTrade}
        onTrainCrew={actions.trainCrew}
        tradeOffers={gameState.tradeOffers}
        tick={gameState.tick}
        lastSalvageTick={gameState.lastSalvageTick}
        lastAnalyzeTick={gameState.lastAnalyzeTick}
        modules={gameState.modules}
      />

      <EventModal 
        event={activeEvent} 
        onClose={() => setActiveEvent(null)} 
      />
    </div>
  );
};

export default App;
