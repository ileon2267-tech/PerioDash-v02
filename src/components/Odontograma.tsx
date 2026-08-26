import React, { useState, useEffect } from "react";
import { ToothState } from "../types";
import { UPPER_TEETH, LOWER_TEETH } from "../initialData";
import { RefreshCw, CheckCircle2, AlertCircle, Sparkles, Wand2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OdontogramaProps {
  odontogram: Record<number, ToothState>;
  onChange: (updatedOdontogram: Record<number, ToothState>) => void;
}

type SelectedTool = "caries" | "obturado" | "sano";

function OdontogramaComponent({ odontogram, onChange }: OdontogramaProps) {
  const [activeTool, setActiveTool] = useState<SelectedTool>("caries");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(11);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [archFilter, setArchFilter] = useState<"all" | "upper" | "lower">("all");

  useEffect(() => {
    if (!showResetConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowResetConfirm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResetConfirm]);

  const handleSurfaceClick = (toothNum: number, surface: keyof ToothState["surfaces"]) => {
    const updated = { ...odontogram };
    const tooth = { ...updated[toothNum] };
    const surfaces = { ...tooth.surfaces };
    
    surfaces[surface] = activeTool;
    tooth.surfaces = surfaces;
    updated[toothNum] = tooth;
    onChange(updated);
  };

  const handleConditionChange = (toothNum: number, condition: ToothState["condition"]) => {
    const updated = { ...odontogram };
    const tooth = { ...updated[toothNum] };
    tooth.condition = condition;
    
    // If tooth is missing (ausente), optionally clear surfaces description
    if (condition === "ausente") {
      tooth.surfaces = {
        vestibular: "sano",
        occlusal: "sano",
        lingual: "sano",
        mesial: "sano",
        distal: "sano",
      };
    }
    
    updated[toothNum] = tooth;
    onChange(updated);
  };

  const resetAllOdontogram = () => {
    setShowResetConfirm(true);
  };

  const executeResetAllOdontogram = () => {
    const reset = { ...odontogram };
    Object.keys(reset).forEach((key) => {
      const num = Number(key);
      reset[num] = {
        toothNumber: num,
        surfaces: {
          vestibular: "sano",
          occlusal: "sano",
          lingual: "sano",
          mesial: "sano",
          distal: "sano",
        },
        condition: "sano",
      };
    });
    onChange(reset);
    setShowResetConfirm(false);
  };

  // Modern, clinical pastel-toned medical palette
  const getSurfaceColor = (state: "sano" | "caries" | "obturado") => {
    if (state === "caries") return "#ef4444"; // pure clinical red
    if (state === "obturado") return "#3b82f6"; // standard blue composite
    return "rgba(248, 250, 252, 1)"; // medical off-white base
  };

  const renderToothSVG = (toothNum: number) => {
    const tooth = odontogram[toothNum] || {
      toothNumber: toothNum,
      surfaces: { vestibular: "sano", occlusal: "sano", lingual: "sano", mesial: "sano", distal: "sano" },
      condition: "sano"
    };

    const isSelected = selectedTooth === toothNum;
    const isAusente = tooth.condition === "ausente";
    const isCorona = tooth.condition === "corona";
    const isEndo = tooth.condition === "endodoncia";
    const isImplant = tooth.condition === "implante";

    return (
      <motion.div 
        key={toothNum}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer select-none ${
          isSelected 
            ? "bg-teal-50/50 dark:bg-slate-800 border-teal-500 shadow-sm ring-1 ring-teal-500/10" 
            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
        }`}
        onClick={() => setSelectedTooth(toothNum)}
        id={`tooth-box-${toothNum}`}
      >
        <span className={`text-[10px] font-mono font-bold block ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}>
          P. {toothNum}
        </span>

        {/* Dynamic Visual Condition Badges */}
        <div className="relative w-14 h-14 flex items-center justify-center my-1">
          {/* Missing (Ausente) Cross line */}
          {isAusente && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="w-12 h-1 bg-red-500/80 rounded-full transform rotate-45 absolute" />
              <div className="w-12 h-1 bg-red-500/80 rounded-full transform -rotate-45 absolute" />
            </div>
          )}

          {/* Implant Badge Overlay */}
          {isImplant && (
            <div className="absolute inset-0 flex items-center justify-center bg-teal-500/5 rounded-full z-15 border border-dotted border-teal-500/20 pointer-events-none">
              <span className="text-[8px] font-bold bg-teal-600 text-white rounded-md px-1 py-0.5 tracking-tight shadow-xs">IMP</span>
            </div>
          )}

          {/* Crown (Corona) Border indicator */}
          <div className={`relative p-0.5 rounded-md transition-all ${isCorona ? "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-800" : ""}`}>
            
            <svg 
              viewBox="0 0 100 100" 
              className={`w-11 h-11 transition-all ${isAusente ? "opacity-30" : "opacity-100"}`}
            >
              {/* VESTIBULAR (TOP PATH) */}
              <path 
                d="M 12,12 L 88,12 L 70,30 L 30,30 Z" 
                fill={getSurfaceColor(tooth.surfaces.vestibular)} 
                stroke={isSelected ? "#0d9488" : "#94a3b8"} 
                strokeWidth="2.5"
                strokeLinejoin="round"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAusente) handleSurfaceClick(toothNum, "vestibular");
                }}
                className="tooth-surface transition-colors"
              />

              {/* DISTAL (RIGHT PATH) */}
              <path 
                d="M 88,12 L 88,88 L 70,70 L 70,30 Z" 
                fill={getSurfaceColor(tooth.surfaces.distal)} 
                stroke={isSelected ? "#0d9488" : "#94a3b8"} 
                strokeWidth="2.5"
                strokeLinejoin="round"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAusente) handleSurfaceClick(toothNum, "distal");
                }}
                className="tooth-surface transition-colors"
              />

              {/* LINGUAL (BOTTOM PATH) */}
              <path 
                d="M 88,88 L 12,88 L 30,70 L 70,70 Z" 
                fill={getSurfaceColor(tooth.surfaces.lingual)} 
                stroke={isSelected ? "#0d9488" : "#94a3b8"} 
                strokeWidth="2.5"
                strokeLinejoin="round"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAusente) handleSurfaceClick(toothNum, "lingual");
                }}
                className="tooth-surface transition-colors"
              />

              {/* MESIAL (LEFT PATH) */}
              <path 
                d="M 12,12 L 30,30 L 30,70 L 12,88 Z" 
                fill={getSurfaceColor(tooth.surfaces.mesial)} 
                stroke={isSelected ? "#0d9488" : "#94a3b8"} 
                strokeWidth="2.5"
                strokeLinejoin="round"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAusente) handleSurfaceClick(toothNum, "mesial");
                }}
                className="tooth-surface transition-colors"
              />

              {/* OCCLUSAL (CENTER BOX) */}
              <rect 
                x="30" 
                y="30" 
                width="40" 
                height="40" 
                rx="2"
                fill={getSurfaceColor(tooth.surfaces.occlusal)} 
                stroke={isSelected ? "#0d9488" : "#94a3b8"} 
                strokeWidth="2.5"
                strokeLinejoin="round"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAusente) handleSurfaceClick(toothNum, "occlusal");
                }}
                className="tooth-surface transition-colors"
              />
            </svg>
          </div>

          {/* Root Canal (Endodoncia) Core line indicator */}
          {isEndo && (
            <div className="absolute h-8 w-0.5 bg-blue-500 top-2/3 left-1/2 -translate-x-1/2 z-10 flex flex-col justify-end pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 -ml-0.5 shadow-xs" />
            </div>
          )}
        </div>

        {/* Dynamic Condition state label under the tooth */}
        <span className={`text-[9px] font-bold block h-3 uppercase tracking-tight text-center ${
          isAusente ? 'text-red-500' : isCorona ? 'text-amber-500' : isEndo ? 'text-blue-500 font-mono' : 'text-slate-400'
        }`}>
          {tooth.condition !== "sano" ? (tooth.condition === "endodoncia" ? "Endo" : tooth.condition) : ""}
        </span>
      </motion.div>
    );
  };

  const currentToothState = selectedTooth !== null ? odontogram[selectedTooth] : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs p-6 space-y-6" id="odontograma-panel">
      {/* Visual Header & Reset */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-white inline-flex items-center gap-2">
            <span>Odontograma Gráfico Anatómico</span>
          </h3>
          <p className="text-xs text-slate-400">Inspección de diagnóstico, caries activas y registro restaurativo dental multisectorial</p>
        </div>
        <button
          onClick={resetAllOdontogram}
          className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 text-xs py-2 px-3.5 rounded-xl font-medium inline-flex items-center gap-2 cursor-pointer transition-all shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 
          <span>Restablecer Odontograma</span>
        </button>
      </div>

      {/* Surface Brush Tools Selection */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Herramienta Pincel:</span>
          
          <button 
            onClick={() => setActiveTool("caries")}
            className={`text-xs py-2 px-3.5 rounded-xl font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border ${
              activeTool === "caries" 
                ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-500/10" 
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shrink-0" />
            <span>Caries</span>
          </button>

          <button 
            onClick={() => setActiveTool("obturado")}
            className={`text-xs py-2 px-3.5 rounded-xl font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border ${
              activeTool === "obturado" 
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10" 
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white shrink-0" />
            <span>Obturado</span>
          </button>

          <button 
            onClick={() => setActiveTool("sano")}
            className={`text-xs py-2 px-3.5 rounded-xl font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border ${
              activeTool === "sano" 
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/10" 
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-600 shrink-0" />
            <span>Saludable (Sano)</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-400 max-w-sm text-center lg:text-right font-light leading-relaxed">
          * Pulsa la herramienta del pincel y luego haz clic sobre cualquier sector (vestibular, distal, lingual, mesial, oclusal) de un diente para pintarlo de inmediato.
        </p>
      </div>

      {/* Visual Guide Legend Block & Arch Selector */}
      <div className="bg-slate-50/40 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => setArchFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              archFilter === "all"
                ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            Ambas Arcadas
          </button>
          <button
            onClick={() => setArchFilter("upper")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              archFilter === "upper"
                ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            Superior (11-28)
          </button>
          <button
            onClick={() => setArchFilter("lower")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              archFilter === "lower"
                ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            Inferior (31-48)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Caries Activa</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Obturado (Resina)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-100 border border-emerald-500/30" /> Sano</span>
          <span className="flex items-center gap-1.5"><span className="w-3 text-red-500 font-black text-center text-[12px] leading-none">&#10006;</span> Ausente</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded border-2 border-amber-500 bg-white dark:bg-slate-950 inline-block" /> Corona</span>
          <span className="flex items-center gap-1.5"><span className="px-1 py-0.2 bg-teal-600 text-white font-extrabold text-[8px] rounded uppercase">Imp</span> Implante</span>
        </div>
      </div>

      {/* Main FDI Tooth Chart Layout */}
      <div className="space-y-6 overflow-x-auto pb-4 pt-2">
        
        {/* Upper Arch */}
        {(archFilter === "all" || archFilter === "upper") && (
          <div className="space-y-3 min-w-[760px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center bg-slate-50 dark:bg-slate-800/40 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800/40">
              Arcada Maxilar Superior (11 - 28)
            </span>
            <div className="flex justify-between gap-2 px-1">
              {/* UPPER RIGHT */}
              <div className="flex gap-1.5">
                {UPPER_TEETH.right.map((num) => renderToothSVG(num))}
              </div>
              {/* CENTRAL MITROR LINE */}
              <div className="w-px bg-slate-200 dark:bg-slate-800 self-stretch my-1" />
              {/* UPPER LEFT */}
              <div className="flex gap-1.5">
                {UPPER_TEETH.left.map((num) => renderToothSVG(num))}
              </div>
            </div>
          </div>
        )}

        {/* Lower Arch */}
        {(archFilter === "all" || archFilter === "lower") && (
          <div className="space-y-3 min-w-[760px] pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center bg-slate-50 dark:bg-slate-800/40 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800/40">
              Arcada Mandibular Inferior (31 - 48)
            </span>
            <div className="flex justify-between gap-2 px-1">
              {/* LOWER RIGHT */}
              <div className="flex gap-1.5">
                {LOWER_TEETH.right.map((num) => renderToothSVG(num))}
              </div>
              {/* CENTRAL MIRROR LINE */}
              <div className="w-px bg-slate-200 dark:bg-slate-800 self-stretch my-1" />
              {/* LOWER LEFT */}
              <div className="flex gap-1.5">
                {LOWER_TEETH.left.map((num) => renderToothSVG(num))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* SECURE DETAIL CONTROL PANEL FOR SELECTED TOOTH */}
      <AnimatePresence mode="wait">
        {currentToothState && selectedTooth !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-2">
                <span>Pieza Seleccionada: <strong className="text-teal-600 dark:text-teal-400 text-lg font-display">P. {selectedTooth}</strong></span>
                <span className="text-[10px] bg-teal-50 dark:bg-teal-800/40 text-teal-600 dark:text-teal-400 font-mono font-bold py-1 px-2.5 rounded-lg border border-teal-500/10">
                  {(UPPER_TEETH.right.includes(selectedTooth) || UPPER_TEETH.left.includes(selectedTooth)) ? 'Maxilar Superior' : 'Mandibular Inferior'}
                </span>
              </h4>
              <p className="text-xs text-slate-400 font-normal leading-relaxed">
                Define la condición anatómica o anomalía clínica completa de este órgano dental específico:
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "sano", label: "Saludable" },
                { id: "ausente", label: "Ausente / Extracción" },
                { id: "corona", label: "Corona Protésica" },
                { id: "endodoncia", label: "Conducto (Endodoncia)" },
                { id: "implante", label: "Implante de Titanio" }
              ].map((cond) => (
                <button
                  key={cond.id}
                  onClick={() => handleConditionChange(selectedTooth, cond.id as ToothState["condition"])}
                  className={`text-xs py-2 px-4 rounded-xl font-semibold transition-all border cursor-pointer ${
                    currentToothState.condition === cond.id
                      ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-slate-900 dark:border-white shadow-md shadow-slate-900/15"
                      : "bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive visual legend */}
      <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800/40">
        <div className="flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 rounded-xs bg-[#ef4444] shadow-xs shrink-0" />
          <span className="font-light">Rojo: Lesión de Caries</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 rounded-xs bg-[#3b82f6] shadow-xs shrink-0" />
          <span className="font-light">Azul: Restaurado (Obturado)</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 rounded-xs border-2 border-slate-400 relative flex items-center justify-center overflow-hidden shrink-0">
            <span className="w-4 h-0.5 bg-red-500 absolute rotate-45" />
          </span>
          <span className="font-light">Cruz: Órgano Dental Ausente</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 shrink-0" />
          <span className="font-light">Borde Oro: Corona de Acero</span>
        </div>
      </div>

      {/* Custom Reset Confirmation Modal overlay */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowResetConfirm(false)}
            className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2rem] max-w-sm w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto flex flex-col"
            >
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-all duration-150"
                title="Cerrar ventana"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center border border-red-500/10">
                  <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-slate-900 dark:text-white">¿Restablecer Odontograma?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Esta acción revertirá todas las superficies, obturaciones y caries registradas en este paciente de forma irreversible.
                  </p>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={executeResetAllOdontogram}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer active:scale-95 text-center"
                  >
                    Sí, Restablecer
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700/60 active:scale-95 text-center"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(OdontogramaComponent);
