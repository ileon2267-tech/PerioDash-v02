import React, { useState, useEffect } from 'react';
import { Patient, PeriodontogramVisit, PeriodonState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  History, 
  ArrowRight, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

interface PeriodontogramComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSaveCurrentSnapshot: (title: string) => void;
}

// Compute metrics from a periodontogram state map
function computeMetrics(periodontogram: Record<number, PeriodonState>) {
  let totalSites = 0;
  let totalPocketDepth = 0;
  let activePocketsCount = 0; // >= 4mm
  let bleedingSites = 0;
  let plaqueSites = 0;

  const teethKeys = Object.keys(periodontogram).map(Number);
  
  teethKeys.forEach(tNum => {
    const p = periodontogram[tNum];
    if (!p) return;

    const v = p.vestibularPocket || { mesial: 0, central: 0, distal: 0 };
    const pal = p.palatinoPocket || { mesial: 0, central: 0, distal: 0 };

    [v.mesial, v.central, v.distal, pal.mesial, pal.central, pal.distal].forEach(val => {
      totalSites++;
      totalPocketDepth += val || 0;
      if ((val || 0) >= 4) activePocketsCount++;
    });

    const bV = p.sangradoVestibular || { mesial: false, central: false, distal: false };
    const bP = p.sangradoPalatino || { mesial: false, central: false, distal: false };
    [bV.mesial, bV.central, bV.distal, bP.mesial, bP.central, bP.distal].forEach(val => {
      if (val) bleedingSites++;
    });

    const plV = p.placaVestibular || { mesial: false, central: false, distal: false };
    const plP = p.placaPalatino || { mesial: false, central: false, distal: false };
    [plV.mesial, plV.central, plV.distal, plP.mesial, plP.central, plP.distal].forEach(val => {
      if (val) plaqueSites++;
    });
  });

  const meanDepth = totalSites > 0 ? (totalPocketDepth / totalSites).toFixed(1) : '0.0';
  const bopRate = totalSites > 0 ? Math.round((bleedingSites / totalSites) * 100) : 0;
  const plaqueRate = totalSites > 0 ? Math.round((plaqueSites / totalSites) * 100) : 0;

  return {
    meanDepth: parseFloat(meanDepth),
    bopRate,
    plaqueRate,
    activePocketsCount,
    totalSites
  };
}

export default function PeriodontogramComparisonModal({
  isOpen,
  onClose,
  patient,
  onSaveCurrentSnapshot
}: PeriodontogramComparisonModalProps) {
  const history = patient.periodontogramHistory || [];
  
  const [newTitle, setNewTitle] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [visitAId, setVisitAId] = useState<string>(history[0]?.id || 'current');
  const [visitBId, setVisitBId] = useState<string>(history[1]?.id || 'current');

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

  // Resolve snapshot A and snapshot B
  const resolveVisit = (id: string) => {
    if (id === 'current') {
      return {
        id: 'current',
        date: 'Actual (Hoy)',
        title: 'Estado Actual',
        periodontogram: patient.periodontogram
      };
    }
    const found = history.find(h => h.id === id);
    return found || {
      id: 'current',
      date: 'Actual (Hoy)',
      title: 'Estado Actual',
      periodontogram: patient.periodontogram
    };
  };

  const visitA = resolveVisit(visitAId);
  const visitB = resolveVisit(visitBId);

  const metricsA = computeMetrics(visitA.periodontogram);
  const metricsB = computeMetrics(visitB.periodontogram);

  // Deltas (B minus A)
  const depthDelta = (metricsB.meanDepth - metricsA.meanDepth).toFixed(1);
  const bopDelta = metricsB.bopRate - metricsA.bopRate;
  const plaqueDelta = metricsB.plaqueRate - metricsA.plaqueRate;
  const pocketsDelta = metricsB.activePocketsCount - metricsA.activePocketsCount;

  const handleSave = () => {
    if (!newTitle.trim()) return;
    onSaveCurrentSnapshot(newTitle.trim());
    setNewTitle('');
    setShowSaveInput(false);
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] my-auto"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-teal-700 to-emerald-800 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
                <History className="w-6 h-6 text-teal-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Comparador de Evolución Periodontal</h3>
                <p className="text-xs text-teal-100">Evaluación longitudinal de sondaje, sangrado y placa bacteriana</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Action Bar for Snapshot creation */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Histórico de Sondajes: <strong className="text-teal-600 dark:text-teal-400">{history.length + 1} registros</strong>
            </span>

            {showSaveInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ej. Re-evaluación a 3 meses"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-teal-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden"
                />
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowSaveInput(false)}
                  className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveInput(true)}
                className="px-3 py-1.5 bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300 rounded-xl text-xs font-semibold hover:bg-teal-500/20 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Snapshot de Visita Actual
              </button>
            )}
          </div>

          {/* Visit Selectors */}
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              {/* Visit A Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Punto de Control Inicial (Visita A)
                </label>
                <select
                  value={visitAId}
                  onChange={(e) => setVisitAId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="current">Estado Actual ({new Date().toLocaleDateString()})</option>
                  {history.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.title} ({h.date})
                    </option>
                  ))}
                </select>
              </div>

              {/* Visit B Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Punto de Control Posterior (Visita B)
                </label>
                <select
                  value={visitBId}
                  onChange={(e) => setVisitBId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="current">Estado Actual ({new Date().toLocaleDateString()})</option>
                  {history.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.title} ({h.date})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-side Metrics Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Metric 1: Mean Pocket Depth */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Profundidad Sondaje</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-sm font-semibold text-slate-500">{metricsA.meanDepth} mm</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">{metricsB.meanDepth} mm</span>
                </div>
                <div className={`mt-2 text-[11px] font-bold flex items-center gap-1 ${
                  Number(depthDelta) <= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {Number(depthDelta) <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  {Number(depthDelta) <= 0 ? `${Math.abs(Number(depthDelta))} mm ganancia` : `+${depthDelta} mm mayor profundidad`}
                </div>
              </div>

              {/* Metric 2: BOP Bleeding Rate */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Sangrado al Sondaje (BOP)</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-sm font-semibold text-slate-500">{metricsA.bopRate}%</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">{metricsB.bopRate}%</span>
                </div>
                <div className={`mt-2 text-[11px] font-bold flex items-center gap-1 ${
                  bopDelta <= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {bopDelta <= 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {bopDelta <= 0 ? `${Math.abs(bopDelta)}% reducción sangrado` : `+${bopDelta}% incremento`}
                </div>
              </div>

              {/* Metric 3: Plaque Rate */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Índice Placa Placa %</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-sm font-semibold text-slate-500">{metricsA.plaqueRate}%</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">{metricsB.plaqueRate}%</span>
                </div>
                <div className={`mt-2 text-[11px] font-bold flex items-center gap-1 ${
                  plaqueDelta <= 0 ? 'text-emerald-500' : 'text-amber-500'
                }`}>
                  {plaqueDelta <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  {plaqueDelta <= 0 ? `${Math.abs(plaqueDelta)}% control de placa` : `+${plaqueDelta}% placa acumulada`}
                </div>
              </div>

              {/* Metric 4: Active Pockets >= 4mm */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Bolsas Activas (≥4mm)</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-sm font-semibold text-slate-500">{metricsA.activePocketsCount} sitios</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">{metricsB.activePocketsCount} sitios</span>
                </div>
                <div className={`mt-2 text-[11px] font-bold flex items-center gap-1 ${
                  pocketsDelta <= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {pocketsDelta <= 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {pocketsDelta <= 0 ? `${Math.abs(pocketsDelta)} bolsas cerradas` : `+${pocketsDelta} nuevas bolsas`}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-teal-600 text-white rounded-xl font-semibold text-xs hover:bg-teal-700 shadow-xs"
            >
              Cerrar Comparador
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
