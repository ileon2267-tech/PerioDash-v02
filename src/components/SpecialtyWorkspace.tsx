import React, { useState } from "react";
import { Patient } from "../types";
import { SpecialtyToolsSuite } from "./SpecialtyToolsSuite";
import RehabSchema2D from "./RehabSchema2D";
import { 
  ShieldAlert, 
  Activity, 
  Baby, 
  Layers, 
  Wrench, 
  Scissors, 
  Sparkles, 
  Smile, 
  Check, 
  Award, 
  Compass, 
  ChevronRight, 
  Info,
  Calendar,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SpecialtyWorkspaceProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  onNavigateToSubView: (subView: "odontograma" | "periodontograma" | "pra" | "oleary" | "xrays" | "soap" | "presupuesto" | "especialidad") => void;
}

export type DentalSpecialty = 
  | "periodoncia" 
  | "endodoncia" 
  | "ortodoncia" 
  | "odontopediatria" 
  | "cirugia" 
  | "rehabilitacion";

export default function SpecialtyWorkspace({ 
  patient, 
  onUpdatePatient,
  onNavigateToSubView
}: SpecialtyWorkspaceProps) {
  // Grab current specialty or default to Periodoncia
  const currentSpecialty: DentalSpecialty = (patient as any).activeSpecialty || "periodoncia";
  
  // Specialty diagnostic data stored inside patient object
  const specData = (patient as any).specialtyData || {};

  const handleSelectSpecialty = (specialty: DentalSpecialty) => {
    onUpdatePatient({
      ...patient,
      activeSpecialty: specialty
    } as any);
  };

  const updateSpecData = (key: string, value: any) => {
    onUpdatePatient({
      ...patient,
      specialtyData: {
        ...specData,
        [key]: value
      }
    } as any);
  };

  // Specialties specifications dictionary
  const SPECIALTIES_INFO = [
    {
      id: "periodoncia",
      name: "Periodoncia & Implantología",
      icon: Activity,
      color: "from-teal-500 to-emerald-600",
      bgDark: "bg-teal-950/25",
      borderDark: "border-teal-500/20",
      description: "Diagnóstico profundo de tejidos de soporte óseo, cálculo de riesgo periodontal PRA e índice O'Leary."
    },
    {
      id: "endodoncia",
      name: "Endodoncia",
      icon: Zap,
      color: "from-amber-500 to-orange-600",
      bgDark: "bg-amber-950/20",
      borderDark: "border-amber-500/20",
      description: "Terapia de conductos radiculares, pruebas de vitalidad pulpar, conductometría clínica y diagnóstico apical."
    },
    {
      id: "ortodoncia",
      name: "Ortodoncia & Ortopedia",
      icon: Layers,
      color: "from-indigo-500 to-blue-600",
      bgDark: "bg-indigo-950/20",
      borderDark: "border-indigo-500/20",
      description: "Análisis oclusal completo, clases de Angle, apiñamientos dentales, overjet & overbite y hábitos funcionales."
    },
    {
      id: "cirugia",
      name: "Cirugía Oral & Maxilofacial",
      icon: Scissors,
      color: "from-rose-500 to-red-600",
      bgDark: "bg-rose-950/15",
      borderDark: "border-rose-500/20",
      description: "Planificación pre-quirúrgica, control de coagulación, osteotomías, suturas e implantes inmediatos."
    },
    {
      id: "rehabilitacion",
      name: "Rehabilitación Oral & Estética",
      icon: Sparkles,
      color: "from-purple-500 to-pink-600",
      bgDark: "bg-purple-950/15",
      borderDark: "border-purple-500/20",
      description: "Reconstrucción estética, carillas de disilicato, coronas de circonio, selección de color Vita y bruxismo."
    },
    {
      id: "odontopediatria",
      name: "Odontopediatría",
      icon: Baby,
      color: "from-sky-500 to-cyan-600",
      bgDark: "bg-sky-950/15",
      borderDark: "border-sky-500/20",
      description: "Control de pacientes infantiles, escala de comportamiento de Frankl, dentición temporal y prevención."
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Dynamic Specialty Badges Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-teal-500" />
            Consola de Especialidades Integradas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Adapte dinámicamente el expediente a su rama clínica. Los datos guardados se consolidarán en la ficha unificada del paciente.
          </p>
        </div>

        {/* Horizontal grid list of specialties */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {SPECIALTIES_INFO.map(spec => {
            const Icon = spec.icon;
            const isActive = currentSpecialty === spec.id;
            return (
              <button
                key={spec.id}
                onClick={() => handleSelectSpecialty(spec.id as DentalSpecialty)}
                className={`relative overflow-hidden p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-3 cursor-pointer group active:scale-[0.98] ${
                  isActive 
                    ? "bg-slate-50/50 dark:bg-slate-950 border-teal-500/40 dark:border-teal-400/50 shadow-md ring-2 ring-teal-500/10" 
                    : "bg-white dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200/90 dark:border-slate-800/65"
                }`}
              >
                {/* Visual Glow background on active tab */}
                {isActive && (
                  <div className={`absolute -right-3 -top-3 w-10 h-10 rounded-full bg-gradient-to-br ${spec.color} opacity-10 blur-md`} />
                )}
                
                <div className="flex items-center justify-between w-full">
                  <div className={`p-2 rounded-xl ${
                    isActive 
                      ? `bg-gradient-to-br ${spec.color} text-white shadow-xs` 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                  } transition-colors`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <span className="flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                    Especialidad
                  </p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">
                    {spec.name.split(" ")[0]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC CONFIGURATION FORM CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Overview & general settings */}
        <div className="space-y-6 col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <div>
              <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-md bg-gradient-to-r text-white ${
                SPECIALTIES_INFO.find(s => s.id === currentSpecialty)?.color
              }`}>
                {currentSpecialty.toUpperCase()} Activo
              </span>
              <h4 className="text-base font-black text-slate-800 dark:text-white mt-3.5">
                {SPECIALTIES_INFO.find(s => s.id === currentSpecialty)?.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {SPECIALTIES_INFO.find(s => s.id === currentSpecialty)?.description}
              </p>
            </div>

            {/* Quick action checklist */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/45 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">💡 Flujo Clínico Recomendado</span>
              Utilice los paneles interactivos de la derecha para registrar el estatus clínico específico. Los diagnósticos emitidos se adjuntarán automáticamente al asistente dental de inteligencia artificial "Dentito" y para exportación A4.
            </div>

            {/* Diagnostic helper badge */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Paciente actual</span>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center justify-between">
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{patient.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">Expediente: #{patient.id}</p>
                </div>
                <div className="bg-teal-500/10 text-teal-600 dark:text-teal-400 p-1.5 rounded-lg text-[10px] font-mono font-bold">
                  {patient.birthdate ? `${new Date().getFullYear() - new Date(patient.birthdate).getFullYear()} Años` : ""}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Dynamic Forms depending on selected specialty */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSpecialty}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-6"
            >
              
              {/* === PERIODONCIA === */}
              {currentSpecialty === "periodoncia" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Flujo Periodontal Pro</h4>
                      <p className="text-xs text-slate-500">Integración biológica completa de bolsas y recesiones.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Clasificación AAP (2018)</span>
                      <select
                        value={specData.perioStage || "Estadio II (Moderado)"}
                        onChange={(e) => updateSpecData("perioStage", e.target.value)}
                        className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl font-medium text-slate-700 dark:text-slate-300"
                      >
                        <option value="Estadio I (Periodontitis Inicial)">Estadio I (Periodontitis Inicial)</option>
                        <option value="Estadio II (Periodontitis Moderada)">Estadio II (Periodontitis Moderada)</option>
                        <option value="Estadio III (Severa con Riesgo de Pérdida)">Estadio III (Severa con Riesgo de Pérdida)</option>
                        <option value="Estadio IV (Avanzada / Colapso Funcional)">Estadio IV (Avanzada / Colapso Funcional)</option>
                      </select>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Grado de Progresión</span>
                      <select
                        value={specData.perioGrade || "Grado B (Moderada)"}
                        onChange={(e) => updateSpecData("perioGrade", e.target.value)}
                        className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl font-medium text-slate-700 dark:text-slate-300"
                      >
                        <option value="Grado A (Progresión Lenta/Estable)">Grado A (Progresión Lenta/Estable)</option>
                        <option value="Grado B (Progresión Moderada)">Grado B (Progresión Moderada)</option>
                        <option value="Grado C (Progresión Rápida / Alto Riesgo)">Grado C (Progresión Rápida / Alto Riesgo)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/55 dark:border-slate-800 space-y-4">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Navegación Periodontal Directa</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      La periodoncia está integrada de forma nativa mediante interfaces clínicas avanzadas a 6 puntos biométricos por diente, indicador acumulativo de placa bacteriana y matriz predictiva de riesgo PRA.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/60">
                      <button 
                        onClick={() => onNavigateToSubView("periodontograma")}
                        className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        Ver Periodontograma <ChevronRight className="w-3" />
                      </button>
                      <button 
                        onClick={() => onNavigateToSubView("pra")}
                        className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-250 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        Análisis PRA <ChevronRight className="w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* === ENDODONCIA === */}
              {currentSpecialty === "endodoncia" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Diagnóstico y Terapia de Conductos Radiculares</h4>
                      <p className="text-xs text-slate-500 font-normal">Registro de conductometría, pruebas de respuesta pulpar y periapical.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Diagnostic tests block */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3.5">
                      <span className="text-[10px] font-extrabold text-amber-500 uppercase block tracking-wider">Pruebas de Vitalidad de la Pieza</span>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Respuesta Pulpar Térmica:</label>
                        <select
                          value={specData.endoThermal || "Normal"}
                          onChange={(e) => updateSpecData("endoThermal", e.target.value)}
                          className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Hipersensibilidad Reversible">Hipersensibilidad Reversible (Dolor fugaz)</option>
                          <option value="Hipersensibilidad Irreversible">Hipersensibilidad Irreversible (Dolor prolongado)</option>
                          <option value="Ausencia de Respuesta (Necrosis)">Ausencia de Respuesta (Necrosis)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Percusión Vertical u Horizontal:</label>
                        <select
                          value={specData.endoPercussion || "Negativa"}
                          onChange={(e) => updateSpecData("endoPercussion", e.target.value)}
                          className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                        >
                          <option value="Negativa">Negativa (Normal)</option>
                          <option value="Sensibilidad Leve">Sensibilidad Leve</option>
                          <option value="Sensibilidad Severa (+)">Sensibilidad Severa (+)</option>
                        </select>
                      </div>
                    </div>

                    {/* Conductometria block */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3.5">
                      <span className="text-[10px] font-extrabold text-amber-500 uppercase block tracking-wider">Hoja de Conductometría Clínica</span>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Pieza Dental a Registrar:</label>
                        <input
                          type="number"
                          placeholder="FDI (ej: 11, 26, 47)"
                          value={specData.endoToothNum || ""}
                          onChange={(e) => updateSpecData("endoToothNum", e.target.value)}
                          className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Longitud de Trabajo (LT en mm):</label>
                        <input
                          type="text"
                          placeholder="ej: Vestibular 21mm, Palatino 22.5mm"
                          value={specData.endoLength || ""}
                          onChange={(e) => updateSpecData("endoLength", e.target.value)}
                          className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3">
                    <span className="text-[10px] font-extrabold text-amber-500 uppercase block tracking-wider">Diagnóstico Periapical</span>
                    <div className="space-y-2">
                      <select
                        value={specData.endoApicalStatus || "Tejidos apicales normales"}
                        onChange={(e) => updateSpecData("endoApicalStatus", e.target.value)}
                        className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                      >
                        <option value="Tejidos apicales normales">Tejidos apicales normales</option>
                        <option value="Periodontitis apical sintomática">Periodontitis apical sintomática (Sensibilidad / dolor a la presión)</option>
                        <option value="Periodontitis apical asintomática">Periodontitis apical asintomática (Área radiológica apical / sin dolor)</option>
                        <option value="Absceso alveolar agudo">Absceso alveolar agudo (Infección purulenta localizada con edema)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* === ORTODONCIA === */}
              {currentSpecialty === "ortodoncia" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Análisis de Oclusión y Crecimiento Craneofacial</h4>
                      <p className="text-xs text-slate-500 font-normal font-sans">Diagnóstico oclusal sagital, vertical, transversal y mediciones cefalométricas primarias.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3.5">
                      <span className="text-[10px] font-extrabold text-indigo-500 uppercase block tracking-wider">Clasificación Sagital Posterior (Angle)</span>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Clase Molar Derecha:</label>
                        <select
                          value={specData.orthoMolarRight || "Clase I"}
                          onChange={(e) => updateSpecData("orthoMolarRight", e.target.value)}
                          className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg font-medium"
                        >
                          <option value="Clase I">Clase I (Normoclusión)</option>
                          <option value="Clase II División 1">Clase II División 1 (Protrusión incisivos)</option>
                          <option value="Clase II División 2">Clase II División 2 (Retrusión incisivos)</option>
                          <option value="Clase III">Clase III (Prognatismo mandibular)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Clase Molar Izquierda:</label>
                        <select
                          value={specData.orthoMolarLeft || "Clase I"}
                          onChange={(e) => updateSpecData("orthoMolarLeft", e.target.value)}
                          className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg font-medium"
                        >
                          <option value="Clase I">Clase I</option>
                          <option value="Clase II División 1">Clase II División 1</option>
                          <option value="Clase II División 2">Clase II División 2</option>
                          <option value="Clase III">Clase III</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3.5">
                      <span className="text-[10px] font-extrabold text-indigo-500 uppercase block tracking-wider">Maloclusión Vertical & Transversal</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Overjet (mm):</label>
                          <input
                            type="number"
                            placeholder="Normal: 2mm"
                            value={specData.orthoOverjet || ""}
                            onChange={(e) => updateSpecData("orthoOverjet", e.target.value)}
                            className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Overbite (mm):</label>
                          <input
                            type="number"
                            placeholder="Normal: 2mm"
                            value={specData.orthoOverbite || ""}
                            onChange={(e) => updateSpecData("orthoOverbite", e.target.value)}
                            className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg text-right"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Apiñamiento dental:</label>
                        <select
                          value={specData.orthoCrowding || "Ninguno"}
                          onChange={(e) => updateSpecData("orthoCrowding", e.target.value)}
                          className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                        >
                          <option value="Ninguno">Ninguno</option>
                          <option value="Apiñamiento Leve (< 3mm)">Apiñamiento Leve (&lt; 3mm)</option>
                          <option value="Apiñamiento Moderado (3-5mm)">Apiñamiento Moderado (3-5mm)</option>
                          <option value="Apiñamiento Severo (> 5mm)">Apiñamiento Severo (&gt; 5mm)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === CIRUGIA === */}
              {currentSpecialty === "cirugia" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Planificación de Cirugía Bucal e Implantes</h4>
                      <p className="text-xs text-slate-500 font-normal">Lista de chequeo de seguridad, parámetros de coagulación y densidad ósea.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3.5">
                      <span className="text-[10px] font-extrabold text-rose-500 uppercase block tracking-wider">Lista de Chequeo Pre-Quirúrgica</span>
                      
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={specData.surgConsentSigned || false}
                            onChange={(e) => updateSpecData("surgConsentSigned", e.target.checked)}
                            className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                          />
                          Consentimiento Quirúrgico Firmado
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={specData.surgMedHistoryOk || false}
                            onChange={(e) => updateSpecData("surgMedHistoryOk", e.target.checked)}
                            className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                          />
                          Anamnesis Médica Sin Alertas Críticas
                        </label>
                        
                        <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={specData.surgXraysOnDesk || false}
                            onChange={(e) => updateSpecData("surgXraysOnDesk", e.target.checked)}
                            className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                          />
                          Radiografías / CBCT en Pantalla
                        </label>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3.5 col-span-1">
                      <span className="text-[10px] font-extrabold text-rose-500 uppercase block tracking-wider">Valores de Laboratorio e Insumos</span>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Presión Arterial Sistólica/Diastólica:</label>
                        <input
                          type="text"
                          placeholder="ej: 120/80 mmHg"
                          value={specData.surgBloodPressure || ""}
                          onChange={(e) => updateSpecData("surgBloodPressure", e.target.value)}
                          className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Material de Suture a Utilizar:</label>
                        <select
                          value={specData.surgSuture || "Monofilamento Nylon 4-0"}
                          onChange={(e) => updateSpecData("surgSuture", e.target.value)}
                          className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                        >
                          <option value="Monofilamento Nylon 4-0">Monofilamento Nylon 4-0 (No reabsorbible)</option>
                          <option value="Seda Negra Trenzada 3-0">Seda Negra Trenzada 3-0</option>
                          <option value="Sutura de Ácido Poliglicólico (PGA) 4-0">Ácido Poliglicólico (Reabsorbible)</option>
                          <option value="Vicryl 3-0">Vicryl 3-0 (Ácido poliláctico)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === REHABILITACION === */}
              {currentSpecialty === "rehabilitacion" && (
                <div className="space-y-5 animate-fade-in">
                  <RehabSchema2D patient={patient} onUpdatePatient={onUpdatePatient} />
                </div>
              )}

              {/* === ODONTOPEDIATRIA === */}
              {currentSpecialty === "odontopediatria" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-955/20 dark:text-sky-400">
                      <Baby className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Odontología Pediátrica y Control del Desarrollo</h4>
                      <p className="text-xs text-slate-500 font-normal font-sans">Registro de estatus de desarrollo infantil, escala de Frankl y riesgo de caries.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3.5">
                      <span className="text-[10px] font-extrabold text-sky-500 uppercase block tracking-wider">Escala de Comportamiento Frankl</span>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Clasificación de Cooperatividad:</label>
                        <select
                          value={specData.pediatFrankl || "3 - Positiva"}
                          onChange={(e) => updateSpecData("pediatFrankl", e.target.value)}
                          className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg text-slate-700 font-semibold"
                        >
                          <option value="1 - Definitivamente Negativa">1 - Definitivamente Negativa (Rechazo/Llanto fuerte)</option>
                          <option value="2 - Negativa">2 - Negativa (Cooperación difícil/Tímido)</option>
                          <option value="3 - Positiva">3 - Positiva (Acepta el tratamiento / Colabora)</option>
                          <option value="4 - Definitivamente Positiva">4 - Definitivamente Positiva (Interés por los aparatos / Lúdico)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3 col-span-1">
                      <span className="text-[10px] font-extrabold text-sky-550 uppercase block tracking-wider">Plan de Prevención e Higiene</span>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Nivel de Riesgo de Caries:</label>
                        <select
                          value={specData.pediatCariesRisk || "Bajo"}
                          onChange={(e) => updateSpecData("pediatCariesRisk", e.target.value)}
                          className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                        >
                          <option value="Bajo">Bajo</option>
                          <option value="Moderado">Moderado</option>
                          <option value="Alto (Requiere Barniz de Flúor)">Alto (Requiere Barniz de Flúor)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-200 dark:border-slate-800/60 flex items-start gap-3">
                    <Info className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Nota de Dentición Primaria</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                        Para registrar caries en dientes de leche, utilice los cuadrantes infantiles 5, 6, 7 y 8 en el Odontograma Gráfico principal. "Dentito Co-Piloto" detectará de forma automática el perfil de dentición temporal del paciente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SAVING ACKOWLEDGEMENT */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span className="italic font-normal">Cambios guardados en tiempo real.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Quick confirm and go back to SOAP or Print view
                    onNavigateToSubView("soap");
                  }}
                  className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 text-xs px-4 py-2 rounded-xl transition-all font-bold cursor-pointer border border-slate-200 dark:border-slate-700/80 active:scale-98"
                >
                  Continuar al SOAP AI
                </button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Specialty Tools Suite Component */}
      <div className="pt-4">
        <SpecialtyToolsSuite 
          patient={patient}
          onUpdatePatient={onUpdatePatient}
          activeSpecialtyDefault={currentSpecialty}
        />
      </div>
    </div>
  );
}
