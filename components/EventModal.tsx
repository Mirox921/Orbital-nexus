
import React from 'react';
import { GameEvent } from '../types';
import { AlertTriangle, X, Info, CheckCircle } from 'lucide-react';

interface EventModalProps {
  event: GameEvent | null;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  const isCritical = event.severity === 'critical';
  const isLow = event.severity === 'low';

  const colorClass = isCritical 
    ? 'border-red-500/50 bg-red-950/30' 
    : isLow 
        ? 'border-cyan-500/50 bg-cyan-950/30' 
        : 'border-yellow-500/50 bg-yellow-950/30';
  
  const textColorClass = isCritical ? 'text-red-500' : isLow ? 'text-cyan-400' : 'text-yellow-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`bg-slate-900 border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 ${colorClass.split(' ')[0]}`}>
        <div className={`p-4 border-b flex items-center justify-between ${colorClass}`}>
          <div className={`flex items-center space-x-2 ${textColorClass}`}>
            {isCritical ? <AlertTriangle className="animate-pulse" /> : <Info />}
            <span className="font-bold tracking-widest uppercase">{event.severity} Priority</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-2">{event.title}</h2>
          <p className="text-slate-300 leading-relaxed font-mono text-sm">
            {event.description}
          </p>
        </div>

        <div className="bg-slate-950 p-4 flex justify-end">
          <button 
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium transition-colors text-white
                ${isCritical ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}
            `}
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
