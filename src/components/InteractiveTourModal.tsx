import React, { useState } from "react";
import { 
  Sparkles, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Search, 
  Activity, 
  Columns, 
  Bot, 
  Smile, 
  Eye, 
  ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InteractiveTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string, subView?: string) => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badge: string;
  tips: string[];
}

export default function InteractiveTourModal({
  isOpen,
  onClose,
  onNavigateToTab
}: InteractiveTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TourStep[] = [
    {
      title: "Búsqueda Ultrarrápida y Pacientes",
      subtitle: "Encuentra cualquier ficha en menos de 1 segundo",
      description: "Presiona en cualquier momento Ctrl + K para abrir el buscador universal. Podrás buscar por Nombre, RUT o Número de Expediente sin usar el ratón.",
      icon: Search,
      color: "from-teal-500 to-emerald-600",
      badge: "Paso 1 de 4 • Ergonomía",
      tips: [
        "Atajo global: Ctrl + K abre la barra flotante de búsqueda.",
        "Cambio rápido de paciente desde el menú superior en un clic.",
        "Cifrado de extremo a extremo y enmascaramiento de RUT para máxima privacidad."
      ]
    },
    {
      title: "Estación Clínica & Sondaje a 6 Puntos",
      subtitle: "Odontograma y Periodontograma científico",
      description: "Registra en tiempo real profundidades de sondaje, recesiones, sangrado al sondaje y movilidad dentaria con notación oficial FDI de 32 piezas y dentición mixta.",
      icon: Activity,
      color: "from-emerald-500 to-teal-700",
      badge: "Paso 2 de 4 • Odontología",
      tips: [
        "Haz clic en cualquier superficie (vestibular, oclusal, etc.) para marcar caries o restauraciones.",
        "Teclado numérico: ingresa milímetros de sondaje sin tocar el ratón.",
        "Cálculo instantáneo de riesgo periodontal y estadificación (Estadios I-IV, Grados A-C)."
      ]
    },
    {
      title: "Modo Sillón Zen & Vista Paciente",
      subtitle: "Espacio de trabajo limpio o presentación educativa",
      description: "Adapta la pantalla a tus necesidades en el box dental. Usa el Modo Zen para eliminar barras y menús, o la Vista Paciente para educar a tu paciente sin exponer datos privados.",
      icon: Eye,
      color: "from-blue-600 to-teal-600",
      badge: "Paso 3 de 4 • Presentación",
      tips: [
        "Atajo Alt + Z: Activa la pantalla completa y oculta distracciones.",
        "Vista Paciente: Enmascara notas privadas y costos internos para mostrar 3D interactivo y plan de cuidado.",
        "Comparte resúmenes por WhatsApp o imprime folletos explicativos en 1 clic."
      ]
    },
    {
      title: "Copiloto Dentito IA & Gestión Total",
      subtitle: "Tu asistente inteligente en el sillón dental",
      description: "Dentito analiza la ficha en tiempo real, sugiere diagnósticos según la clasificación de Chicago 2017 y te ayuda a redactar evoluciones SOAP e interconsultas.",
      icon: Bot,
      color: "from-purple-600 to-indigo-600",
      badge: "Paso 4 de 4 • Inteligencia Artificial",
      tips: [
        "Control por voz y transcripción clínica en la esquina inferior.",
        "Módulo de Caja Diaria y control de insumos críticos con alertas automáticas.",
        "Firma digital de consentimientos informados por código QR en el celular del paciente."
      ]
    }
  ];

  if (!isOpen) return null;

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem("perio_tour_completed", "true");
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
      >
        {/* Step Banner */}
        <div className={`p-6 bg-gradient-to-r ${step.color} text-white flex justify-between items-start`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-md text-teal-50">
                {step.badge}
              </span>
              <h3 className="text-xl font-display font-black text-white mt-1">
                {step.title}
              </h3>
              <p className="text-xs text-teal-100 font-medium">
                {step.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {step.description}
          </p>

          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Recomendaciones de uso rápido:
            </span>
            {step.tips.map((tip, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5"
              >
                <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  {tip}
                </span>
              </div>
            ))}
          </div>

          {/* Stepper Dots & Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentStep === i 
                      ? "w-6 bg-teal-600 dark:bg-teal-400" 
                      : "w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                  }`}
                  aria-label={`Ir al paso ${i + 1}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Atrás
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentStep === steps.length - 1 ? "¡Comenzar ahora!" : "Siguiente"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
