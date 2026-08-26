import React, { useState, useEffect } from "react";
import { 
  Sparkles, HelpCircle, BookOpen, Activity, Play, Zap, Compass, Info,
  CheckCircle2, ChevronRight, X, AlertCircle, FileText, ChevronDown,
  Layout, Eye, Smile, Calendar, Printer, Shield, Database, Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Patient, ToothState, PeriodonState, OLearyState } from "../types";
import { ALL_TEETH_NUMBERS } from "../initialData";

interface InteractiveHelpPanelProps {
  activePatient: Patient | null;
  onUpdatePatient: (updatedPatient: Patient) => void;
  activeTab: string;
  clinicalSubView: string;
  onNavigate: (tab: any, subView?: any) => void;
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  learningMode: boolean;
  setLearningMode: (mode: boolean) => void;
}

export default function InteractiveHelpPanel({
  activePatient,
  onUpdatePatient,
  activeTab,
  clinicalSubView,
  onNavigate,
  darkMode,
  isOpen,
  onClose,
  learningMode,
  setLearningMode
}: InteractiveHelpPanelProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [simulationSuccess, setSimulationSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const steps = [
    {
      title: "Exploración & Buscador (Ctrl+K)",
      description: "Localiza expedientes al instante. Al presionar Ctrl+K desde cualquier pantalla se abre el buscador universal ultrarrápido con coincidencia difusa.",
      actionLabel: "Probar Ctrl+K",
      action: () => {
        window.dispatchEvent(new CustomEvent("periodash-open-search"));
      },
      icon: Compass,
      color: "from-blue-500/20 to-indigo-500/20 text-blue-500"
    },
    {
      title: "Odontograma Interactivo FDI",
      description: "Registra el estado dental con la notación de dos dígitos de la FDI. Haz clic en las caras externas o internas de cada diente para marcar caries, obturaciones, implantes o endodoncias.",
      actionLabel: "Ir al Odontograma",
      action: () => {
        onNavigate("pacientes", "odontograma");
      },
      icon: Smile,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-500"
    },
    {
      title: "Periodontograma de Alta Densidad",
      description: "Sondaje de diagnóstico periodontal completo a 6 puntos biométricos por diente (mesial, central y distal en caras vestibular y palatina/lingual). Registra profundidad, sangrado (BOP), placa y movilidad.",
      actionLabel: "Ir al Periodontograma",
      action: () => {
        onNavigate("pacientes", "periodontograma");
      },
      icon: Activity,
      color: "from-teal-500/20 to-cyan-500/20 text-teal-500"
    },
    {
      title: "Índice de Placa de O'Leary",
      description: "Mide el nivel higiénico general del paciente marcando las superficies con biofilm bacteriano. El sistema calcula automáticamente el porcentaje y el nivel de riesgo de forma matemática.",
      actionLabel: "Ir a O'Leary",
      action: () => {
        onNavigate("pacientes", "oleary");
      },
      icon: Shield,
      color: "from-pink-500/20 to-rose-500/20 text-pink-500"
    }
  ];

  // Helper functions to generate clinical simulation cases
  const simulatePeriodontitisSevera = () => {
    if (!activePatient) {
      setSimulationSuccess("⚠️ Selecciona o abre primero el expediente de un paciente para poblar la simulación.");
      setTimeout(() => setSimulationSuccess(null), 4000);
      return;
    }

    const updatedPerio: Record<number, PeriodonState> = {};
    ALL_TEETH_NUMBERS.forEach((num) => {
      // Simulate healthy values for non-molars, and deep pockets/bleeding on molars
      const isMolar = num % 10 >= 6; // 16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48
      updatedPerio[num] = {
        toothNumber: num,
        vestibularPocket: isMolar 
          ? { mesial: 5, central: 4, distal: 6 } 
          : { mesial: 2, central: 1, distal: 2 },
        palatinoPocket: isMolar 
          ? { mesial: 6, central: 3, distal: 5 } 
          : { mesial: 2, central: 1, distal: 2 },
        vestibularRecess: isMolar 
          ? { mesial: 1, central: 1, distal: 2 } 
          : { mesial: 0, central: 0, distal: 0 },
        palatinoRecess: isMolar 
          ? { mesial: 2, central: 0, distal: 1 } 
          : { mesial: 0, central: 0, distal: 0 },
        sangradoVestibular: isMolar 
          ? { mesial: true, central: false, distal: true } 
          : { mesial: false, central: false, distal: false },
        sangradoPalatino: isMolar 
          ? { mesial: true, central: true, distal: true } 
          : { mesial: false, central: false, distal: false },
        supuracionVestibular: { mesial: false, central: false, distal: isMolar },
        supuracionPalatino: { mesial: isMolar, central: false, distal: false },
        placaVestibular: { mesial: isMolar, central: isMolar, distal: isMolar },
        placaPalatino: { mesial: isMolar, central: false, distal: isMolar },
        movilidad: isMolar ? 2 : 0,
        furca: isMolar ? 1 : 0,
      };
    });

    onUpdatePatient({
      ...activePatient,
      periodontogram: updatedPerio,
      anamnesis: {
        ...activePatient.anamnesis,
        tabaquismo: 15, // smoker (15 cigarettes per day)
        diabetesStatus: "controlled"
      }
    });

    setSimulationSuccess("✅ Simulación Cargada: Periodontitis Severa en molares activos con bolsas ≥ 5mm.");
    setTimeout(() => setSimulationSuccess(null), 5000);
  };

  const simulateCariesMultiplex = () => {
    if (!activePatient) {
      setSimulationSuccess("⚠️ Selecciona o abre primero el expediente de un paciente para poblar la simulación.");
      setTimeout(() => setSimulationSuccess(null), 4000);
      return;
    }

    const updatedOdonto: Record<number, ToothState> = {};
    ALL_TEETH_NUMBERS.forEach((num) => {
      // Default to sano
      updatedOdonto[num] = {
        toothNumber: num,
        surfaces: { vestibular: "sano", occlusal: "sano", lingual: "sano", mesial: "sano", distal: "sano" },
        condition: "sano"
      };
    });

    // Add multiple targeted dental conditions
    updatedOdonto[11] = {
      toothNumber: 11,
      surfaces: { vestibular: "caries", occlusal: "sano", lingual: "sano", mesial: "caries", distal: "sano" },
      condition: "sano"
    };
    updatedOdonto[14] = {
      toothNumber: 14,
      surfaces: { vestibular: "sano", occlusal: "obturado", lingual: "sano", mesial: "sano", distal: "sano" },
      condition: "sano"
    };
    updatedOdonto[16] = {
      toothNumber: 16,
      surfaces: { vestibular: "sano", occlusal: "caries", lingual: "sano", mesial: "sano", distal: "sano" },
      condition: "sano"
    };
    updatedOdonto[26] = {
      toothNumber: 26,
      surfaces: { vestibular: "sano", occlusal: "sano", lingual: "sano", mesial: "sano", distal: "sano" },
      condition: "implante"
    };
    updatedOdonto[36] = {
      toothNumber: 36,
      surfaces: { vestibular: "sano", occlusal: "sano", lingual: "sano", mesial: "sano", distal: "sano" },
      condition: "endodoncia"
    };
    updatedOdonto[47] = {
      toothNumber: 47,
      surfaces: { vestibular: "sano", occlusal: "caries", lingual: "sano", mesial: "sano", distal: "sano" },
      condition: "sano"
    };

    onUpdatePatient({
      ...activePatient,
      odontogram: updatedOdonto
    });

    setSimulationSuccess("✅ Simulación Cargada: Se poblaron caries activas en incisivos y molares, un implante y una endodoncia.");
    setTimeout(() => setSimulationSuccess(null), 5000);
  };

  const simulateHighOleary = () => {
    if (!activePatient) {
      setSimulationSuccess("⚠️ Selecciona o abre primero el expediente de un paciente para poblar la simulación.");
      setTimeout(() => setSimulationSuccess(null), 4000);
      return;
    }

    const updatedOleary: Record<number, OLearyState> = {};
    ALL_TEETH_NUMBERS.forEach((num) => {
      // High plaque on most teeth (approx 55% plaque index)
      const isPlaca = num % 3 !== 0; 
      updatedOleary[num] = {
        toothNumber: num,
        vestibular: isPlaca,
        lingual: isPlaca,
        mesial: isPlaca && num % 2 === 0,
        distal: isPlaca && num % 4 === 0,
      };
    });

    onUpdatePatient({
      ...activePatient,
      oLeary: updatedOleary
    });

    setSimulationSuccess("✅ Simulación Cargada: Índice de O'Leary elevado (biofilm en más del 50% de las superficies).");
    setTimeout(() => setSimulationSuccess(null), 5000);
  };

  return (
    <>
      {/* Dynamic Top Learning Banner when learningMode is active */}
      {learningMode && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-teal-900 via-indigo-950 to-teal-900 border-b border-teal-500/30 text-white px-4 py-3 text-xs flex items-center justify-between shadow-lg sticky top-0 z-50 no-print"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-bold tracking-wider uppercase text-[10px] text-teal-400">Modo de Aprendizaje Activo:</span>
              <span className="font-light text-slate-200">
                Se han activado guías clínicas inteligentes e indicadores en cada pantalla para facilitar el uso de PerioDash.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => {
                // Open full guide
                onClose();
                setTimeout(() => onClose(), 100);
              }}
              className="bg-teal-500/25 hover:bg-teal-500/40 text-teal-300 hover:text-white font-bold px-3 py-1.5 rounded-lg transition-all text-[10.5px] cursor-pointer flex items-center gap-1 border border-teal-500/20"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Ver Guía Completa
            </button>
            <button 
              onClick={() => setLearningMode(false)}
              className="text-slate-400 hover:text-white transition-colors"
              title="Desactivar Modo Aprendizaje"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Slide-over Help Panel Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden no-print">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900 backdrop-blur-xs"
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col h-full"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Centro de Éxito Clínico</h3>
                      <p className="text-[11px] text-slate-400">Aprende e interactúa con PerioDash v15 Pro</p>
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                  
                  {/* Toggle Active Learning Mode Card */}
                  <div className="p-4 rounded-2xl border border-teal-500/20 bg-teal-50/20 dark:bg-teal-950/10 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-teal-850 dark:text-teal-300 uppercase tracking-wider">Modo de Aprendizaje Global</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Activa indicadores contextuales y explicaciones interactivas en todo el sistema para dominar el uso clínico de la app.
                        </p>
                      </div>
                      <button
                        onClick={() => setLearningMode(!learningMode)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${learningMode ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${learningMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Simulations & Demos Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulador de Datos Clínicos</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      ¿Quieres entender el ecosistema sin registrar datos manualmente? Haz un clic para poblar el expediente del paciente activo con un caso clínico preestablecido y observa cómo se calcula todo:
                    </p>

                    {simulationSuccess && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-teal-500/30 text-xs flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{simulationSuccess}</span>
                      </motion.div>
                    )}

                    <div className="space-y-2 pt-1">
                      <button 
                        onClick={simulatePeriodontitisSevera}
                        className="w-full text-left p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-950/50 text-xs transition-all flex justify-between items-center group cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400">Simular Periodontitis Severa</span>
                          <p className="text-[11px] text-slate-400">Pocisiones profundas ≥ 5mm, sangrado al 50% y tabaquismo.</p>
                        </div>
                        <Play className="w-4 h-4 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                      </button>

                      <button 
                        onClick={simulateCariesMultiplex}
                        className="w-full text-left p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-950/50 text-xs transition-all flex justify-between items-center group cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400">Simular Caries & Implantes</span>
                          <p className="text-[11px] text-slate-400">Caries activas en incisivos y molares en Odontograma.</p>
                        </div>
                        <Play className="w-4 h-4 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                      </button>

                      <button 
                        onClick={simulateHighOleary}
                        className="w-full text-left p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-950/50 text-xs transition-all flex justify-between items-center group cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400">Simular Índice O'Leary Elevado</span>
                          <p className="text-[11px] text-slate-400">Placa bacteriana severa para demostración de higiene.</p>
                        </div>
                        <Play className="w-4 h-4 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Steps Guide Carousel */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conceptos y Flujos Básicos</h4>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 space-y-4">
                      {/* Sub-step indicator bubbles */}
                      <div className="flex gap-1.5 justify-center">
                        {steps.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveStep(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${idx === activeStep ? 'bg-teal-500 w-6' : 'bg-slate-200 dark:bg-slate-700'}`}
                          />
                        ))}
                      </div>

                      {/* Step content */}
                      <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl bg-gradient-to-tr ${steps[activeStep].color}`}>
                            {React.createElement(steps[activeStep].icon, { className: "w-4 h-4" })}
                          </div>
                          <span className="font-bold text-xs text-slate-800 dark:text-white">{steps[activeStep].title}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {steps[activeStep].description}
                        </p>
                        <button
                          onClick={steps[activeStep].action}
                          className="w-full text-center bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>{steps[activeStep].actionLabel}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Technical & Medical Support Specifications */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumplimiento Clínico FDI</h4>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-500 leading-relaxed">
                      <p>
                        PerioDash está diseñado bajo estrictos estándares clínicos periodontales internacionales:
                      </p>
                      <ul className="space-y-1.5 list-disc pl-4 text-slate-400">
                        <li>Notación FDI internacional de dos dígitos (11 a 48 para dentición adulta).</li>
                        <li>Sondaje clínico estandarizado de 6 puntos por pieza dentaria.</li>
                        <li>Algoritmo matemático exacto para el índice de placa de O'Leary.</li>
                        <li>Diagrama predictivo de riesgo multifactorial PRA.</li>
                      </ul>
                    </div>
                  </div>

                </div>

                {/* Footer with support info */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-center space-y-1.5 text-[11px] text-slate-400">
                  <p className="font-semibold">PerioDash v15 Pro — Soporte Clínico Integrado</p>
                  <p>Guía de Éxito y onboarding activo para odontólogos y universidades.</p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
