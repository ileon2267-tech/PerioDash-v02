import React, { useState } from "react";
import { Patient } from "../types";
import { 
  Sparkles, 
  X, 
  Smile, 
  ShieldCheck, 
  HeartHandshake, 
  Printer, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Check, 
  Info,
  Calendar,
  Eye,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import InteractiveTooth3D from "./InteractiveTooth3D";

interface PatientPresentationModeProps {
  patient: Patient;
  onClose: () => void;
  clinicName?: string;
  doctorName?: string;
}

export default function PatientPresentationMode({
  patient,
  onClose,
  clinicName = "PerioClinic Providencia",
  doctorName = "Dr. Ignacio León"
}: PatientPresentationModeProps) {
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [selected3DTooth, setSelected3DTooth] = useState<number>(16);

  // Compute patient-friendly metrics from clinical data
  const odontogram = patient.odontogram || {};
  const teethList = Object.entries(odontogram);
  
  const cariesTeeth = teethList.filter(([_, t]) => Object.values(t.surfaces || {}).some(c => c === "caries"));
  const healthyTeeth = teethList.filter(([_, t]) => t.condition === "sano" && Object.values(t.surfaces || {}).every(c => c === "sano"));
  const restoredTeeth = teethList.filter(([_, t]) => t.condition === "endodoncia" || t.condition === "implante" || Object.values(t.surfaces || {}).some(c => c === "obturado"));
  
  // Calculate O'Leary
  const oLeary = patient.oLeary || {};
  const totalSurfaces = Object.keys(oLeary).length;
  const plaqueSurfaces = Object.values(oLeary).filter(Boolean).length;
  const plaquePercentage = totalSurfaces > 0 ? Math.round((plaqueSurfaces / totalSurfaces) * 100) : 15;

  const getPlaqueStatus = (pct: number) => {
    if (pct <= 20) return { text: "Excelente Higiene", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", tip: "¡Gran trabajo! Tus encías muestran un ambiente biológico muy sano." };
    if (pct <= 35) return { text: "Buena - Requiere Refuerzo", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10 border-teal-500/30", tip: "Buen control en general. Pon atención en las caras posteriores de tus molares." };
    return { text: "Atención Necesaria", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", tip: "La placa acumulada puede inflamar las encías. Te enseñaremos técnicas de cepillado sencillas." };
  };

  const plaqueInfo = getPlaqueStatus(plaquePercentage);

  // Proposed treatment procedures
  const plan = patient.treatmentPlan || { procedures: [] };
  const pendingProcedures = plan.procedures.filter(p => !p.completed);

  const handleShareWhatsApp = () => {
    const text = `Hola ${patient.name}, aquí está el resumen de tu consulta en ${clinicName}.
Estado general de salud oral: Favorable.
Índice de Higiene: ${plaquePercentage}% (${plaqueInfo.text}).
Tratamientos sugeridos: ${pendingProcedures.length > 0 ? pendingProcedures.map(p => p.description).join(", ") : "Control preventivo y mantenimiento periódico"}.
Doctor a cargo: ${doctorName}.
¡Nos vemos en tu próxima sesión!`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setShowShareSuccess(true);
    setTimeout(() => setShowShareSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Presentation Bar */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 px-6 py-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold">
              <Smile className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-teal-100 bg-white/15 px-2 py-0.5 rounded-md">
                  Modo Paciente • Vista Explicativa
                </span>
                <span className="text-xs text-teal-100/90 font-medium">
                  {clinicName}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-white mt-0.5">
                Resumen de Salud Bucal: {patient.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Imprimir para el Paciente"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Cerrar Vista Paciente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Card: Saludo y Estado General */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-teal-100 dark:border-teal-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-xs uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4" />
                Diagnóstico y Bienestar Oral
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                Tu plan de cuidado personalizado para una sonrisa sana y fuerte
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Este resumen resume el diagnóstico realizado en consulta, diseñado para que comprendas claramente el estado de tus dientes, encías y los pasos a seguir de manera transparente.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar a mi WhatsApp
              </button>
            </div>
          </div>

          {showShareSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              ¡Resumen preparado! Se ha abierto WhatsApp con la información lista para enviar.
            </div>
          )}

          {/* Triada de Indicadores Fáciles de Entender */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Dientes Sanos */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400 font-mono">Estructura Dental</span>
                  <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-3xl font-black font-display text-slate-900 dark:text-white mt-3">
                  {healthyTeeth.length > 0 ? healthyTeeth.length : 28} <span className="text-sm font-normal text-slate-400">piezas sanas</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  La gran mayoría de tus dientes se encuentran con esmalte íntegro y sin lesiones activas.
                </p>
              </div>

              {cariesTeeth.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {cariesTeeth.length} pieza(s) requieren atención preventiva
                </div>
              )}
            </div>

            {/* 2. Higiene y Encías */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400 font-mono">Salud de Encías</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${plaqueInfo.bg} ${plaqueInfo.color}`}>
                    {plaqueInfo.text}
                  </span>
                </div>
                <div className="text-3xl font-black font-display text-slate-900 dark:text-white mt-3">
                  {plaquePercentage}% <span className="text-sm font-normal text-slate-400">índice de placa</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {plaqueInfo.tip}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono">
                Meta recomendada para encías sanas: menos del 20%
              </div>
            </div>

            {/* 3. Próximo Paso */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400 font-mono">Plan de Acción</span>
                  <span className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                    <HeartHandshake className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-3xl font-black font-display text-slate-900 dark:text-white mt-3">
                  {pendingProcedures.length} <span className="text-sm font-normal text-slate-400">pasos sugeridos</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {pendingProcedures.length > 0 
                    ? "Diseñado en fases ordenadas para tu comodidad y bienestar." 
                    : "No requieres tratamientos invasivos. ¡Solo tu control semestral!"}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-teal-600 dark:text-teal-400 font-bold">
                Atendido por: {doctorName}
              </div>
            </div>
          </div>

          {/* Tratamientos Propuestos en Lenguaje Amigable */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs">
            <h4 className="text-sm font-bold font-display text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Tus Próximos Tratamientos Explicados
            </h4>

            {pendingProcedures.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Actualmente no tienes tratamientos pendientes agendados. Te esperamos en tu próxima profilaxis de control.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingProcedures.map((proc, index) => (
                  <div 
                    key={proc.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold font-mono text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {proc.description}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono capitalize">
                          Fase recomendada: {proc.phase}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                      ${proc.cost.toLocaleString("es-CL")} CLP
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3D Visualizer & Guía de Cepillado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
              <h4 className="text-sm font-bold font-display text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Explorador Anatómico 3D
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                El odontólogo puede girar la pieza dental para mostrarte la corona, las raíces y el hueso de soporte.
              </p>
              
              <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <InteractiveTooth3D
                  toothNumber={selected3DTooth}
                  activeArch={selected3DTooth < 30 ? "upper" : "lower"}
                  showInternalAnatomy={true}
                  pocketData={{ mesial: 2, central: 2, distal: 3 }}
                  recessData={{ mesial: 0, central: 0, distal: 0 }}
                  bleedingData={{ mesial: false, central: false, distal: false }}
                  plaqueData={{ mesial: false, central: false, distal: false }}
                  inputPosition="central"
                  inputSurface="vestibular"
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold font-display text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Consejos Clave Para Casa
                </h4>
                
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-600 font-bold flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block">Cepillado a 45° (Técnica de Bass)</strong>
                      <span className="text-slate-500 text-[11px]">Dirige las cerdas hacia la unión entre el diente y la encía en movimientos vibratorios suaves.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-600 font-bold flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block">Uso Diario de Seda Dental</strong>
                      <span className="text-slate-500 text-[11px]">Limpia el 40% de la superficie interproximal que el cepillo normal no alcanza.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-600 font-bold flex items-center justify-center shrink-0">3</span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block">Control Preventivo Cada 6 Meses</strong>
                      <span className="text-slate-500 text-[11px]">Evita acumulaciones de cálculo subgingival y mantiene tu garantía de tratamiento.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono text-[10px]">PerioDash Healthcare v15 Pro</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl cursor-pointer transition-all"
                >
                  Regresar a Ficha Médica
                </button>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
