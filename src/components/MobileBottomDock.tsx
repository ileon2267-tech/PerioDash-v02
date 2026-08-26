import React from 'react';
import { Patient } from '../types';
import { 
  User, 
  Stethoscope, 
  Calendar, 
  Mic, 
  Menu,
  Sparkles
} from 'lucide-react';

interface MobileBottomDockProps {
  activePatient: Patient | null;
  activeTab: string;
  onNavigate: (tab: string, subView?: string) => void;
  onToggleVoice: () => void;
  onOpenNewAppointment: () => void;
  onOpenNewPatient: () => void;
  onToggleFastProbing?: () => void;
  onOpenMenu?: () => void;
}

function MobileBottomDockComponent({
  activePatient,
  activeTab,
  onNavigate,
  onToggleVoice,
  onOpenNewAppointment,
  onOpenNewPatient,
  onToggleFastProbing,
  onOpenMenu
}: MobileBottomDockProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+8px)] shadow-[0_-4px_25px_rgba(0,0,0,0.08)] no-print">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        
        {/* Patients Quick Button */}
        <button
          type="button"
          onClick={() => {
            if (activePatient) {
              onNavigate('clinica', 'ficha');
            } else {
              onNavigate('pacientes');
            }
          }}
          className={`flex flex-col items-center justify-center gap-1 p-1 rounded-2xl min-w-[56px] flex-1 transition-all cursor-pointer ${
            activeTab === 'pacientes'
              ? 'text-teal-600 dark:text-teal-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'pacientes' ? 'bg-teal-50 dark:bg-teal-950/60 ring-1 ring-teal-500/30' : ''}`}>
            <div className="relative">
              <User className="w-5 h-5" />
              {activePatient && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </div>
          </div>
          <span className="text-[10px] tracking-tight leading-none truncate max-w-[65px]">
            {activePatient ? activePatient.name.split(' ')[0] : 'Pacientes'}
          </span>
        </button>

        {/* Clinical View Button */}
        <button
          type="button"
          onClick={() => onNavigate('clinica', 'odontograma')}
          className={`flex flex-col items-center justify-center gap-1 p-1 rounded-2xl min-w-[56px] flex-1 transition-all cursor-pointer ${
            activeTab === 'clinica'
              ? 'text-teal-600 dark:text-teal-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'clinica' ? 'bg-teal-50 dark:bg-teal-950/60 ring-1 ring-teal-500/30' : ''}`}>
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-none font-medium">Clínica</span>
        </button>

        {/* Floating Center Dentito Copilot AI Voice Button */}
        <div className="relative -top-4 px-1 shrink-0">
          <button
            type="button"
            onClick={onToggleVoice}
            className="w-13 h-13 bg-gradient-to-tr from-teal-600 via-emerald-600 to-teal-500 text-white rounded-full shadow-lg shadow-teal-500/40 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center ring-4 ring-white dark:ring-slate-900 cursor-pointer"
            title="Copiloto Dentito (Asistente de Voz)"
          >
            <Mic className="w-5 h-5 text-white animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-tighter text-teal-100 mt-0.5">Dentito</span>
          </button>
        </div>

        {/* Agenda Button */}
        <button
          type="button"
          onClick={() => onNavigate('agenda')}
          className={`flex flex-col items-center justify-center gap-1 p-1 rounded-2xl min-w-[56px] flex-1 transition-all cursor-pointer ${
            activeTab === 'agenda'
              ? 'text-teal-600 dark:text-teal-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'agenda' ? 'bg-teal-50 dark:bg-teal-950/60 ring-1 ring-teal-500/30' : ''}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-none font-medium">Agenda</span>
        </button>

        {/* Full Menu Drawer Button */}
        <button
          type="button"
          onClick={() => {
            if (onOpenMenu) {
              onOpenMenu();
            }
          }}
          className="flex flex-col items-center justify-center gap-1 p-1 rounded-2xl min-w-[56px] flex-1 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer"
        >
          <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <Menu className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <span className="text-[10px] tracking-tight leading-none font-bold">Menú</span>
        </button>

      </div>
    </div>
  );
}

export default React.memo(MobileBottomDockComponent);

