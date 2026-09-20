import React, { useState, useEffect } from "react";
import { Patient, PsrRecord, PsrCode, PsrSextant } from "../types";
import { 
  PSR_SEXTANTS, 
  PSR_CODE_DETAILS, 
  evaluatePsrRecord, 
  SextantMeta,
  PsrEvaluationSummary 
} from "../utils/psrUtils";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  RotateCcw, 
  Sparkles, 
  Star, 
  Stethoscope, 
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { recordHipaaAudit } from "../utils/hipaaAudit";

interface PSRControlProps {
  patient: Patient;
  onUpdate: (updatedPsr: PsrRecord) => void;
  onNavigateToFullPerio?: () => void;
  onOpenChairMode?: () => void;
  isChairSide?: boolean; // When rendered inside Chair Mode (large touch targets, dark styling)
}

export default function PSRControl({
  patient,
  onUpdate,
  onNavigateToFullPerio,
  onOpenChairMode,
  isChairSide = false
}: PSRControlProps) {
  const psr: PsrRecord = patient.psr || {
    s1: { code: null, hasAsterisk: false },
    s2: { code: null, hasAsterisk: false },
    s3: { code: null, hasAsterisk: false },
    s4: { code: null, hasAsterisk: false },
    s5: { code: null, hasAsterisk: false },
    s6: { code: null, hasAsterisk: false },
    updatedAt: new Date().toISOString()
  };

  const [activeSextantId, setActiveSextantId] = useState<keyof Omit<PsrRecord, 'updatedAt' | 'evaluatedBy' | 'globalRecommendation'>>('s1');
  const [showWhoGuide, setShowWhoGuide] = useState<boolean>(false);

  // HIPAA Audit on view
  useEffect(() => {
    if (patient?.id) {
      recordHipaaAudit("VIEW_PSR_INDEX", `Consulta de tamizaje periodontal simplificado (PSR OMS) del paciente ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Sondaje PSR ePHI",
        severity: "info"
      });
    }
  }, [patient?.id]);

  const evaluation: PsrEvaluationSummary = evaluatePsrRecord(psr);

  const handleSetCode = (code: PsrCode) => {
    const current = psr[activeSextantId] || { code: null, hasAsterisk: false };
    const updatedSextant: PsrSextant = {
      ...current,
      code
    };

    const updatedPsr: PsrRecord = {
      ...psr,
      [activeSextantId]: updatedSextant,
      updatedAt: new Date().toISOString()
    };

    onUpdate(updatedPsr);

    // Auto-advance to next sextant in sequence
    const currentIndex = PSR_SEXTANTS.findIndex(s => s.id === activeSextantId);
    if (currentIndex < PSR_SEXTANTS.length - 1) {
      setActiveSextantId(PSR_SEXTANTS[currentIndex + 1].id);
    }
  };

  const handlePrevSextant = () => {
    const currentIndex = PSR_SEXTANTS.findIndex(s => s.id === activeSextantId);
    if (currentIndex > 0) {
      setActiveSextantId(PSR_SEXTANTS[currentIndex - 1].id);
    } else {
      setActiveSextantId(PSR_SEXTANTS[PSR_SEXTANTS.length - 1].id);
    }
  };

  const handleNextSextant = () => {
    const currentIndex = PSR_SEXTANTS.findIndex(s => s.id === activeSextantId);
    if (currentIndex < PSR_SEXTANTS.length - 1) {
      setActiveSextantId(PSR_SEXTANTS[currentIndex + 1].id);
    } else {
      setActiveSextantId(PSR_SEXTANTS[0].id);
    }
  };

  const handleToggleAsterisk = (targetId?: keyof Omit<PsrRecord, 'updatedAt' | 'evaluatedBy' | 'globalRecommendation'>) => {
    const id = targetId || activeSextantId;
    const current = psr[id] || { code: null, hasAsterisk: false };
    const updatedSextant: PsrSextant = {
      ...current,
      hasAsterisk: !current.hasAsterisk
    };

    const updatedPsr: PsrRecord = {
      ...psr,
      [id]: updatedSextant,
      updatedAt: new Date().toISOString()
    };

    onUpdate(updatedPsr);
  };

  const handleReset = () => {
    const emptyPsr: PsrRecord = {
      s1: { code: null, hasAsterisk: false },
      s2: { code: null, hasAsterisk: false },
      s3: { code: null, hasAsterisk: false },
      s4: { code: null, hasAsterisk: false },
      s5: { code: null, hasAsterisk: false },
      s6: { code: null, hasAsterisk: false },
      updatedAt: new Date().toISOString()
    };
    onUpdate(emptyPsr);
    setActiveSextantId('s1');
  };

  const handleSetAllHealthy = () => {
    const healthyPsr: PsrRecord = {
      s1: { code: 0, hasAsterisk: false },
      s2: { code: 0, hasAsterisk: false },
      s3: { code: 0, hasAsterisk: false },
      s4: { code: 0, hasAsterisk: false },
      s5: { code: 0, hasAsterisk: false },
      s6: { code: 0, hasAsterisk: false },
      updatedAt: new Date().toISOString()
    };
    onUpdate(healthyPsr);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (['0', '1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        handleSetCode(Number(e.key) as PsrCode);
      } else if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleSetCode('X');
      } else if (e.key === '*' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleToggleAsterisk();
      } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault();
        const currIdx = PSR_SEXTANTS.findIndex(s => s.id === activeSextantId);
        const nextIdx = (currIdx + 1) % PSR_SEXTANTS.length;
        setActiveSextantId(PSR_SEXTANTS[nextIdx].id);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const currIdx = PSR_SEXTANTS.findIndex(s => s.id === activeSextantId);
        const prevIdx = currIdx === 0 ? PSR_SEXTANTS.length - 1 : currIdx - 1;
        setActiveSextantId(PSR_SEXTANTS[prevIdx].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSextantId, psr]);

  const upperSextants = PSR_SEXTANTS.filter(s => s.arch === 'superior');
  // Lower sextants arranged anatomically: S6 (Right), S5 (Anterior), S4 (Left)
  const lowerSextants = [
    PSR_SEXTANTS.find(s => s.id === 's6')!,
    PSR_SEXTANTS.find(s => s.id === 's5')!,
    PSR_SEXTANTS.find(s => s.id === 's4')!
  ];

  const currentSextantMeta = PSR_SEXTANTS.find(s => s.id === activeSextantId)!;
  const currentSextantData = psr[activeSextantId] || { code: null, hasAsterisk: false };

  return (
    <div className={`space-y-6 ${isChairSide ? 'text-white' : ''}`}>
      {/* HEADER BANNER */}
      <div className={`p-5 md:p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isChairSide 
          ? 'bg-slate-900/90 border-slate-800' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                Sondaje PSR (Tamizaje Periodontal OMS)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                OMS / AAP
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Periodontal Screening & Recording a 6 sextantes mediante sonda periodontal OMS de bola (3.5 - 5.5 mm).
            </p>
          </div>
        </div>

        {/* TOP CONTROLS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowWhoGuide(!showWhoGuide)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
              showWhoGuide
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : isChairSide
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Guía OMS</span>
          </button>

          <button
            onClick={handleSetAllHealthy}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isChairSide
                ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-emerald-950/30'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
            }`}
            title="Marcar todos los sextantes con Código 0 (Salud)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Todo Sano (0)</span>
          </button>

          <button
            onClick={handleReset}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isChairSide
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
            title="Reiniciar todos los códigos del PSR"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onOpenChairMode && (
            <button
              onClick={onOpenChairMode}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-900/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>Modo Sillón</span>
            </button>
          )}
        </div>
      </div>

      {/* WHO CRITERIA COLLAPSIBLE GUIDE */}
      <AnimatePresence>
        {showWhoGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-5 rounded-3xl border space-y-4 ${
              isChairSide
                ? 'bg-slate-900 border-teal-500/30 text-slate-200'
                : 'bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50 text-slate-800 dark:text-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <h3 className="font-bold text-sm text-teal-900 dark:text-teal-200">
                    Criterios Clínicos de la Sonda OMS (World Health Organization)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Bolita de 0.5 mm • Banda negra de 3.5 a 5.5 mm
                </span>
              </div>

              {/* CODE CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {Object.values(PSR_CODE_DETAILS).map((cd) => (
                  <div 
                    key={String(cd.code)}
                    className={`p-3 rounded-2xl border ${cd.bgClass} ${cd.borderClass} flex flex-col justify-between space-y-1.5`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-black font-mono text-base ${cd.colorClass}`}>
                        {cd.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${cd.colorClass} bg-white/40 dark:bg-black/30 border border-current/20`}>
                        {cd.badge}
                      </span>
                    </div>
                    <p className="font-medium text-slate-700 dark:text-slate-200 text-[11px]">
                      {cd.whoProbeFinding}
                    </p>
                    <div className="pt-1.5 border-t border-current/10 text-[10px] text-slate-500 dark:text-slate-400">
                      <strong>Tto:</strong> {cd.treatment}
                    </div>
                  </div>
                ))}
              </div>

              {/* ASTERISK GUIDE */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs">
                <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-amber-900 dark:text-amber-200">
                  <strong>Símbolo de Complejidad (*):</strong> Se anota junto al código si existe compromiso de furcación (Grados I, II o III), movilidad patológica (Grado 2 o 3), recesión gingival ≥ 3.5 mm o problema mucogingival severo. Obliga a examen minucioso del sextante.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT: SEXTANT CHART (LEFT) & ACTIVE SEXTANT CONTROLLER (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SEXTANTS MOUTH MAP (Cols 1-7) */}
        <div className={`lg:col-span-7 p-5 md:p-6 rounded-3xl border shadow-sm flex flex-col space-y-5 ${
          isChairSide
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Mapa Anatómico
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Los 6 Sextantes Clínicos
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>{evaluation.evaluatedCount}/6 Evaluados</span>
              <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${(evaluation.evaluatedCount / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* ARCADA SUPERIOR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1">
              <span>Derecha del Paciente</span>
              <span className="text-teal-600 dark:text-teal-400 uppercase tracking-widest font-black">Arcada Superior</span>
              <span>Izquierda del Paciente</span>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
              {upperSextants.map((s) => {
                const sData = psr[s.id] || { code: null, hasAsterisk: false };
                const isSelected = activeSextantId === s.id;
                const codeDetails = sData.code !== null && sData.code !== undefined 
                  ? PSR_CODE_DETAILS[String(sData.code)] 
                  : null;

                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSextantId(s.id)}
                    className={`relative p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between min-h-[90px] sm:min-h-[110px] ${
                      isSelected
                        ? 'border-teal-500 ring-2 ring-teal-500/40 bg-teal-50/50 dark:bg-teal-950/40 shadow-md'
                        : isChairSide
                        ? 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70 hover:border-teal-400/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black font-display text-slate-700 dark:text-slate-200">
                            {s.shortLabel}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            ({s.teethRange})
                          </span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 capitalize line-clamp-1">
                          {s.position}
                        </span>
                      </div>

                      {/* Asterisk Badge */}
                      {sData.hasAsterisk && (
                        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px] sm:text-xs shadow-xs" title="Modificador de complejidad clínica activo">
                          *
                        </span>
                      )}
                    </div>

                    {/* BIG CODE NUMBER */}
                    <div className="my-0.5 sm:my-1 flex items-baseline justify-center">
                      <span className={`text-2xl sm:text-3xl md:text-4xl font-black font-mono ${
                        codeDetails ? codeDetails.colorClass : 'text-slate-300 dark:text-slate-600'
                      }`}>
                        {sData.code !== null && sData.code !== undefined ? sData.code : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                      <span className={`font-bold truncate ${codeDetails ? codeDetails.colorClass : 'text-slate-400'}`}>
                        {codeDetails ? codeDetails.badge : 'Pendiente'}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ARCADA INFERIOR */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1">
              <span>Derecha del Paciente</span>
              <span className="text-teal-600 dark:text-teal-400 uppercase tracking-widest font-black">Arcada Inferior</span>
              <span>Izquierda del Paciente</span>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
              {lowerSextants.map((s) => {
                const sData = psr[s.id] || { code: null, hasAsterisk: false };
                const isSelected = activeSextantId === s.id;
                const codeDetails = sData.code !== null && sData.code !== undefined 
                  ? PSR_CODE_DETAILS[String(sData.code)] 
                  : null;

                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSextantId(s.id)}
                    className={`relative p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between min-h-[90px] sm:min-h-[110px] ${
                      isSelected
                        ? 'border-teal-500 ring-2 ring-teal-500/40 bg-teal-50/50 dark:bg-teal-950/40 shadow-md'
                        : isChairSide
                        ? 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70 hover:border-teal-400/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black font-display text-slate-700 dark:text-slate-200">
                            {s.shortLabel}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            ({s.teethRange})
                          </span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 capitalize line-clamp-1">
                          {s.position}
                        </span>
                      </div>

                      {/* Asterisk Badge */}
                      {sData.hasAsterisk && (
                        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px] sm:text-xs shadow-xs" title="Modificador de complejidad clínica activo">
                          *
                        </span>
                      )}
                    </div>

                    {/* BIG CODE NUMBER */}
                    <div className="my-0.5 sm:my-1 flex items-baseline justify-center">
                      <span className={`text-2xl sm:text-3xl md:text-4xl font-black font-mono ${
                        codeDetails ? codeDetails.colorClass : 'text-slate-300 dark:text-slate-600'
                      }`}>
                        {sData.code !== null && sData.code !== undefined ? sData.code : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                      <span className={`font-bold truncate ${codeDetails ? codeDetails.colorClass : 'text-slate-400'}`}>
                        {codeDetails ? codeDetails.badge : 'Pendiente'}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TEETH LIST CHIPS FOR ACTIVE SEXTANT */}
          <div className="pt-2 text-xs flex items-center gap-2 flex-wrap text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Piezas evaluadas en {currentSextantMeta.shortLabel}:</span>
            <div className="flex items-center gap-1">
              {currentSextantMeta.teeth.map((t) => (
                <span 
                  key={t}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px] border border-slate-200/60 dark:border-slate-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ACTIVE SEXTANT KEYPAD & CLINICAL CONTROLS (Cols 8-12) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* SEXTANT ACTION CARD */}
          <div className={`p-5 md:p-6 rounded-3xl border shadow-sm space-y-4 ${
            isChairSide
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Sextante Activo
                </span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  {currentSextantMeta.label}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Piezas FDI: {currentSextantMeta.teethRange}
                </p>
              </div>

              {/* Current Value Pill */}
              <div className="text-right">
                <div className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                  {currentSextantData.code !== null && currentSextantData.code !== undefined ? (
                    <span>
                      {currentSextantData.code}
                      {currentSextantData.hasAsterisk && <span className="text-amber-500">*</span>}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-base">Sin Código</span>
                  )}
                </div>
              </div>
            </div>

            {/* TOUCH KEYPAD: BUTTONS >= 60x60px FOR CHAIRSIDE SANITARY ERGONOMICS */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                Asignar Código PSR (Sonda OMS)
              </label>
              
              <div className="grid grid-cols-3 gap-2.5">
                {[0, 1, 2, 3, 4, 'X'].map((val) => {
                  const details = PSR_CODE_DETAILS[String(val)];
                  const isCurrent = currentSextantData.code === val;

                  return (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => handleSetCode(val as PsrCode)}
                      className={`min-h-[58px] md:min-h-[64px] rounded-2xl border font-mono font-black text-xl flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
                        isCurrent
                          ? `${details.bgClass} ${details.borderClass} ${details.colorClass} ring-2 ring-current/40 shadow-sm`
                          : isChairSide
                          ? 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span>{val}</span>
                      <span className="text-[9px] font-sans font-bold uppercase tracking-normal opacity-80 mt-0.5">
                        {details.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ASTERISK MODIFIER TOGGLE (Large button >= 54px) */}
            <button
              type="button"
              onClick={() => handleToggleAsterisk()}
              className={`w-full min-h-[54px] p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                currentSextantData.hasAsterisk
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-500 shadow-sm'
                  : isChairSide
                  ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-400'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-lg ${
                  currentSextantData.hasAsterisk ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  *
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Modificador de Complejidad (*)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Furca, movilidad ≥2, recesión ≥3.5mm o mucogingival
                  </div>
                </div>
              </div>
              <span className={`text-xs font-black uppercase px-2 py-1 rounded-lg ${
                currentSextantData.hasAsterisk ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                {currentSextantData.hasAsterisk ? 'Activo' : 'Inactivo'}
              </span>
            </button>
          </div>

          {/* GLOBAL EVALUATION & ACTION PROTOCOL CARD */}
          <div className={`p-5 md:p-6 rounded-3xl border shadow-sm space-y-4 ${
            isChairSide
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Diagnóstico & Conducta Clínica
              </span>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono border ${
                evaluation.maxCode === 4 ? 'bg-rose-500/15 border-rose-500/40 text-rose-500' :
                evaluation.maxCode === 3 ? 'bg-orange-500/15 border-orange-500/40 text-orange-500' :
                evaluation.maxCode === 2 ? 'bg-amber-500/15 border-amber-500/40 text-amber-500' :
                evaluation.maxCode === 1 ? 'bg-sky-500/15 border-sky-500/40 text-sky-500' :
                evaluation.maxCode === 0 ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500' :
                'bg-slate-500/15 border-slate-500/40 text-slate-400'
              }`}>
                {evaluation.maxCode !== null ? `Código Max: ${evaluation.maxCode}${evaluation.hasAsterisk ? '*' : ''}` : 'Sin datos'}
              </span>
            </div>

            <div>
              <h3 className={`text-lg font-black font-display ${evaluation.severityColor}`}>
                {evaluation.overallStatus}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {evaluation.clinicalGuideline}
              </p>
            </div>

            <div className={`p-3 rounded-2xl border text-xs ${
              evaluation.requiresFullPeriodontogram
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                : 'bg-teal-500/10 border-teal-500/30 text-teal-900 dark:text-teal-200'
            }`}>
              <div className="font-bold mb-0.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Protocolo de Manejo Recomendado:</span>
              </div>
              <p className="leading-relaxed opacity-90">
                {evaluation.recommendedAction}
              </p>
            </div>

            {/* ACTION LINK TO FULL PERIODONTOGRAM */}
            {onNavigateToFullPerio && (
              <button
                type="button"
                onClick={onNavigateToFullPerio}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Ir a Periodontograma Completo (6 Puntos)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Validado bajo estándar OMS / AAP
              </span>
              <span className="font-mono">
                {psr.updatedAt ? new Date(psr.updatedAt).toLocaleDateString() : 'Hoy'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* MOBILE STICKY FLOATING KEYPAD DOCK (Visible only on mobile screens < lg) */}
      <div className="lg:hidden sticky bottom-2 z-30 mt-4">
        <div className={`p-2.5 rounded-2xl border shadow-xl backdrop-blur-xl flex flex-col gap-2 ${
          isChairSide
            ? 'bg-slate-900/95 border-teal-500/40 text-white shadow-black/80'
            : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800/90 text-slate-800 dark:text-slate-100 shadow-slate-900/20'
        }`}>
          {/* Active Sextant Banner & Arrows */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrevSextant}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 active:scale-95 cursor-pointer"
              title="Sextante anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-center truncate">
              <span className="text-[11px] font-black uppercase text-teal-600 dark:text-teal-400">
                {currentSextantMeta.shortLabel}:
              </span>
              <span className="text-xs font-bold truncate">
                {currentSextantMeta.teethRange}
              </span>
              <span className="text-xs font-mono font-black ml-1 text-teal-500">
                [{currentSextantData.code !== null && currentSextantData.code !== undefined ? `${currentSextantData.code}${currentSextantData.hasAsterisk ? '*' : ''}` : '-'}]
              </span>
            </div>
            <button
              type="button"
              onClick={handleNextSextant}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 active:scale-95 cursor-pointer"
              title="Sextante siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Code Buttons + Asterisk Toggle */}
          <div className="grid grid-cols-7 gap-1">
            {[0, 1, 2, 3, 4, 'X'].map((val) => {
              const details = PSR_CODE_DETAILS[String(val)];
              const isCurrent = currentSextantData.code === val;
              return (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => handleSetCode(val as PsrCode)}
                  className={`h-10 rounded-xl font-mono font-black text-sm sm:text-base flex flex-col items-center justify-center transition-all cursor-pointer active:scale-90 ${
                    isCurrent
                      ? `${details.bgClass} ${details.borderClass} ${details.colorClass} ring-2 ring-current/40 shadow-xs`
                      : isChairSide
                      ? 'bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>{val}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleToggleAsterisk()}
              className={`h-10 rounded-xl font-black text-base flex items-center justify-center transition-all cursor-pointer active:scale-90 border ${
                currentSextantData.hasAsterisk
                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300'
                  : isChairSide
                  ? 'bg-slate-800 border-slate-700 text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-amber-500'
              }`}
              title="Modificador de complejidad (*)"
            >
              *
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
