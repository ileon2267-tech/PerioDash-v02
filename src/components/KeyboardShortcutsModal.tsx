import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard, Zap, Sparkles, Command, PhoneCall, Calendar, UserPlus, Stethoscope, Mic } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string) => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose, onAction = () => {} }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: 'Shift + ?', desc: 'Abrir este menú de atajos de teclado', icon: Keyboard },
    { key: 'Ctrl + K', desc: 'Búsqueda rápida y comando general', icon: Command },
    { key: 'Alt + P', desc: 'Crear nuevo paciente rápidamente', icon: UserPlus },
    { key: 'Alt + C', desc: 'Agendar nueva cita clínica', icon: Calendar },
    { key: 'Alt + O', desc: 'Ir directamente al Odontograma', icon: Stethoscope },
    { key: 'Alt + E', desc: 'Ir al Periodontograma interactivo', icon: Zap },
    { key: 'Alt + S', desc: 'Activar Modo Sondaje Rápido (Teclado)', icon: Zap },
    { key: 'Alt + D', desc: 'Abrir Copiloto Dentito (Comandos de Voz)', icon: Mic },
  ];

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col my-auto"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Atajos Clínicos Rápidos</h3>
                <p className="text-xs text-teal-100">Agilidad y velocidad de captura durante consulta</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* List of shortcuts */}
          <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto flex-1">
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Teclas de acceso rápido globales
            </div>

            {SHORTCUTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 border border-slate-100 dark:border-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {item.desc}
                    </span>
                  </div>
                  <kbd className="px-2.5 py-1 text-[11px] font-mono font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs">
                    {item.key}
                  </kbd>
                </div>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 shrink-0">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" /> Presiona <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">Esc</kbd> para cerrar
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
