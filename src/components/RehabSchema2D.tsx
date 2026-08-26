import React, { useState } from "react";
import { Patient } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Ruler,
  Layers,
  Activity,
  Award,
  Compass,
  Check,
  Copy,
  Sparkles,
  RotateCcw,
  Info,
  ShieldAlert,
  ChevronRight,
  Zap,
  Sliders,
  FileText,
  AlertTriangle,
  Eye,
  Plus,
  Trash2,
  Crosshair,
  CheckCircle2,
  HelpCircle,
  ArrowUpRight
} from "lucide-react";

export interface RehabSchemaState {
  activeModule: "dvo_sagittal" | "occlu_check" | "pillar_score" | "prostho_map" | "ppr_kennedy";
  
  // 1. DVO & Sagittal Grid
  dvoCurrent: number;
  dvoTarget: number;
  dvr: number;
  anteriorGuidance: "optima" | "borde_a_borde" | "mordida_abierta" | "mordida_profunda" | "ausente";
  workingSide: "canina" | "grupo_anterior" | "grupo_posterior" | "interferencia";
  balancingSide: "desoclusion_limpia" | "interferencia_balance";
  centricRelation: "coincide" | "desviacion_anterior" | "desviacion_lateral";
  centricShiftMm: number;
  sagittalNotes: string;

  // 2. OccluCheck 2D
  contacts: Record<number, {
    centric: boolean;
    workingInterference: boolean;
    balancingInterference: boolean;
    wearType: "ninguno" | "atricion_bruxismo" | "abfraccion" | "erosion" | "faceta";
    loadIntensity: "fisiologica" | "sobrecarga_leve" | "hiperoclusion_critica";
  }>;

  // 3. Pillar Score 2D
  pillars: Record<number, {
    isPillar: boolean;
    crownRootRatio: "1:2_optimo" | "1:1.5_aceptable" | "1:1_limite" | "menos_1:1_desfavorable";
    remainingWalls: number;
    postType: "ninguno" | "fibra_vidrio" | "colado" | "preconstruido";
    viability: "excelente" | "aceptable" | "reservado" | "no_apto";
  }>;

  // 4. Prostho Map (FDI 11-48)
  teethRestorations: Record<number, {
    type: "ninguno" | "corona_diente" | "corona_implante" | "carilla" | "incrustacion" | "pontico" | "hibrida" | "provisorio";
    material: "disilicato_emax" | "zirconio_monolitico" | "zirconio_estratificado" | "metal_ceramica" | "pmma" | "resina";
    margin: "chaflan" | "hombro_90" | "bisel" | "feather_edge";
    ferrule: "cumple_1_5mm" | "deficiente" | "alargamiento_necesario";
    shade: string;
  }>;

  // 5. PPR Kennedy 2D
  ppr: {
    arch: "superior" | "inferior";
    kennedyClass: "I" | "II" | "III" | "IV";
    modificationsCount: number;
    majorConnector: "banda_palatina" | "doble_barra_palatina" | "placa_palatina" | "barra_lingual" | "placa_lingual";
    rests: number[];
    directRetainers: Record<number, "dpi_rpi" | "akers" | "roach" | "doble_akers" | "anillo" | "none">;
    fulcrumLineActive: boolean;
    missingTeeth: number[];
    saddleMaterial: "acrilico_rosa" | "malla_metalica" | "flexible_nylon";
    indirectRetainers: number[];
  };
}

const TEETH_FDI_UPPER = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28
];

const TEETH_FDI_LOWER = [
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38
];

const ALL_FDI_TEETH = [...TEETH_FDI_UPPER, ...TEETH_FDI_LOWER];

interface RehabSchema2DProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  onClose?: () => void;
}

export default function RehabSchema2D({ patient, onUpdatePatient }: RehabSchema2DProps) {
  // Initialize state from patient object or defaults
  const initialData: RehabSchemaState = (patient as any).specialtyData?.rehabSchema || {
    activeModule: "dvo_sagittal",
    dvoCurrent: 62,
    dvoTarget: 65,
    dvr: 68,
    anteriorGuidance: "optima",
    workingSide: "canina",
    balancingSide: "desoclusion_limpia",
    centricRelation: "coincide",
    centricShiftMm: 0,
    sagittalNotes: "Paciente presenta perdida de DVO de 3mm por desgaste atricional. Se planifica aumento con carillas e incrustaciones de Disilicato de Litio.",
    contacts: {
      16: { centric: true, workingInterference: false, balancingInterference: false, wearType: "faceta", loadIntensity: "fisiologica" },
      11: { centric: true, workingInterference: false, balancingInterference: false, wearType: "atricion_bruxismo", loadIntensity: "sobrecarga_leve" },
      21: { centric: true, workingInterference: false, balancingInterference: false, wearType: "atricion_bruxismo", loadIntensity: "sobrecarga_leve" },
      26: { centric: true, workingInterference: false, balancingInterference: false, wearType: "ninguno", loadIntensity: "fisiologica" }
    },
    pillars: {
      14: { isPillar: true, crownRootRatio: "1:2_optimo", remainingWalls: 3, postType: "fibra_vidrio", viability: "excelente" },
      24: { isPillar: true, crownRootRatio: "1:1.5_aceptable", remainingWalls: 2, postType: "fibra_vidrio", viability: "aceptable" }
    },
    teethRestorations: {
      16: { type: "corona_implante", material: "zirconio_monolitico", margin: "chaflan", ferrule: "cumple_1_5mm", shade: "A2" },
      11: { type: "carilla", material: "disilicato_emax", margin: "chaflan", ferrule: "cumple_1_5mm", shade: "BL1" },
      21: { type: "carilla", material: "disilicato_emax", margin: "chaflan", ferrule: "cumple_1_5mm", shade: "BL1" },
      26: { type: "corona_diente", material: "disilicato_emax", margin: "hombro_90", ferrule: "cumple_1_5mm", shade: "A2" }
    },
    ppr: {
      arch: "superior",
      kennedyClass: "III",
      modificationsCount: 1,
      majorConnector: "banda_palatina",
      rests: [14, 17, 24, 27],
      directRetainers: {
        14: "dpi_rpi",
        24: "dpi_rpi",
        17: "akers",
        27: "akers"
      },
      fulcrumLineActive: true,
      missingTeeth: [15, 16, 25, 26],
      saddleMaterial: "acrilico_rosa",
      indirectRetainers: [13, 23]
    }
  };

  const [schemaState, setSchemaState] = useState<RehabSchemaState>(initialData);
  const [selectedTooth, setSelectedTooth] = useState<number>(11);
  const [pprToolMode, setPprToolMode] = useState<"brecha" | "apoyo" | "gancho" | "indirecta">("brecha");
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [showAddPillarModal, setShowAddPillarModal] = useState<boolean>(false);

  // Sync back to patient object safely via useEffect
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const existingData = (patient as any).specialtyData || {};
    onUpdatePatient({
      ...patient,
      specialtyData: {
        ...existingData,
        rehabSchema: schemaState
      }
    } as any);
  }, [schemaState]);

  const updateSchemaState = (updater: (prev: RehabSchemaState) => RehabSchemaState) => {
    setSchemaState(updater);
  };

  const activeModule = schemaState.activeModule;

  // Calculate ELI (Espacio Libre Interoclusal)
  const eliTarget = schemaState.dvr - schemaState.dvoTarget;
  const dvoIncrease = schemaState.dvoTarget - schemaState.dvoCurrent;

  // Copy clinical summary report
  const handleCopyReport = () => {
    const lines = [
      `==================================================`,
      `PERIODASH - ESQUEMA BIOMECÁNICO Y OCLUSAL 2D`,
      `Paciente: ${patient.name} | Fecha: ${new Date().toLocaleDateString()}`,
      `==================================================`,
      ``,
      `1. OCLUSIÓN Y DIMENSIÓN VERTICAL (DVO):`,
      `- DVO Actual: ${schemaState.dvoCurrent} mm | DVO Objetivo: ${schemaState.dvoTarget} mm (Aumento: ${dvoIncrease > 0 ? `+${dvoIncrease}` : dvoIncrease} mm)`,
      `- DVR (Reposo): ${schemaState.dvr} mm | ELI Resultante: ${eliTarget} mm (Fisiológico: 2-4 mm)`,
      `- Guía Anterior: ${schemaState.anteriorGuidance.toUpperCase()}`,
      `- Lado de Trabajo: ${schemaState.workingSide.toUpperCase()} | Lado de Balance: ${schemaState.balancingSide.toUpperCase()}`,
      `- Relación Céntrica: ${schemaState.centricRelation.toUpperCase()} (${schemaState.centricShiftMm} mm)`,
      `- Observaciones: ${schemaState.sagittalNotes}`,
      ``,
      `2. CONTACTOS OCLUSALES Y CARGAS (OccluCheck 2D):`,
      `- Contactos en Céntrica Registrados: ${Object.values(schemaState.contacts).filter(c => c.centric).length} Piezas`,
      `- Interferencias Excéntricas: ${Object.values(schemaState.contacts).filter(c => c.balancingInterference || c.workingInterference).length} Puntos Críticos`,
      ...Object.entries(schemaState.contacts).filter(([, c]) => c.centric || c.balancingInterference || c.workingInterference).map(([t, c]) => 
        `  * Pieza ${t}: Céntrica: ${c.centric ? "SÍ" : "NO"} | Interferencia Trabajo: ${c.workingInterference ? "SÍ" : "NO"} | Interferencia Balance: ${c.balancingInterference ? "SÍ" : "NO"} | Desgaste: ${c.wearType.toUpperCase()}`
      ),
      ``,
      `3. BIOMECÁNICA DE PILARES (Pillar-Score 2D):`,
      ...Object.entries(schemaState.pillars).filter(([, p]) => p.isPillar).map(([tooth, p]) =>
        `  * Pilar ${tooth}: Relación C/R ${p.crownRootRatio.replace(/_/g, " ")} | Paredes: ${p.remainingWalls}/4 | Perno: ${p.postType} | Viabilidad: ${p.viability.toUpperCase()}`
      ),
      ``,
      `4. MAPEO DE RESTAURACIONES PROSTÓDICAS:`,
      ...Object.entries(schemaState.teethRestorations).filter(([, r]) => r.type !== "ninguno").map(([tooth, data]) => 
        `  * Pieza ${tooth}: ${data.type.replace(/_/g, " ").toUpperCase()} | Mat: ${data.material.replace(/_/g, " ").toUpperCase()} | Color: ${data.shade} | Margen: ${data.margin}`
      ),
      ``,
      `5. DISEÑO DE PRÓTESIS PARCIAL REMOVIBLE (PPR 2D):`,
      `- Arcada: ${schemaState.ppr.arch === "inferior" ? "Mandibular Inferior" : "Maxilar Superior"}`,
      `- Clasificación de Kennedy: Clase ${schemaState.ppr.kennedyClass} Modificación ${schemaState.ppr.modificationsCount}`,
      `- Conector Mayor: ${schemaState.ppr.majorConnector.replace(/_/g, " ").toUpperCase()}`,
      `- Material de Silla / Base: ${(schemaState.ppr.saddleMaterial || "acrilico_rosa").replace(/_/g, " ").toUpperCase()}`,
      `- Piezas Ausentes (Brechas): ${(schemaState.ppr.missingTeeth || []).join(", ") || "Ninguna"}`,
      `- Apoyos Oclusales/Cingulares: ${schemaState.ppr.rests.join(", ") || "Ninguno"}`,
      `- Retenedores Directos (Ganchos): ${Object.entries(schemaState.ppr.directRetainers).filter(([, r]) => r !== "none").map(([t, r]) => `#${t}: ${r.toUpperCase()}`).join(" | ") || "Ninguno"}`,
      `- Retención Indirecta: ${(schemaState.ppr.indirectRetainers || []).join(", ") || "No requerida"}`,
      `- Línea de Fulcro: ${schemaState.ppr.fulcrumLineActive ? "Activa y Evaluada" : "Inactiva"}`,
      `==================================================`
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER BAR */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Ruler className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                Estación 2D Especializada
              </span>
              <span className="text-[10px] font-bold text-slate-400">Rehabilitación & Prótesis</span>
            </div>
            <h2 className="font-display font-black text-xl text-slate-900 dark:text-white mt-0.5">
              Esquema Biomecánico y Oclusal
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              copiedReport
                ? "bg-emerald-600 text-white"
                : "bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300"
            }`}
          >
            {copiedReport ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedReport ? "Copiado a Ficha" : "Copiar Informe Clínico"}
          </button>
        </div>
      </div>

      {/* LOGICAL WORKFLOW SUB-MODULE TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "dvo_sagittal", title: "1. DVO & Plano Sagital", icon: Ruler, color: "text-amber-500 bg-amber-500/10" },
          { id: "occlu_check", title: "2. Contactos Oclusales", icon: Activity, color: "text-emerald-500 bg-emerald-500/10" },
          { id: "pillar_score", title: "3. Biomecánica de Pilares", icon: Award, color: "text-indigo-500 bg-indigo-500/10" },
          { id: "prostho_map", title: "4. Mapeo de Restauraciones", icon: Layers, color: "text-teal-500 bg-teal-500/10" },
          { id: "ppr_kennedy", title: "5. Diseñador PPR 2D", icon: Compass, color: "text-purple-500 bg-purple-500/10" }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeModule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => updateSchemaState((prev) => ({ ...prev, activeModule: tab.id as any }))}
              className={`px-4 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2.5 ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-teal-500 dark:text-slate-950 border-transparent shadow-lg scale-102 font-black"
                  : "bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isActive ? "bg-white/20 dark:bg-black/20" : tab.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              {tab.title}
            </button>
          );
        })}
      </div>

      {/* MODULE CONTENT CONTAINER */}
      <AnimatePresence mode="wait">
        {/* ========================================================= */}
        {/* MODULE 1: DVO, PLANO OCLUSAL Y CÉNTRICA */}
        {/* ========================================================= */}
        {activeModule === "dvo_sagittal" && (
          <motion.div
            key="dvo_sagittal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* LEFT 7 COLS: VECTOR GRAPHIC & SLIDERS */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-amber-500" />
                    Análisis de Dimensión Vertical & Perfil Sagital 2D
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ajuste micrométrico de DVO, DVR y Espacio Libre Interoclusal (ELI)
                  </p>
                </div>

                {/* FAST DVO PRESETS */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                  <button
                    onClick={() => updateSchemaState((prev) => ({ ...prev, dvoTarget: prev.dvoCurrent + 3, dvr: prev.dvoCurrent + 6 }))}
                    className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    +3mm Atrición
                  </button>
                  <button
                    onClick={() => updateSchemaState((prev) => ({ ...prev, dvoTarget: prev.dvoCurrent + 5, dvr: prev.dvoCurrent + 8 }))}
                    className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    +5mm Profunda
                  </button>
                  <button
                    onClick={() => updateSchemaState((prev) => ({ ...prev, dvoTarget: prev.dvoCurrent, dvr: prev.dvoCurrent + 3 }))}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Ajuste 1:1
                  </button>
                </div>
              </div>

              {/* SVG SAGITTAL DIAGRAM */}
              <div className="bg-slate-950 rounded-2xl p-6 relative overflow-hidden border border-slate-800 flex flex-col items-center justify-center min-h-[260px]">
                <svg viewBox="0 0 400 240" className="w-full max-w-md h-auto">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="gridSagittal" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(20,184,166,0.08)" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="400" height="240" fill="url(#gridSagittal)" />

                  {/* Profile Silhouette */}
                  <path
                    d="M 100 20 Q 140 30 150 70 Q 160 90 175 105 Q 165 115 170 125 Q 155 135 160 150 Q 140 180 130 220"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                  />

                  {/* Camper Line (SNA to Tragus) */}
                  <line x1="60" y1="90" x2="280" y2="120" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
                  <text x="285" y="124" fill="#f59e0b" fontSize="10" fontWeight="bold">Plano de Camper</text>

                  {/* Bipupillar / Occlusal Plane */}
                  <line x1="80" y1="130" x2="300" y2="130" stroke="#10b981" strokeWidth="2.5" />
                  <text x="305" y="134" fill="#10b981" fontSize="10" fontWeight="bold">Plano Oclusal (0°)</text>

                  {/* DVO Measuring Vector */}
                  <line x1="200" y1="90" x2="200" y2="180" stroke="#2dd4bf" strokeWidth="2" />
                  <circle cx="200" cy="90" r="4" fill="#2dd4bf" />
                  <circle cx="200" cy="180" r="4" fill="#2dd4bf" />
                  <text x="210" y="140" fill="#2dd4bf" fontSize="12" fontWeight="bold">
                    DVO: {schemaState.dvoTarget} mm
                  </text>

                  {/* ELI Gap Indicator */}
                  <rect x="180" y="172" width="40" height={Math.max(4, eliTarget * 2)} fill="rgba(244,63,94,0.3)" stroke="#f43f5e" strokeWidth="1" rx="2" />
                  <text x="225" y="178" fill="#f43f5e" fontSize="9" fontWeight="bold">ELI: {eliTarget} mm</text>
                </svg>

                <div className="absolute bottom-3 right-3 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10.5px]">
                  <span className="text-amber-400 font-bold">Δ DVO: {dvoIncrease > 0 ? `+${dvoIncrease}` : dvoIncrease} mm</span>
                  <span className="text-slate-500">|</span>
                  <span className={eliTarget >= 2 && eliTarget <= 4 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    ELI: {eliTarget} mm ({eliTarget >= 2 && eliTarget <= 4 ? "Óptimo 2-4mm" : "Revisar Límite"})
                  </span>
                </div>
              </div>

              {/* DYNAMIC RECOMMENDATION BANNER */}
              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs font-medium ${
                eliTarget >= 2 && eliTarget <= 4
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : eliTarget < 2
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
              }`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {eliTarget >= 2 && eliTarget <= 4
                      ? "ELI Fisiológico Óptimo (2-4 mm)"
                      : eliTarget < 2
                      ? "Atención: ELI Insuficiente (< 2 mm)"
                      : "Atención: ELI Excesivo (> 4 mm)"}
                  </span>
                  <p className="opacity-90 text-[11px] mt-0.5">
                    {eliTarget >= 2 && eliTarget <= 4
                      ? "El espacio libre interoclusal se encuentra en rango biológico seguro para la articulación temporomandibular y musculatura maseterina."
                      : eliTarget < 2
                      ? "Existe riesgo de hipertonía muscular y contactos continuos durante el habla por invasión del espacio de reposo."
                      : "El espacio interoclusal es amplio. Posible pérdida excesiva de dimensión vertical que requiere reconstrucción oclusal."}
                  </p>
                </div>
              </div>

              {/* SLIDERS FOR DVO / DVR */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    DVO Actual (mm)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="50"
                      max="80"
                      value={schemaState.dvoCurrent}
                      onChange={(e) => updateSchemaState((prev) => ({ ...prev, dvoCurrent: Number(e.target.value) }))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-sm text-amber-500 w-10 text-right">{schemaState.dvoCurrent}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    DVO Objetivo (mm)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="50"
                      max="80"
                      value={schemaState.dvoTarget}
                      onChange={(e) => updateSchemaState((prev) => ({ ...prev, dvoTarget: Number(e.target.value) }))}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-sm text-teal-400 w-10 text-right">{schemaState.dvoTarget}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    DVR Reposo (mm)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="52"
                      max="85"
                      value={schemaState.dvr}
                      onChange={(e) => updateSchemaState((prev) => ({ ...prev, dvr: Number(e.target.value) }))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-sm text-indigo-400 w-10 text-right">{schemaState.dvr}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLS: DYNAMICAL FUNCTIONAL CONTROLS */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
              <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Parámetros Oclusales y Dinámica Mandibular
              </h4>

              {/* Guia Anterior */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Guía Anterior:</label>
                <select
                  value={schemaState.anteriorGuidance}
                  onChange={(e) => updateSchemaState((prev) => ({ ...prev, anteriorGuidance: e.target.value as any }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-900 dark:text-white"
                >
                  <option value="optima">Óptima (Desoclusión Incisiva Limpia)</option>
                  <option value="borde_a_borde">Borde a Borde (Abrasión)</option>
                  <option value="mordida_abierta">Mordida Abierta Anterior</option>
                  <option value="mordida_profunda">Mordida Profunda (Sobremordida &gt;70%)</option>
                  <option value="ausente">Ausente / Pérdida de Acople</option>
                </select>
              </div>

              {/* Lado de Trabajo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Lado de Trabajo (Lateralidad):</label>
                <select
                  value={schemaState.workingSide}
                  onChange={(e) => updateSchemaState((prev) => ({ ...prev, workingSide: e.target.value as any }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-900 dark:text-white"
                >
                  <option value="canina">Guía Canina Pura (Mutuamente Protegida)</option>
                  <option value="grupo_anterior">Función de Grupo Anterior</option>
                  <option value="grupo_posterior">Función de Grupo Posterior</option>
                  <option value="interferencia">Interferencia en Lado de Trabajo</option>
                </select>
              </div>

              {/* Relacion Centrica */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Relación Céntrica (RC vs MIC):</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={schemaState.centricRelation}
                    onChange={(e) => updateSchemaState((prev) => ({ ...prev, centricRelation: e.target.value as any }))}
                    className="p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-900 dark:text-white"
                  >
                    <option value="coincide">Coincide RC = MIC</option>
                    <option value="desviacion_anterior">Desviación Anterior</option>
                    <option value="desviacion_lateral">Desviación Lateral</option>
                  </select>

                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Desv:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={schemaState.centricShiftMm}
                      onChange={(e) => updateSchemaState((prev) => ({ ...prev, centricShiftMm: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-transparent font-mono text-xs font-bold text-teal-500 outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">mm</span>
                  </div>
                </div>
              </div>

              {/* Sagittal Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Observaciones Cefalométricas y DVO:</label>
                <textarea
                  rows={3}
                  value={schemaState.sagittalNotes}
                  onChange={(e) => updateSchemaState((prev) => ({ ...prev, sagittalNotes: e.target.value }))}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none text-slate-900 dark:text-white"
                  placeholder="Detalles sobre desprogramación articular, jig de Lucia, etc..."
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODULE 2: MAPA DE CONTACTOS OCLUSALES (OCCLUCHECK 2D) */}
        {/* ========================================================= */}
        {activeModule === "occlu_check" && (
          <motion.div
            key="occlu_check"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* LEFT 8 COLS: BOTH UPPER AND LOWER ARCH CONTACT MAP */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Mapa de Contactos Oclusales OccluCheck 2D (FDI 11-48)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Selecciona una pieza dental para configurar contactos en céntrica (Azul) o interferencias excéntricas (Rojo)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Mark posterior teeth in centric
                      const updated: Record<number, any> = { ...schemaState.contacts };
                      [17, 16, 15, 14, 24, 25, 26, 27, 47, 46, 45, 44, 34, 35, 36, 37].forEach((t) => {
                        updated[t] = {
                          centric: true,
                          workingInterference: false,
                          balancingInterference: false,
                          wearType: updated[t]?.wearType || "ninguno",
                          loadIntensity: updated[t]?.loadIntensity || "fisiologica"
                        };
                      });
                      updateSchemaState((prev) => ({ ...prev, contacts: updated }));
                    }}
                    className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer"
                  >
                    + Céntrica Posteriores
                  </button>
                  <button
                    onClick={() => updateSchemaState((prev) => ({ ...prev, contacts: {} }))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer"
                  >
                    Limpiar Todo
                  </button>
                </div>
              </div>

              {/* UPPER ARCH GRID (18 - 28) */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Arcada Superior (FDI 18 - 28)</span>
                <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 overflow-x-auto pb-1">
                  {TEETH_FDI_UPPER.map((tooth) => {
                    const contact = schemaState.contacts[tooth];
                    const isSelected = selectedTooth === tooth;
                    return (
                      <button
                        key={tooth}
                        onClick={() => setSelectedTooth(tooth)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-between min-h-[64px] cursor-pointer transition-all ${
                          isSelected
                            ? "bg-teal-500 text-slate-950 border-teal-300 shadow-md scale-105 font-bold"
                            : contact?.balancingInterference || contact?.workingInterference
                            ? "bg-rose-950/60 border-rose-500 text-rose-300"
                            : contact?.centric
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500/40"
                        }`}
                      >
                        <span className="font-mono text-[10px] font-bold">{tooth}</span>
                        <div className="flex items-center gap-1 my-1">
                          {contact?.centric && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" title="Contacto Céntrico" />}
                          {contact?.balancingInterference && <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" title="Interferencia de Balance" />}
                          {contact?.workingInterference && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" title="Interferencia de Trabajo" />}
                        </div>
                        <span className="text-[8px] font-bold uppercase">{contact?.wearType && contact.wearType !== "ninguno" ? contact.wearType.slice(0, 3) : "—"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LOWER ARCH GRID (48 - 38) */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Arcada Inferior (FDI 48 - 38)</span>
                <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 overflow-x-auto pb-1">
                  {TEETH_FDI_LOWER.map((tooth) => {
                    const contact = schemaState.contacts[tooth];
                    const isSelected = selectedTooth === tooth;
                    return (
                      <button
                        key={tooth}
                        onClick={() => setSelectedTooth(tooth)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-between min-h-[64px] cursor-pointer transition-all ${
                          isSelected
                            ? "bg-teal-500 text-slate-950 border-teal-300 shadow-md scale-105 font-bold"
                            : contact?.balancingInterference || contact?.workingInterference
                            ? "bg-rose-950/60 border-rose-500 text-rose-300"
                            : contact?.centric
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500/40"
                        }`}
                      >
                        <span className="font-mono text-[10px] font-bold">{tooth}</span>
                        <div className="flex items-center gap-1 my-1">
                          {contact?.centric && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" title="Contacto Céntrico" />}
                          {contact?.balancingInterference && <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" title="Interferencia de Balance" />}
                          {contact?.workingInterference && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" title="Interferencia de Trabajo" />}
                        </div>
                        <span className="text-[8px] font-bold uppercase">{contact?.wearType && contact.wearType !== "ninguno" ? contact.wearType.slice(0, 3) : "—"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TOOTH OCCLUSAL CONTACT CONFIGURATOR DRAWER */}
              {selectedTooth && (
                <div className="p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-teal-500 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
                        Pieza #{selectedTooth}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Configuración de Puntos Oclusales y Cargas
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                        <input
                          type="checkbox"
                          checked={schemaState.contacts[selectedTooth]?.centric || false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateSchemaState((prev) => ({
                              ...prev,
                              contacts: {
                                ...prev.contacts,
                                [selectedTooth]: {
                                  ...(prev.contacts[selectedTooth] || { workingInterference: false, balancingInterference: false, wearType: "ninguno", loadIntensity: "fisiologica" }),
                                  centric: val
                                }
                              }
                            }));
                          }}
                          className="accent-cyan-400 cursor-pointer"
                        />
                        Contacto Céntrico (MIC)
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {/* Interferencias */}
                    <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-slate-400 uppercase text-[10px] block">Interferencias Excéntricas:</span>
                      
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={schemaState.contacts[selectedTooth]?.workingInterference || false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateSchemaState((prev) => ({
                              ...prev,
                              contacts: {
                                ...prev.contacts,
                                [selectedTooth]: {
                                  ...(prev.contacts[selectedTooth] || { centric: false, balancingInterference: false, wearType: "ninguno", loadIntensity: "fisiologica" }),
                                  workingInterference: val
                                }
                              }
                            }));
                          }}
                          className="accent-amber-400 cursor-pointer"
                        />
                        Interferencia en Trabajo
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-rose-500 dark:text-rose-400">
                        <input
                          type="checkbox"
                          checked={schemaState.contacts[selectedTooth]?.balancingInterference || false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateSchemaState((prev) => ({
                              ...prev,
                              contacts: {
                                ...prev.contacts,
                                [selectedTooth]: {
                                  ...(prev.contacts[selectedTooth] || { centric: false, workingInterference: false, wearType: "ninguno", loadIntensity: "fisiologica" }),
                                  balancingInterference: val
                                }
                              }
                            }));
                          }}
                          className="accent-rose-500 cursor-pointer"
                        />
                        Interferencia en Balance (Crítica)
                      </label>
                    </div>

                    {/* Desgastes */}
                    <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="font-bold text-slate-400 uppercase text-[10px] block">Patrón de Desgaste:</label>
                      <select
                        value={schemaState.contacts[selectedTooth]?.wearType || "ninguno"}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          updateSchemaState((prev) => ({
                            ...prev,
                            contacts: {
                              ...prev.contacts,
                              [selectedTooth]: {
                                ...(prev.contacts[selectedTooth] || { centric: false, workingInterference: false, balancingInterference: false, loadIntensity: "fisiologica" }),
                                wearType: val
                              }
                            }
                          }));
                        }}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none text-slate-800 dark:text-slate-200"
                      >
                        <option value="ninguno">Sin Desgaste Visible</option>
                        <option value="atricion_bruxismo">Atrición Abrasiva (Bruxismo)</option>
                        <option value="abfraccion">Abfracción Cervical Cuña</option>
                        <option value="erosion">Erosión Química / Ácida</option>
                        <option value="faceta">Faceta Oclusal Brillante</option>
                      </select>
                    </div>

                    {/* Carga Mecanica */}
                    <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="font-bold text-slate-400 uppercase text-[10px] block">Intensidad de Carga:</label>
                      <select
                        value={schemaState.contacts[selectedTooth]?.loadIntensity || "fisiologica"}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          updateSchemaState((prev) => ({
                            ...prev,
                            contacts: {
                              ...prev.contacts,
                              [selectedTooth]: {
                                ...(prev.contacts[selectedTooth] || { centric: false, workingInterference: false, balancingInterference: false, wearType: "ninguno" }),
                                loadIntensity: val
                              }
                            }
                          }));
                        }}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none text-slate-800 dark:text-slate-200"
                      >
                        <option value="fisiologica">Fisiológica Normal</option>
                        <option value="sobrecarga_leve">Sobrecarga Leve (&gt;100 µm)</option>
                        <option value="hiperoclusion_critica">Hiperoclusión Crítica (&gt;200 µm)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT 4 COLS: SYSTEM OCCLUSAL SUMMARY */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                Diagnóstico Oclusal 2D
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-mono">
                  OccluCheck
                </span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-teal-500/10 border border-teal-500/20 rounded-2xl space-y-1">
                  <span className="font-bold text-teal-400 block text-[11px]">Contactos Céntricos Totales:</span>
                  <span className="font-mono text-xl font-black text-teal-300">
                    {Object.values(schemaState.contacts).filter((c) => c.centric).length} Piezas Activas
                  </span>
                </div>

                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
                  <span className="font-bold text-rose-400 block text-[11px]">Interferencias de Balance:</span>
                  <span className="font-mono text-xl font-black text-rose-300">
                    {Object.values(schemaState.contacts).filter((c) => c.balancingInterference).length} Puntos Críticos
                  </span>
                </div>

                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1">
                  <span className="font-bold text-amber-400 block text-[11px]">Piezas con Desgaste Activo:</span>
                  <span className="font-mono text-xl font-black text-amber-300">
                    {Object.values(schemaState.contacts).filter((c) => c.wearType && c.wearType !== "ninguno").length} Piezas
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODULE 3: BIOMECÁNICA DEL PILAR (PILLAR-SCORE 2D) */}
        {/* ========================================================= */}
        {activeModule === "pillar_score" && (
          <motion.div
            key="pillar_score"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-500" />
                  Evaluación Biomecánica de Pilares (Pillar-Score 2D)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Análisis de relación corona/raíz, paredes remanentes, pernos y viabilidad de soporte
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddPillarModal(!showAddPillarModal)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  + Definir Nuevo Pilar Dental
                </button>
              </div>
            </div>

            {/* QUICK ADD PILLAR SELECTOR MODAL / PANEL */}
            {showAddPillarModal && (
              <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-indigo-300 block">
                  Selecciona la pieza dental (FDI 11-48) para activar evaluación de pilar:
                </span>
                <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
                  {ALL_FDI_TEETH.map((tooth) => {
                    const isPillar = schemaState.pillars[tooth]?.isPillar;
                    return (
                      <button
                        key={`add-p-${tooth}`}
                        onClick={() => {
                          updateSchemaState((prev) => ({
                            ...prev,
                            pillars: {
                              ...prev.pillars,
                              [tooth]: {
                                isPillar: !isPillar,
                                crownRootRatio: prev.pillars[tooth]?.crownRootRatio || "1:2_optimo",
                                remainingWalls: prev.pillars[tooth]?.remainingWalls ?? 3,
                                postType: prev.pillars[tooth]?.postType || "ninguno",
                                viability: prev.pillars[tooth]?.viability || "excelente"
                              }
                            }
                          }));
                        }}
                        className={`p-2 rounded-xl border font-mono text-xs font-bold cursor-pointer transition-all ${
                          isPillar
                            ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500"
                        }`}
                      >
                        #{tooth}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ACTIVE PILLARS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(schemaState.pillars).filter(([, p]) => p.isPillar).map(([toothStr, pillar]) => {
                const tooth = Number(toothStr);

                return (
                  <div
                    key={`pillar-card-${tooth}`}
                    className="p-5 bg-slate-50 dark:bg-slate-800 border border-indigo-500/30 rounded-2xl space-y-3 transition-all hover:border-indigo-500/60 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="font-mono font-bold text-sm text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                        Pilar #{tooth}
                      </span>
                      <button
                        onClick={() => {
                          updateSchemaState((prev) => ({
                            ...prev,
                            pillars: {
                              ...prev.pillars,
                              [tooth]: {
                                ...pillar,
                                isPillar: false
                              }
                            }
                          }));
                        }}
                        className="text-slate-400 hover:text-rose-500 text-xs font-bold cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">Relación Corona / Raíz:</label>
                        <select
                          value={pillar.crownRootRatio}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            updateSchemaState((prev) => ({
                              ...prev,
                              pillars: { ...prev.pillars, [tooth]: { ...pillar, crownRootRatio: val } }
                            }));
                          }}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 outline-none"
                        >
                          <option value="1:2_optimo">1:2 Óptimo (Anclaje Robusto)</option>
                          <option value="1:1.5_aceptable">1:1.5 Aceptable</option>
                          <option value="1:1_limite">1:1 Límite Biomecánico</option>
                          <option value="menos_1:1_desfavorable">&lt; 1:1 Desfavorable (Riesgo)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">Paredes Cervicales Remanentes:</label>
                        <select
                          value={pillar.remainingWalls}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateSchemaState((prev) => ({
                              ...prev,
                              pillars: { ...prev.pillars, [tooth]: { ...pillar, remainingWalls: val } }
                            }));
                          }}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 outline-none"
                        >
                          <option value={4}>4 Paredes (Excelente Ferrule)</option>
                          <option value={3}>3 Paredes</option>
                          <option value={2}>2 Paredes (Intermedio)</option>
                          <option value={1}>1 Pared (Riesgo Fracaso)</option>
                          <option value={0}>0 Paredes (Sin Ferrule)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">Anclaje Intrarradicular:</label>
                        <select
                          value={pillar.postType}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            updateSchemaState((prev) => ({
                              ...prev,
                              pillars: { ...prev.pillars, [tooth]: { ...pillar, postType: val } }
                            }));
                          }}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 outline-none"
                        >
                          <option value="ninguno">Sin Perno / Diente Vital</option>
                          <option value="fibra_vidrio">Perno Fibra de Vidrio (Módulo elástico similar)</option>
                          <option value="colado">Núcleo Colado Metálico</option>
                          <option value="preconstruido">Perno Metálico Preconstruido</option>
                        </select>
                      </div>

                      <div className="pt-1 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                        <label className="text-[10px] text-slate-400 font-bold block">Viabilidad:</label>
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                          pillar.viability === "excelente" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                          pillar.viability === "aceptable" ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" :
                          pillar.viability === "reservado" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                          "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}>
                          {pillar.viability}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODULE 4: MAPEO DE RESTAURACIONES Y PROSTODONCIA */}
        {/* ========================================================= */}
        {activeModule === "prostho_map" && (
          <motion.div
            key="prostho_map"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* INTERACTIVE 32 FDI TOOTH GRID */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-500" />
                    Mapeo Prostodóntico por Pieza (FDI 11-48)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Selecciona una pieza para definir tipo de restauración, material, tipo de margen y presencia de ferrule
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-slate-400">Pieza Activa:</span>
                  <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-lg font-mono text-sm">
                    Tooth #{selectedTooth}
                  </span>
                </div>
              </div>

              {/* UPPER ARCH GRID */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Arcada Superior (FDI 18 - 28)</span>
                <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 overflow-x-auto pb-1">
                  {TEETH_FDI_UPPER.map((tooth) => {
                    const resto = schemaState.teethRestorations[tooth];
                    const isSelected = selectedTooth === tooth;
                    const hasResto = resto && resto.type !== "ninguno";
                    return (
                      <button
                        key={tooth}
                        onClick={() => setSelectedTooth(tooth)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-between min-h-[64px] transition-all cursor-pointer ${
                          isSelected
                            ? "bg-teal-500 text-slate-950 border-teal-300 shadow-md scale-105 font-bold"
                            : hasResto
                            ? "bg-teal-950/40 border-teal-500/50 text-teal-300"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500/40"
                        }`}
                      >
                        <span className="font-mono text-[10px] font-bold">{tooth}</span>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black uppercase">
                          {hasResto ? resto.type.slice(0, 2).toUpperCase() : "—"}
                        </div>
                        <span className="text-[8px] opacity-80">{hasResto ? resto.shade : ""}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LOWER ARCH GRID */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Arcada Inferior (FDI 48 - 38)</span>
                <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 overflow-x-auto pb-1">
                  {TEETH_FDI_LOWER.map((tooth) => {
                    const resto = schemaState.teethRestorations[tooth];
                    const isSelected = selectedTooth === tooth;
                    const hasResto = resto && resto.type !== "ninguno";
                    return (
                      <button
                        key={tooth}
                        onClick={() => setSelectedTooth(tooth)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-between min-h-[64px] transition-all cursor-pointer ${
                          isSelected
                            ? "bg-teal-500 text-slate-950 border-teal-300 shadow-md scale-105 font-bold"
                            : hasResto
                            ? "bg-teal-950/40 border-teal-500/50 text-teal-300"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500/40"
                        }`}
                      >
                        <span className="font-mono text-[10px] font-bold">{tooth}</span>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black uppercase">
                          {hasResto ? resto.type.slice(0, 2).toUpperCase() : "—"}
                        </div>
                        <span className="text-[8px] opacity-80">{hasResto ? resto.shade : ""}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TOOTH PROSTHODONTIC CONFIGURATOR PANEL */}
              {selectedTooth && (
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-lg border border-teal-500/20">
                        Pieza #{selectedTooth}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Configuración de Restauración Prostódica
                      </h4>
                    </div>

                    {/* FAST RESTORATION PRESETS */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                      <button
                        onClick={() => {
                          updateSchemaState((prev) => ({
                            ...prev,
                            teethRestorations: {
                              ...prev.teethRestorations,
                              [selectedTooth]: { type: "corona_diente", material: "disilicato_emax", margin: "chaflan", ferrule: "cumple_1_5mm", shade: "A2" }
                            }
                          }));
                        }}
                        className="px-2 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-md text-[10px] font-bold cursor-pointer"
                      >
                        Corona Disilicato A2
                      </button>
                      <button
                        onClick={() => {
                          updateSchemaState((prev) => ({
                            ...prev,
                            teethRestorations: {
                              ...prev.teethRestorations,
                              [selectedTooth]: { type: "carilla", material: "disilicato_emax", margin: "chaflan", ferrule: "cumple_1_5mm", shade: "BL1" }
                            }
                          }));
                        }}
                        className="px-2 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-md text-[10px] font-bold cursor-pointer"
                      >
                        Carilla e.max BL1
                      </button>
                      <button
                        onClick={() => {
                          updateSchemaState((prev) => ({
                            ...prev,
                            teethRestorations: {
                              ...prev.teethRestorations,
                              [selectedTooth]: { type: "corona_implante", material: "zirconio_monolitico", margin: "chaflan", ferrule: "cumple_1_5mm", shade: "A2" }
                            }
                          }));
                        }}
                        className="px-2 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-md text-[10px] font-bold cursor-pointer"
                      >
                        Corona S/Implante Zirconio
                      </button>
                      <button
                        onClick={() => {
                          updateSchemaState((prev) => ({
                            ...prev,
                            teethRestorations: {
                              ...prev.teethRestorations,
                              [selectedTooth]: { type: "ninguno", material: "disilicato_emax", margin: "chaflan", ferrule: "cumple_1_5mm", shade: "A2" }
                            }
                          }));
                        }}
                        className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-bold cursor-pointer"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
                    {/* Tipo de Restauracion */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-500 dark:text-slate-400 block">Tipo Restauración:</label>
                      <select
                        value={schemaState.teethRestorations[selectedTooth]?.type || "ninguno"}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          updateSchemaState((prev) => ({
                            ...prev,
                            teethRestorations: {
                              ...prev.teethRestorations,
                              [selectedTooth]: {
                                type: val,
                                material: prev.teethRestorations[selectedTooth]?.material || "disilicato_emax",
                                margin: prev.teethRestorations[selectedTooth]?.margin || "chaflan",
                                ferrule: prev.teethRestorations[selectedTooth]?.ferrule || "cumple_1_5mm",
                                shade: prev.teethRestorations[selectedTooth]?.shade || "A2"
                              }
                            }
                          }));
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-900 dark:text-white"
                      >
                        <option value="ninguno">Sin Restauración</option>
                        <option value="corona_diente">Corona S/ Diente</option>
                        <option value="corona_implante">Corona S/ Implante</option>
                        <option value="carilla">Carilla Estética</option>
                        <option value="incrustacion">Inlay / Onlay / Overlay</option>
                        <option value="pontico">Póntico de Puente</option>
                        <option value="hibrida">Prótesis Híbrida / All-on-X</option>
                        <option value="provisorio">Provisorio de Acrílico/PMMA</option>
                      </select>
                    </div>

                    {/* Material */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-500 dark:text-slate-400 block">Material Restaurador:</label>
                      <select
                        value={schemaState.teethRestorations[selectedTooth]?.material || "disilicato_emax"}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          updateSchemaState((prev) => ({
                            ...prev,
                            teethRestorations: {
                              ...prev.teethRestorations,
                              [selectedTooth]: {
                                ...(prev.teethRestorations[selectedTooth] || { type: "corona_diente", margin: "chaflan", ferrule: "cumple_1_5mm", shade: "A2" }),
                                material: val
                              }
                            }
                          }));
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-900 dark:text-white"
                      >
                        <option value="disilicato_emax">Disilicato de Litio (e.max)</option>
                        <option value="zirconio_monolitico">Zirconio Monolítico Multicapa</option>
                        <option value="zirconio_estratificado">Zirconio Estratificado con Porcelana</option>
                        <option value="metal_ceramica">Metal-Cerámica Tradicional</option>
                        <option value="pmma">PMMA Maquinado CAD/CAM</option>
                        <option value="resina">Resina Compuesta / Nanohíbrida</option>
                      </select>
                    </div>

                    {/* Margen */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-500 dark:text-slate-400 block">Línea de Terminación:</label>
                      <select
                        value={schemaState.teethRestorations[selectedTooth]?.margin || "chaflan"}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          updateSchemaState((prev) => ({
                            ...prev,
                            teethRestorations: {
                              ...prev.teethRestorations,
                              [selectedTooth]: {
                                ...(prev.teethRestorations[selectedTooth] || { type: "corona_diente", material: "disilicato_emax", ferrule: "cumple_1_5mm", shade: "A2" }),
                                margin: val
                              }
                            }
                          }));
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-900 dark:text-white"
                      >
                        <option value="chaflan">Chaflán Profundo (0.8 - 1.0mm)</option>
                        <option value="hombro_90">Hombro 90° Recto (1.2mm)</option>
                        <option value="bisel">Chaflán con Bisel</option>
                        <option value="feather_edge">Filo de Cuchillo / Feather Edge</option>
                      </select>
                    </div>

                    {/* Ferrule */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-500 dark:text-slate-400 block">Efecto Ferrule Cervical:</label>
                      <select
                        value={schemaState.teethRestorations[selectedTooth]?.ferrule || "cumple_1_5mm"}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          updateSchemaState((prev) => ({
                            ...prev,
                            teethRestorations: {
                              ...prev.teethRestorations,
                              [selectedTooth]: {
                                ...(prev.teethRestorations[selectedTooth] || { type: "corona_diente", material: "disilicato_emax", margin: "chaflan", shade: "A2" }),
                                ferrule: val
                              }
                            }
                          }));
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-900 dark:text-white"
                      >
                        <option value="cumple_1_5mm">Suficiente (≥ 1.5 - 2.0 mm)</option>
                        <option value="deficiente">Deficiente (&lt; 1.5 mm)</option>
                        <option value="alargamiento_necesario">Requiere Alargamiento Coronario</option>
                      </select>
                    </div>

                    {/* Color / Guia VITA */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-500 dark:text-slate-400 block">Color Guía VITA:</label>
                      <input
                        type="text"
                        value={schemaState.teethRestorations[selectedTooth]?.shade || "A2"}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSchemaState((prev) => ({
                            ...prev,
                            teethRestorations: {
                              ...prev.teethRestorations,
                              [selectedTooth]: {
                                ...(prev.teethRestorations[selectedTooth] || { type: "corona_diente", material: "disilicato_emax", margin: "chaflan", ferrule: "cumple_1_5mm" }),
                                shade: val
                              }
                            }
                          }));
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-teal-400 uppercase outline-none"
                        placeholder="Ej: A1, A2, BL1..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODULE 5: DISEÑO PPR 2D & KENNEDY */}
        {/* ========================================================= */}
        {activeModule === "ppr_kennedy" && (
          <motion.div
            key="ppr_kennedy"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* LEFT 7 COLS: INTERACTIVE 2D PPR CANVAS */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-purple-500" />
                    Diseñador de Prótesis Parcial Removible (PPR 2D)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Esquema anatómico interactivo con apoyos, ganchos, conector mayor y sillas de acrílico
                  </p>
                </div>

                {/* ARCH SWITCHER */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => updateSchemaState((prev) => ({ ...prev, ppr: { ...prev.ppr, arch: "superior" } }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      schemaState.ppr.arch === "superior"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Maxilar
                  </button>
                  <button
                    onClick={() => updateSchemaState((prev) => ({ ...prev, ppr: { ...prev.ppr, arch: "inferior" } }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      schemaState.ppr.arch === "inferior"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Mandibular
                  </button>
                </div>
              </div>

              {/* TOOL CLICK MODE SELECTOR */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Herramienta Activa (Haz clic directo en las piezas del esquema):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setPprToolMode("brecha")}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      pprToolMode === "brecha"
                        ? "bg-rose-600 text-white border-rose-400 shadow-md scale-102"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20 hover:bg-rose-500/20"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Brecha / Ausente
                  </button>

                  <button
                    onClick={() => setPprToolMode("apoyo")}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      pprToolMode === "apoyo"
                        ? "bg-amber-600 text-white border-amber-400 shadow-md scale-102"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/20"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Apoyo Oclusal
                  </button>

                  <button
                    onClick={() => setPprToolMode("gancho")}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      pprToolMode === "gancho"
                        ? "bg-purple-600 text-white border-purple-400 shadow-md scale-102"
                        : "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20 hover:bg-purple-500/20"
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    Gancho Retenedor
                  </button>

                  <button
                    onClick={() => {
                      // Auto classify Applegate rules based on current missing teeth
                      const missing = schemaState.ppr.missingTeeth || [];
                      let kClass: "I" | "II" | "III" | "IV" = "III";
                      let mods = 0;
                      if (missing.length >= 6) {
                        kClass = "I";
                        mods = 2;
                      } else if (missing.length >= 4) {
                        kClass = "II";
                        mods = 1;
                      } else if (missing.some((t) => [11, 21, 31, 41].includes(t))) {
                        kClass = "IV";
                        mods = 0;
                      } else {
                        kClass = "III";
                        mods = Math.max(0, missing.length - 1);
                      }
                      updateSchemaState((prev) => ({
                        ...prev,
                        ppr: { ...prev.ppr, kennedyClass: kClass, modificationsCount: mods }
                      }));
                    }}
                    className="p-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-teal-500/20 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Auto Applegate
                  </button>
                </div>
              </div>

              {/* DYNAMIC 2D VECTOR SCHEMATIC FOR MAXILLARY / MANDIBULAR ARCH */}
              <div className="bg-slate-950 rounded-3xl p-6 flex flex-col items-center justify-center border border-slate-800 min-h-[320px] relative overflow-hidden shadow-inner">
                {/* BACKGROUND ARCH VAULT GRID */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

                <svg viewBox="0 0 380 300" className="w-full max-w-md h-auto z-10 select-none">
                  <defs>
                    <linearGradient id="pPalatal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
                    </linearGradient>
                    <linearGradient id="pSaddle" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  {/* ANATOMICAL ARCH BASE CURVE */}
                  <path
                    d="M 50 260 C 50 80, 330 80, 330 260"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="24"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 50 260 C 50 80, 330 80, 330 260"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* MAJOR CONNECTORS GRAPHICS */}
                  {schemaState.ppr.arch === "superior" && schemaState.ppr.majorConnector === "banda_palatina" && (
                    <path
                      d="M 96 132 Q 190 95 284 132 L 302 172 Q 190 135 78 172 Z"
                      fill="url(#pPalatal)"
                      stroke="#a855f7"
                      strokeWidth="2"
                    />
                  )}

                  {schemaState.ppr.arch === "superior" && schemaState.ppr.majorConnector === "doble_barra_palatina" && (
                    <g>
                      {/* Anterior Strap */}
                      <path
                        d="M 118 96 Q 190 65 262 96 L 238 68 Q 190 48 142 68 Z"
                        fill="url(#pPalatal)"
                        stroke="#a855f7"
                        strokeWidth="2"
                      />
                      {/* Posterior Strap */}
                      <path
                        d="M 78 172 Q 190 135 302 172 L 318 215 Q 190 170 62 215 Z"
                        fill="url(#pPalatal)"
                        stroke="#a855f7"
                        strokeWidth="2"
                      />
                      {/* Palatal Window Label */}
                      <text x="190" y="130" textAnchor="middle" fill="#a855f7" fontSize="8" fontWeight="bold" opacity="0.6">
                        VENTANA PALATINA
                      </text>
                    </g>
                  )}

                  {schemaState.ppr.arch === "superior" && schemaState.ppr.majorConnector === "placa_palatina" && (
                    <path
                      d="M 142 68 Q 190 45 238 68 L 330 260 Q 190 200 50 260 Z"
                      fill="url(#pPalatal)"
                      stroke="#a855f7"
                      strokeWidth="2"
                    />
                  )}

                  {schemaState.ppr.arch === "inferior" && schemaState.ppr.majorConnector === "barra_lingual" && (
                    <path
                      d="M 118 106 Q 190 78 262 106 L 284 142 Q 190 112 96 142 Z"
                      fill="url(#pPalatal)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                  )}

                  {schemaState.ppr.arch === "inferior" && schemaState.ppr.majorConnector === "placa_lingual" && (
                    <path
                      d="M 142 78 Q 190 55 238 78 L 302 182 Q 190 125 78 182 Z"
                      fill="url(#pPalatal)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                  )}

                  {/* EDENTULOUS SADDLES (SILLAS DE ACRILICO ROSA) */}
                  {(schemaState.ppr.arch === "inferior" ? TEETH_FDI_LOWER : TEETH_FDI_UPPER).map((tooth) => {
                    const isMissing = (schemaState.ppr.missingTeeth || []).includes(tooth);
                    if (!isMissing) return null;

                    const coords = schemaState.ppr.arch === "inferior"
                      ? {
                          48: { x: 50, y: 260 }, 47: { x: 62, y: 215 }, 46: { x: 78, y: 172 }, 45: { x: 96, y: 132 },
                          44: { x: 118, y: 96 }, 43: { x: 142, y: 68 }, 42: { x: 165, y: 50 }, 41: { x: 182, y: 42 },
                          31: { x: 198, y: 42 }, 32: { x: 215, y: 50 }, 33: { x: 238, y: 68 }, 34: { x: 262, y: 96 },
                          35: { x: 284, y: 132 }, 36: { x: 302, y: 172 }, 37: { x: 318, y: 215 }, 38: { x: 330, y: 260 },
                        }[tooth]
                      : {
                          18: { x: 50, y: 260 }, 17: { x: 62, y: 215 }, 16: { x: 78, y: 172 }, 15: { x: 96, y: 132 },
                          14: { x: 118, y: 96 }, 13: { x: 142, y: 68 }, 12: { x: 165, y: 50 }, 11: { x: 182, y: 42 },
                          21: { x: 198, y: 42 }, 22: { x: 215, y: 50 }, 23: { x: 238, y: 68 }, 24: { x: 262, y: 96 },
                          25: { x: 284, y: 132 }, 26: { x: 302, y: 172 }, 27: { x: 318, y: 215 }, 28: { x: 330, y: 260 },
                        }[tooth];

                    if (!coords) return null;

                    return (
                      <g key={`saddle-${tooth}`}>
                        <rect
                          x={coords.x - 14}
                          y={coords.y - 14}
                          width="28"
                          height="28"
                          rx="8"
                          fill="url(#pSaddle)"
                          stroke="#f43f5e"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={coords.x}
                          y={coords.y + 3}
                          textAnchor="middle"
                          fill="#f43f5e"
                          fontSize="7"
                          fontWeight="bold"
                        >
                          SILLA
                        </text>
                      </g>
                    );
                  })}

                  {/* FULCRUM LINE (LÍNEA DE FULCRO) */}
                  {schemaState.ppr.fulcrumLineActive && (
                    <g>
                      <line
                        x1="118"
                        y1="96"
                        x2="262"
                        y2="96"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                      />
                      <circle cx="190" cy="96" r="10" fill="#f43f5e" />
                      <text x="190" y="99" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="black">
                        FULCRO
                      </text>
                    </g>
                  )}

                  {/* TEETH NODES ON ARCH */}
                  {(schemaState.ppr.arch === "inferior" ? TEETH_FDI_LOWER : TEETH_FDI_UPPER).map((tooth) => {
                    const isMissing = (schemaState.ppr.missingTeeth || []).includes(tooth);
                    const hasRest = (schemaState.ppr.rests || []).includes(tooth);
                    const retainer = schemaState.ppr.directRetainers[tooth];
                    const hasIndirect = (schemaState.ppr.indirectRetainers || []).includes(tooth);

                    const coords = schemaState.ppr.arch === "inferior"
                      ? {
                          48: { x: 50, y: 260 }, 47: { x: 62, y: 215 }, 46: { x: 78, y: 172 }, 45: { x: 96, y: 132 },
                          44: { x: 118, y: 96 }, 43: { x: 142, y: 68 }, 42: { x: 165, y: 50 }, 41: { x: 182, y: 42 },
                          31: { x: 198, y: 42 }, 32: { x: 215, y: 50 }, 33: { x: 238, y: 68 }, 34: { x: 262, y: 96 },
                          35: { x: 284, y: 132 }, 36: { x: 302, y: 172 }, 37: { x: 318, y: 215 }, 38: { x: 330, y: 260 },
                        }[tooth]
                      : {
                          18: { x: 50, y: 260 }, 17: { x: 62, y: 215 }, 16: { x: 78, y: 172 }, 15: { x: 96, y: 132 },
                          14: { x: 118, y: 96 }, 13: { x: 142, y: 68 }, 12: { x: 165, y: 50 }, 11: { x: 182, y: 42 },
                          21: { x: 198, y: 42 }, 22: { x: 215, y: 50 }, 23: { x: 238, y: 68 }, 24: { x: 262, y: 96 },
                          25: { x: 284, y: 132 }, 26: { x: 302, y: 172 }, 27: { x: 318, y: 215 }, 28: { x: 330, y: 260 },
                        }[tooth];

                    if (!coords) return null;

                    return (
                      <g
                        key={`tooth-node-${tooth}`}
                        onClick={() => {
                          // Apply tool mode directly based on active pprToolMode
                          if (pprToolMode === "brecha") {
                            const currentMissing = schemaState.ppr.missingTeeth || [];
                            const isNowMissing = currentMissing.includes(tooth);
                            const nextMissing = isNowMissing
                              ? currentMissing.filter((t) => t !== tooth)
                              : [...currentMissing, tooth];
                            updateSchemaState((prev) => ({ ...prev, ppr: { ...prev.ppr, missingTeeth: nextMissing } }));
                          } else if (pprToolMode === "apoyo") {
                            const currentRests = schemaState.ppr.rests || [];
                            const hasR = currentRests.includes(tooth);
                            const nextRests = hasR ? currentRests.filter((t) => t !== tooth) : [...currentRests, tooth];
                            updateSchemaState((prev) => ({ ...prev, ppr: { ...prev.ppr, rests: nextRests } }));
                          } else if (pprToolMode === "gancho") {
                            const currentR = schemaState.ppr.directRetainers[tooth] || "none";
                            const cycleMap: Record<string, any> = {
                              none: "akers",
                              akers: "dpi_rpi",
                              dpi_rpi: "roach",
                              roach: "doble_akers",
                              doble_akers: "anillo",
                              anillo: "none"
                            };
                            const nextRetain = cycleMap[currentR] || "akers";
                            updateSchemaState((prev) => ({
                              ...prev,
                              ppr: { ...prev.ppr, directRetainers: { ...prev.ppr.directRetainers, [tooth]: nextRetain } }
                            }));
                          } else if (pprToolMode === "indirecta") {
                            const currentInd = schemaState.ppr.indirectRetainers || [];
                            const hasInd = currentInd.includes(tooth);
                            const nextInd = hasInd ? currentInd.filter((t) => t !== tooth) : [...currentInd, tooth];
                            updateSchemaState((prev) => ({ ...prev, ppr: { ...prev.ppr, indirectRetainers: nextInd } }));
                          }
                        }}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        {/* Tooth Box */}
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r="12"
                          fill={isMissing ? "#1e293b" : "#334155"}
                          stroke={
                            hasRest
                              ? "#f59e0b"
                              : retainer && retainer !== "none"
                              ? "#a855f7"
                              : isMissing
                              ? "#f43f5e"
                              : "#64748b"
                          }
                          strokeWidth={hasRest || (retainer && retainer !== "none") ? "2.5" : "1.5"}
                        />

                        {/* FDI Tooth Label */}
                        <text
                          x={coords.x}
                          y={coords.y + 3.5}
                          textAnchor="middle"
                          fill={isMissing ? "#94a3b8" : "#ffffff"}
                          fontSize="9"
                          fontWeight="bold"
                        >
                          {tooth}
                        </text>

                        {/* OCCLUSAL REST MARKER (GOLD DOT) */}
                        {hasRest && !isMissing && (
                          <circle cx={coords.x - 8} cy={coords.y - 8} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                        )}

                        {/* DIRECT RETAINER CLASP BADGE */}
                        {retainer && retainer !== "none" && !isMissing && (
                          <rect
                            x={coords.x + 4}
                            y={coords.y - 12}
                            width="10"
                            height="8"
                            rx="2"
                            fill="#a855f7"
                          />
                        )}

                        {/* INDIRECT RETAINER BADGE */}
                        {hasIndirect && !isMissing && (
                          <circle cx={coords.x} cy={coords.y - 12} r="3" fill="#10b981" />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* OVERLAY BADGE FOR KENNEDY CLASS */}
                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-purple-500/30 text-xs text-purple-300 font-bold shadow-xl flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-400" />
                  Kennedy Clase {schemaState.ppr.kennedyClass} (Modificación {schemaState.ppr.modificationsCount})
                </div>
              </div>

              {/* KENNEDY CLASS & APPLEGATE SELECTOR BUTTONS */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Clasificación de Kennedy (Reglas de Applegate):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["I", "II", "III", "IV"] as const).map((kClass) => (
                    <button
                      key={kClass}
                      onClick={() => updateSchemaState((prev) => ({ ...prev, ppr: { ...prev.ppr, kennedyClass: kClass } }))}
                      className={`p-3 rounded-2xl border font-bold text-xs cursor-pointer transition-all ${
                        schemaState.ppr.kennedyClass === kClass
                          ? "bg-purple-600 text-white border-purple-400 shadow-md scale-102"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Clase {kClass}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLS: COMPONENT CONTROLS & RETAINERS */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
              <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                Componentes Estructurales PPR
                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-md font-mono">
                  Diseño 2D
                </span>
              </h4>

              {/* MAJOR CONNECTOR SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Conector Mayor ({schemaState.ppr.arch === "inferior" ? "Mandibular" : "Maxilar"}):
                </label>
                <select
                  value={schemaState.ppr.majorConnector}
                  onChange={(e) => updateSchemaState((prev) => ({ ...prev, ppr: { ...prev.ppr, majorConnector: e.target.value as any } }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-900 dark:text-white"
                >
                  {schemaState.ppr.arch === "superior" ? (
                    <>
                      <option value="banda_palatina">Banda Palatina Ancha (Estándar)</option>
                      <option value="doble_barra_palatina">Doble Barra Palatina (Antero-Posterior)</option>
                      <option value="placa_palatina">Placa Palatina Total (Máximo Soporte)</option>
                    </>
                  ) : (
                    <>
                      <option value="barra_lingual">Barra Lingual (Piso de boca profundo)</option>
                      <option value="placa_lingual">Placa Lingual (Placa de Cíngulos)</option>
                    </>
                  )}
                </select>
              </div>

              {/* SADDLE MATERIAL SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Material de Base / Silla:
                </label>
                <select
                  value={schemaState.ppr.saddleMaterial || "acrilico_rosa"}
                  onChange={(e) => updateSchemaState((prev) => ({ ...prev, ppr: { ...prev.ppr, saddleMaterial: e.target.value as any } }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-900 dark:text-white"
                >
                  <option value="acrilico_rosa">Acrílico Rosa Termocurado + Malla Cromo</option>
                  <option value="malla_metalica">Malla Metálica Retentiva Estructurada</option>
                  <option value="flexible_nylon">Resina Flexible Poliamida (Valplast/Flexite)</option>
                </select>
              </div>

              {/* MODIFICATIONS COUNT & FULCRUM TOGGLE */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Modificaciones:</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={schemaState.ppr.modificationsCount}
                    onChange={(e) => updateSchemaState((prev) => ({ ...prev, ppr: { ...prev.ppr, modificationsCount: Number(e.target.value) } }))}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Línea de Fulcro:</label>
                  <button
                    onClick={() => updateSchemaState((prev) => ({ ...prev, ppr: { ...prev.ppr, fulcrumLineActive: !prev.ppr.fulcrumLineActive } }))}
                    className={`w-full p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      schemaState.ppr.fulcrumLineActive
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {schemaState.ppr.fulcrumLineActive ? "Fulcro Visible" : "Fulcro Oculto"}
                  </button>
                </div>
              </div>

              {/* RETAINERS & RESTS BY ABUTMENT TEETH */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  Configuración de Pilares & Ganchos:
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {[14, 17, 24, 27, 44, 47, 34, 37].map((tooth) => {
                    const isMissing = (schemaState.ppr.missingTeeth || []).includes(tooth);
                    if (isMissing) return null;

                    const hasRest = (schemaState.ppr.rests || []).includes(tooth);
                    const retainer = schemaState.ppr.directRetainers[tooth] || "none";

                    return (
                      <div
                        key={`retainer-row-${tooth}`}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                            #{tooth}
                          </span>
                          <button
                            onClick={() => {
                              const currentRests = schemaState.ppr.rests || [];
                              const nextRests = hasRest
                                ? currentRests.filter((t) => t !== tooth)
                                : [...currentRests, tooth];
                              updateSchemaState((prev) => ({
                                ...prev,
                                ppr: { ...prev.ppr, rests: nextRests }
                              }));
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                              hasRest ? "bg-amber-500 text-slate-950" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                            }`}
                          >
                            {hasRest ? "Apoyo ON" : "+ Apoyo"}
                          </button>
                        </div>

                        <select
                          value={retainer}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            updateSchemaState((prev) => ({
                              ...prev,
                              ppr: {
                                ...prev.ppr,
                                directRetainers: {
                                  ...prev.ppr.directRetainers,
                                  [tooth]: val
                                }
                              }
                            }));
                          }}
                          className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10.5px] font-medium outline-none text-slate-800 dark:text-slate-200"
                        >
                          <option value="none">Sin Gancho</option>
                          <option value="dpi_rpi">Gancho DPI / RPI</option>
                          <option value="akers">Gancho Akers Circunferencial</option>
                          <option value="roach">Gancho Roach (Barra T / I)</option>
                          <option value="doble_akers">Doble Akers (Embradura)</option>
                          <option value="anillo">Gancho en Anillo (Molar aislado)</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
