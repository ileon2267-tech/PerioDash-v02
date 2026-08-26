import React, { useState, useEffect } from "react";
import { PeriodonState, ToothState, Patient } from "../types";
import { UPPER_TEETH, LOWER_TEETH } from "../initialData";
import { 
  Award, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Heart, 
  Shield, 
  Info, 
  Sliders, 
  User, 
  Layers,
  HelpCircle,
  TrendingUp,
  Sparkles,
  Zap,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { recordHipaaAudit } from "../utils/hipaaAudit";

interface PRARiskAssessmentProps {
  periodontogram: Record<number, PeriodonState>;
  odontogram?: Record<number, ToothState>;
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
}

export default function PRARiskAssessment({ 
  periodontogram, 
  odontogram, 
  patient, 
  onUpdatePatient 
}: PRARiskAssessmentProps) {

  // Active Tab state
  const [activeTab, setActiveTab] = useState<"berna" | "aap">("berna");

  // Fallbacks in case tabaquismo (smoking), diabetesStatus, or edadSimulada are not set in the parent
  const [internalSmoking, setInternalSmoking] = useState<number>(0);
  const [internalDiabetes, setInternalDiabetes] = useState<"none" | "controlled" | "severe">("none");
  const [internalAge, setInternalAge] = useState<number>(45);

  const getEffectiveAge = () => {
    if (patient?.anamnesis?.edadSimulada) return patient.anamnesis.edadSimulada;
    if (patient?.birthdate) {
      const birth = new Date(patient.birthdate);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
      return isNaN(age) || age <= 0 ? 45 : age;
    }
    return internalAge;
  };

  // Audit access to PRA Risk Assessment
  useEffect(() => {
    if (patient?.id) {
      recordHipaaAudit("VIEW_PRA_ASSESSMENT", `Evaluación de riesgo periodontal (Lang & Tonetti / AAP) de ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Evaluación de Riesgo Periodontal (PRA) ePHI",
        severity: "info"
      });
    }
  }, [patient?.id]);

  const praSmoking = patient ? (patient.anamnesis?.tabaquismo ?? 0) : internalSmoking;
  const praDiabetes = patient 
    ? (patient.anamnesis?.diabetesStatus ?? (patient.anamnesis?.diabetes ? "controlled" : "none")) 
    : internalDiabetes;
  const praAge = getEffectiveAge();

  const handleSmokingChange = (val: number) => {
    onUpdatePatient({
      ...patient,
      anamnesis: {
        ...patient.anamnesis,
        tabaquismo: val
      }
    });

    recordHipaaAudit("UPDATE_PATIENT_RECORD", `Ajuste de parámetro sistémico (Tabaquismo: ${val} cig/día) para ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Factores de Riesgo Sistémicos ePHI",
      severity: "info"
    });
  };

  const handleDiabetesChange = (val: "none" | "controlled" | "severe") => {
    onUpdatePatient({
      ...patient,
      anamnesis: {
        ...patient.anamnesis,
        diabetes: val !== "none",
        diabetesStatus: val
      }
    });

    recordHipaaAudit("UPDATE_PATIENT_RECORD", `Ajuste de parámetro sistémico (Diabetes: ${val}) para ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Factores de Riesgo Sistémicos ePHI",
      severity: "info"
    });
  };

  const handleAgeChange = (val: number) => {
    onUpdatePatient({
      ...patient,
      anamnesis: {
        ...patient.anamnesis,
        edadSimulada: val
      }
    });
  };

  // CALCULATE PILLAR METRICS FROM ACTIVE DENTAL STATE
  let totalEvaluatedSurfaces = 0;
  let plaqueSurfaces = 0;
  let bopSurfaces = 0;
  let pocketsGreaterEqual5 = 0;
  let maxCALInMouth = 0;
  let maxPocketDepthInMouth = 0;

  Object.entries(periodontogram || {}).forEach(([toothNumStr, state]) => {
    // We count mesial, central, distal for both vestibular and palatino
    // total evaluated surfaces is based on teeth present in periodontogram
    totalEvaluatedSurfaces += 6; 

    // Plaque Surfaces (OLeary Plaque Control Record indices)
    if (state.placaVestibular?.mesial) plaqueSurfaces++;
    if (state.placaVestibular?.central) plaqueSurfaces++;
    if (state.placaVestibular?.distal) plaqueSurfaces++;
    if (state.placaPalatino?.mesial) plaqueSurfaces++;
    if (state.placaPalatino?.central) plaqueSurfaces++;
    if (state.placaPalatino?.distal) plaqueSurfaces++;

    // BOP (Bleeding on Probing) Indices
    if (state.sangradoVestibular?.mesial) bopSurfaces++;
    if (state.sangradoVestibular?.central) bopSurfaces++;
    if (state.sangradoVestibular?.distal) bopSurfaces++;
    if (state.sangradoPalatino?.mesial) bopSurfaces++;
    if (state.sangradoPalatino?.central) bopSurfaces++;
    if (state.sangradoPalatino?.distal) bopSurfaces++;

    // Residual pockets counts (pocket >= 5 mm)
    const vPk = state.vestibularPocket || { mesial: 0, central: 0, distal: 0 };
    const pPk = state.palatinoPocket || { mesial: 0, central: 0, distal: 0 };
    if (vPk.mesial >= 5) pocketsGreaterEqual5++;
    if (vPk.central >= 5) pocketsGreaterEqual5++;
    if (vPk.distal >= 5) pocketsGreaterEqual5++;
    if (pPk.mesial >= 5) pocketsGreaterEqual5++;
    if (pPk.central >= 5) pocketsGreaterEqual5++;
    if (pPk.distal >= 5) pocketsGreaterEqual5++;

    // Maximum Pocket Depth tracking
    const toothMaxPK = Math.max(vPk.mesial || 0, vPk.central || 0, vPk.distal || 0, pPk.mesial || 0, pPk.central || 0, pPk.distal || 0);
    if (toothMaxPK > maxPocketDepthInMouth) {
      maxPocketDepthInMouth = toothMaxPK;
    }

    // Clinical Attachment Loss (CAL / NIC = Pocket + Recession)
    const vRc = state.vestibularRecess || { mesial: 0, central: 0, distal: 0 };
    const pRc = state.palatinoRecess || { mesial: 0, central: 0, distal: 0 };
    
    const calVMesial = (vPk.mesial || 0) + (vRc.mesial || 0);
    const calVCentral = (vPk.central || 0) + (vRc.central || 0);
    const calVDistal = (vPk.distal || 0) + (vRc.distal || 0);
    const calPMesial = (pPk.mesial || 0) + (pRc.mesial || 0);
    const calPCentral = (pPk.central || 0) + (pRc.central || 0);
    const calPDistal = (pPk.distal || 0) + (pRc.distal || 0);

    const toothMaxCAL = Math.max(calVMesial, calVCentral, calVDistal, calPMesial, calPCentral, calPDistal);
    if (toothMaxCAL > maxCALInMouth) {
      maxCALInMouth = toothMaxCAL;
    }
  });

  const bopIndexValue = totalEvaluatedSurfaces > 0 
    ? Math.round((bopSurfaces / totalEvaluatedSurfaces) * 100)
    : 0;
  const normalizedBop = Math.min(100, bopIndexValue);

  // Assess missing teeth count
  let missingTeethCount = 0;
  if (odontogram) {
    Object.values(odontogram).forEach((t) => {
      if (t.condition === "ausente") missingTeethCount++;
    });
  } else {
    Object.values(periodontogram || {}).forEach((state) => {
      const is0 = (state.vestibularPocket?.mesial === 0) && (state.vestibularPocket?.central === 0) && (state.vestibularPocket?.distal === 0);
      if (is0) missingTeethCount++;
    });
  }

  // PRA continuous metrics
  const praiseRatio = praAge > 0 ? maxCALInMouth / praAge : 0;
  
  // Risk thresholds checking (Lang & Tonetti criteria)
  const isBopHigh = normalizedBop > 25;
  const isPocketsHigh = pocketsGreaterEqual5 > 4;
  const isMissingHigh = missingTeethCount > 8;
  const isBoneLossHigh = praiseRatio > 1.0;
  const isDiabetesHigh = praDiabetes === "severe";
  const isSmokingHigh = praSmoking >= 10;

  // Global Risk Assessment Formula (Lang & Tonetti PRA: 
  // High risk if >= 2 vectors are in high category (or 1 critical)
  let highRiskPillarsCount = 0;
  if (isBopHigh) highRiskPillarsCount++;
  if (isPocketsHigh) highRiskPillarsCount++;
  if (isMissingHigh) highRiskPillarsCount++;
  if (isBoneLossHigh) highRiskPillarsCount++;
  if (isDiabetesHigh) highRiskPillarsCount++;
  if (isSmokingHigh) highRiskPillarsCount++;

  const overallRiskLevel = highRiskPillarsCount >= 3 
    ? "ALTO" 
    : highRiskPillarsCount === 2 
    ? "MODERADO" 
    : "BAJO";

  // RADAR CHART COORDINATES MAPPINGS (6 Angles: 0, 60, 120, 180, 240, 300)
  // Maps values to a score of [0.1, 3] representing center-to-edge
  const getBopScore = () => {
    if (normalizedBop <= 10) return 0.2 + (normalizedBop / 10) * 0.8; // Low
    if (normalizedBop <= 25) return 1.0 + ((normalizedBop - 10) / 15) * 1.0; // Mod
    return 2.0 + Math.min(1.0, ((normalizedBop - 25) / 75) * 1.0); // High
  };

  const getPocketsScore = () => {
    if (pocketsGreaterEqual5 <= 4) return 0.2 + (pocketsGreaterEqual5 / 4) * 0.8;
    if (pocketsGreaterEqual5 <= 8) return 1.0 + ((pocketsGreaterEqual5 - 4) / 4) * 1.0;
    return 2.0 + Math.min(1.0, ((pocketsGreaterEqual5 - 8) / 12) * 1.0);
  };

  const getMissingScore = () => {
    if (missingTeethCount <= 4) return 0.2 + (missingTeethCount / 4) * 0.8;
    if (missingTeethCount <= 8) return 1.0 + ((missingTeethCount - 4) / 4) * 1.0;
    return 2.0 + Math.min(1.0, ((missingTeethCount - 8) / 16) * 1.0);
  };

  const getBoneLossScore = () => {
    if (praiseRatio <= 0.5) return 0.2 + (praiseRatio / 0.5) * 0.8;
    if (praiseRatio <= 1.0) return 1.0 + ((praiseRatio - 0.5) / 0.5) * 1.0;
    return 2.0 + Math.min(1.0, ((praiseRatio - 1.0) / 1.0) * 1.0);
  };

  const getDiabetesScore = () => {
    if (praDiabetes === "none") return 0.5;
    if (praDiabetes === "controlled") return 1.5;
    return 2.5;
  };

  const getSmokingScore = () => {
    if (praSmoking === 0) return 0.2;
    if (praSmoking < 10) return 1.0 + (praSmoking / 10) * 0.8;
    return 2.1 + Math.min(0.9, ((praSmoking - 10) / 20) * 0.9);
  };

  const scores = [
    getBopScore(),       // Axis 0: BOP
    getPocketsScore(),   // Axis 1: Pockets >= 5mm
    getMissingScore(),   // Axis 2: Lost teeth
    getBoneLossScore(),  // Axis 3: BL / Age Ratio
    getDiabetesScore(),  // Axis 4: Diabetes Status
    getSmokingScore()    // Axis 5: Smoking status
  ];

  // Helper code for rendering background hexagons
  const getPoint = (cx: number, cy: number, r: number, index: number) => {
    const angle = (index * 60 - 90) * (Math.PI / 180);
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  };

  const getPolygonPath = (cx: number, cy: number, currentScores: number[]) => {
    return currentScores.map((score, index) => {
      const radius = score * 36.6; // multiplier to stretch max (3) to ~110px radius
      const angle = (index * 60 - 90) * (Math.PI / 180);
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    }).join(" ");
  };

  // AAP 2018 STAGING & GRADING CALCULATIONS
  const maxCAL = maxCALInMouth;
  const pocketsCritical = pocketsGreaterEqual5;
  const teethLostPerio = missingTeethCount;
  
  // Approximate Radiographic Bone Loss (RBL) based on max attachment loss
  const approximateRBL = Math.min(100, Math.round((maxCALInMouth / 12) * 100));

  // Determine Stage (Etapa I, II, III, IV)
  let aapStage: "I" | "II" | "III" | "IV" = "I";
  let aapStageLabel = "Etapa I";
  let aapStageSub = "Periodontitis Inicial";
  let aapStageColor = "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  let aapStageDesc = "Destrucción periodontal inicial benigna con pérdida leve de inserción clínica (NIC 1-2 mm).";

  if (maxCAL >= 5 || teethLostPerio >= 5 || (odontogram && Object.values(odontogram).filter(t => t.condition !== "ausente").length < 20)) {
    if (teethLostPerio >= 5 || (odontogram && Object.values(odontogram).filter(t => t.condition !== "ausente").length < 20)) {
      aapStage = "IV";
      aapStageLabel = "Etapa IV";
      aapStageSub = "Periodontitis Avanzada Severa";
      aapStageColor = "text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
      aapStageDesc = "Pérdida ósea y tisular masiva con potencial colapso oclusal, masticación dolorosa y menos de 20 dientes remanentes.";
    } else {
      aapStage = "III";
      aapStageLabel = "Etapa III";
      aapStageSub = "Periodontitis Severa";
      aapStageColor = "text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20";
      aapStageDesc = "Pérdida de soporte alveolar profunda (NIC ≥5mm) con riesgo inminente de perder elementos dentarios (hasta 4 perdidos).";
    }
  } else if (maxCAL >= 3) {
    aapStage = "II";
    aapStageLabel = "Etapa II";
    aapStageSub = "Periodontitis Moderada";
    aapStageColor = "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    aapStageDesc = "Destrucción periodontocítica moderada confinada al tercio coronal superior de las raíces radiculares.";
  } else if (maxCAL >= 1) {
    aapStage = "I";
    aapStageLabel = "Etapa I";
    aapStageSub = "Periodontitis Inicial";
    aapStageColor = "text-emerald-500 dark:text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    aapStageDesc = "Destrucción periodontal inicial benigna con pérdida leve de inserción clínica (NIC 1-2 mm).";
  }

  // Determine Grade (Grado A, B, C)
  let aapGrade: "A" | "B" | "C" = "B";
  let aapGradeLabel = "Grado B";
  let aapGradeSub = "Progresión Moderada";
  let aapGradeColor = "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
  let aapGradeDesc = "Tasa de destrucción tisular regulada dentro de los parámetros esperados de progresión.";

  if (praiseRatio > 1.0 || praSmoking >= 10 || praDiabetes === "severe") {
    aapGrade = "C";
    aapGradeLabel = "Grado C";
    aapGradeSub = "Progresión Rápida";
    aapGradeColor = "text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20";
    aapGradeDesc = "Destrucción severa desmedida. Carga microbacteriana o modificadores sistémicos altamente desfavorables.";
  } else if (praiseRatio < 0.25 && praSmoking === 0 && praDiabetes === "none") {
    aapGrade = "A";
    aapGradeLabel = "Grado A";
    aapGradeSub = "Progresión Lenta";
    aapGradeColor = "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    aapGradeDesc = "Estabilidad notable a largo plazo, excelente resiliencia inmunológica local y sistémica.";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* BRAND & EXPANATIVE METRICS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-transparent p-5 rounded-2xl border border-teal-500/10 dark:border-teal-500/10">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-md font-mono uppercase mb-2 inline-block">
            HERRAMIENTA ACADÉMICA MULTIPARÁMETRO
          </span>
          <h3 className="text-xl font-display font-black text-slate-800 dark:text-white">
            Análisis de Diagnóstico Periodontal Pro
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Activity className="w-3.5 h-3.5 text-teal-500" />
            Berna PRA & Consenso AAP/EFP 2018 integrado en tiempo real
          </p>
        </div>

        {/* Global risk indicator badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">DIAGNÓSTICO AUTOMÁTICO</span>
            <span className={`text-sm font-black tracking-wide font-mono flex items-center gap-1.5 ${
              aapStage === "IV" || aapStage === "III" 
                ? "text-red-600 dark:text-red-400" 
                : aapStage === "II" 
                ? "text-amber-500 dark:text-amber-400" 
                : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {aapStageLabel} {activeTab === "aap" ? `- ${aapGradeLabel}` : ""}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
          <div className="text-center">
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">CAL MÁXIMO</span>
            <span className="text-base font-mono font-black text-slate-800 dark:text-slate-200">
              {maxCALInMouth} mm
            </span>
          </div>
        </div>
      </div>

      {/* MODULAR INTERACTIVE TAB BAR */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl max-w-lg shadow-inner z-10 relative">
        <button
          onClick={() => setActiveTab("berna")}
          className={`flex-1 py-3 px-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "berna"
              ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-md transform scale-[1.02] border border-slate-200/70 dark:border-slate-800"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4 text-teal-500" />
          Polígono de Berna (PRA)
        </button>
        <button
          onClick={() => setActiveTab("aap")}
          className={`flex-1 py-3 px-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "aap"
              ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-md transform scale-[1.02] border border-slate-200/70 dark:border-slate-800"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Award className="w-4 h-4 text-teal-500" />
          Consenso AAP 2018
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "berna" ? (
          <motion.div
            key="berna-tab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            
            {/* LEFT COMPONENT: PATIENT SLIDERS + DESCRIPTION PILLARS */}
            <div className="xl:col-span-7 space-y-6">
              
              {/* BIDIRECTIONAL EDITING SYSTEM */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Sliders className="w-4 h-4 text-teal-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Parámetros Clínicos Modificables (Anamnesis Activa)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Smoking slider input */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex justify-between">
                      <span>Hábito Tabáquico:</span>
                      <span className="text-teal-600 dark:text-teal-400 font-mono font-bold">{praSmoking} cigs/dia</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="30"
                      value={praSmoking}
                      onChange={(e) => handleSmokingChange(parseInt(e.target.value) || 0)}
                      className="w-full accent-teal-500 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400 block font-light leading-snug">
                      &ge; 10 cigs/día reclasifica al tabaquismo como un factor de alta vulnerabilidad biológica.
                    </span>
                  </div>

                  {/* Diabetes condition */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                      Estado Glucémico (Diabetes):
                    </label>
                    <select 
                      value={praDiabetes} 
                      onChange={(e) => handleDiabetesChange(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2.5 text-xs outline-none text-slate-700 dark:text-white focus:border-teal-500"
                    >
                      <option value="none">Sano / Sin Diabetes</option>
                      <option value="controlled">Diabetes Controlada (HbA1c &lt; 7.0%)</option>
                      <option value="severe">Diabetes Descompensada (HbA1c &ge; 7.0%)</option>
                    </select>
                    <span className="text-[9px] text-slate-400 block font-light leading-snug">
                      Un mal control de HbA1c severo altera drásticamente la cicatrización e inmunidad periodontal.
                    </span>
                  </div>

                  {/* Simulated Age */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex justify-between">
                      <span>Edad del Paciente:</span>
                      <span className="text-teal-600 dark:text-teal-400 font-mono font-bold">{praAge} años</span>
                    </label>
                    <input 
                      type="range" 
                      min="18" 
                      max="95"
                      value={praAge}
                      onChange={(e) => handleAgeChange(parseInt(e.target.value) || 45)}
                      className="w-full accent-teal-500 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400 block font-light leading-snug">
                      Calcula de forma dinámica la velocidad de reabsorción ósea relativa a la edad del paciente.
                    </span>
                  </div>
                </div>

                <div className="bg-teal-50/50 dark:bg-teal-900/10 border border-dashed border-teal-200 dark:border-teal-900/40 p-3 rounded-xl text-[10px] text-teal-700 dark:text-teal-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span>
                    <strong>Novedad bidireccional activa:</strong> Los ajustes modificados aquí actualizan automáticamente la anamnesis en la ficha general de <strong>{patient.name}</strong> en tiempo real.
                  </span>
                </div>
              </div>

              {/* INDIVIDUAL PILLARS CRITERIA DETAILED DISPLAY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Bleeding Pillar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                  <div className={`p-2 rounded-lg ${isBopHigh ? "bg-red-50 dark:bg-red-950/30 text-red-500" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500"}`}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">1. Sangrado al Sondaje (BOP)</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">{normalizedBop}%</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isBopHigh ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"}`}>
                        {isBopHigh ? "Alto Riesgo (&gt;25%)" : "Bajo/Moderado (&le;25%)"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-light leading-snug">
                      Mide el porcentaje de sitios sangrantes. Refleja la inflamación gingival activa en boca.
                    </p>
                  </div>
                </div>

                {/* Pockets Pillar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                  <div className={`p-2 rounded-lg ${isPocketsHigh ? "bg-red-50 dark:bg-red-950/30 text-red-500" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500"}`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">2. Bolsas Residuales &ge; 5mm</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">{pocketsGreaterEqual5} sitios</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isPocketsHigh ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"}`}>
                        {isPocketsHigh ? "Alto Riesgo (&gt;4)" : "Bajo/Moderado (&le;4)"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-light leading-snug">
                      Sitios periodontales con profundidad crítica residual que promueven colonización bacteriana anaerobia.
                    </p>
                  </div>
                </div>

                {/* Lost Teeth Pillar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                  <div className={`p-2 rounded-lg ${isMissingHigh ? "bg-red-50 dark:bg-red-950/30 text-red-500" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500"}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">3. Pérdida Dentaria</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">{missingTeethCount} ausentes</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isMissingHigh ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"}`}>
                        {isMissingHigh ? "Alto Riesgo (&gt;8)" : "Bajo/Moderado (&le;8)"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-light leading-snug">
                      Carga masticatoria residual. Un mayor número de dientes perdidos sobrecarga mecánicamente los remanentes.
                    </p>
                  </div>
                </div>

                {/* Bone Loss Ratio */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                  <div className={`p-2 rounded-lg ${isBoneLossHigh ? "bg-red-50 dark:bg-red-950/30 text-red-500" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500"}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">4. Alveolar / Edad (Pérdida/Edad)</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">{praiseRatio.toFixed(2)}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isBoneLossHigh ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"}`}>
                        {isBoneLossHigh ? "Alto Riesgo (&gt;1.0)" : "Bajo/Moderado (&le;1.0)"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-light leading-snug">
                      Pérdida ósea máxima aproximada en boca (NIC {maxCALInMouth}mm) dividida entre la edad del paciente ({praAge}).
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COMPONENT: INTERACTIVE SVG RADAR HEXAGON */}
            <div className="xl:col-span-5 flex flex-col justify-between space-y-6">
              <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white flex flex-col items-center justify-center space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full filter blur-3xl pointer-events-none" />
                
                <div className="text-center space-y-1">
                  <h4 className="text-xs font-bold font-display uppercase tracking-widest text-teal-400">
                    Visualizador de Riesgo Periodontal
                  </h4>
                  <p className="text-[10px] text-slate-400 font-light">
                    Polígono Dinámico Berna de 6 Dimensiones
                  </p>
                </div>

                {/* THE SVG RADAR CHART */}
                <div className="w-full max-w-[280px] aspect-square relative flex items-center justify-center">
                  <svg 
                    viewBox="0 0 300 300" 
                    className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                  >
                    <defs>
                      <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.45" />
                      </radialGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Concentric grid lines indicating Low (score 1.0), Medium (score 2.0), High (score 3.0) boundaries */}
                    {/* 1. Low risk Hexagon background */}
                    <polygon 
                      points={[0,1,2,3,4,5].map(i => getPoint(150, 150, 36.6, i)).join(" ")}
                      fill="rgba(16, 185, 129, 0.04)"
                      stroke="rgba(16, 185, 129, 0.25)"
                      strokeWidth="1.2"
                      strokeDasharray="4,4"
                    />
                    
                    {/* 2. Moderate risk Hexagon boundary */}
                    <polygon 
                      points={[0,1,2,3,4,5].map(i => getPoint(150, 150, 73.2, i)).join(" ")}
                      fill="none"
                      stroke="rgba(245, 158, 11, 0.25)"
                      strokeWidth="1.2"
                      strokeDasharray="4,4"
                    />

                    {/* 3. Outer maximum boundary */}
                    <polygon 
                      points={[0,1,2,3,4,5].map(i => getPoint(150, 150, 110, i)).join(" ")}
                      fill="none"
                      stroke="rgba(239, 68, 68, 0.25)"
                      strokeWidth="1.5"
                    />

                    {/* Draw axes radiating lines */}
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const endPoint = getPoint(150, 150, 112, index);
                      return (
                        <line 
                          key={index}
                          x1={150} 
                          y1={150} 
                          x2={endPoint.split(",")[0]} 
                          y2={endPoint.split(",")[1]} 
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* RENDER THE ACTUAL PATIENT'S SCORE POLYGON */}
                    <polygon 
                      points={getPolygonPath(150, 150, scores)}
                      fill="url(#radarGrad)"
                      stroke="#14b8a6"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow)"
                    />

                    {/* Draw point nodes for highlight */}
                    {scores.map((score, index) => {
                      const pt = getPoint(150, 150, score * 36.6, index);
                      const x = parseFloat(pt.split(",")[0]);
                      const y = parseFloat(pt.split(",")[1]);
                      const isSpecificHigh = score >= 2.0;

                      return (
                        <circle 
                          key={index}
                          cx={x}
                          cy={y}
                          r={6}
                          fill={isSpecificHigh ? "#ef4444" : "#14b8a6"}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      );
                    })}

                    {/* Angle label coordinates */}
                    {[
                      { label: "BOP", yOffset: -12, xOffset: 0, textAnchor: "middle" },
                      { label: "BOLSAS", yOffset: -2, xOffset: 12, textAnchor: "start" },
                      { label: "PÉRDIDAS", yOffset: 15, xOffset: 12, textAnchor: "start" },
                      { label: "PÉRDIDA/EDAD", yOffset: 15, xOffset: 0, textAnchor: "middle" },
                      { label: "DIABETES", yOffset: 15, xOffset: -12, textAnchor: "end" },
                      { label: "FUMADOR", yOffset: -2, xOffset: -12, textAnchor: "end" }
                    ].map((marker, idx) => {
                      const outerPt = getPoint(150, 150, 126, idx);
                      const tx = parseFloat(outerPt.split(",")[0]) + marker.xOffset;
                      const ty = parseFloat(outerPt.split(",")[1]) + marker.yOffset;
                      const isCurrentHigh = [isBopHigh, isPocketsHigh, isMissingHigh, isBoneLossHigh, isDiabetesHigh, isSmokingHigh][idx];

                      return (
                        <text 
                          key={idx}
                          x={tx}
                          y={ty}
                          textAnchor={marker.textAnchor as any}
                          className={`text-[8.5px] font-mono font-black tracking-wider ${isCurrentHigh ? "fill-red-400" : "fill-slate-400"}`}
                        >
                          {marker.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>

                {/* Legend guide */}
                <div className="flex gap-4 text-[9px] font-mono font-bold text-slate-400 border-t border-white/5 pt-3 w-full justify-center">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Bajo
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" /> Moderado
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" /> Alto
                  </span>
                </div>
              </div>

              {/* DYNAMIC ACTIONABLE DECISION BOARD MODULE */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 flex-1">
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest block font-mono">
                  RECOMENDACIONES CLÍNICAS DE APOYO:
                </span>
                
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light flex-1">
                  {overallRiskLevel === "ALTO" ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        <Heart className="w-4 h-4" /> COMPROMISO CLÍNICO SEVERO:
                      </p>
                      <p>
                        El polígono de Berna demuestra una susceptibilidad periodontal crítica descompensada. Se sugiere programar terapia de Fase I (raspado y alisado radicular) y visitas repetidas cada 2 semanas. Es fundamental interceder con consejería antitabaco y monitoreo de HbA1c.
                      </p>
                    </div>
                  ) : overallRiskLevel === "MODERADO" ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-amber-600 dark:text-amber-405 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> VIGILANCIA PERIÓDICA REQUERIDA:
                      </p>
                      <p>
                        Representa un nivel intermedio de susceptibilidad biológica. Se sugiere programar desbridamiento subgingival periodontal mecánico cada 3 a 6 meses. Reforzar tácticas de higiene bucal con cepillos interdentarios especiales.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold text-emerald-650 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> ESTADO CONTROLADO / MANTENIMIENTO:
                      </p>
                      <p>
                        Perfil periodontal sumamente estable. Se sugiere mantener citas preventivas semestrales para sustentabilidad a largo plazo. Felicitar al paciente por su excelente apego a las metas de control.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex text-[9px] text-slate-400 dark:text-slate-500 font-mono italic">
                  * El polígono y su área de riesgo aumentan proporcionalmente ante tabaquismo progresivo, mala regulación glicémica y presencia de bolsas &ge; 5mm.
                </div>
              </div>

            </div>

          </motion.div>
        ) : (
          <motion.div
            key="aap-tab"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* LEFT SIDE: DIAGNOSTIC VALUES & CRITICAL MODIFIERS */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* DIAGNOSIS DETAIL JUMBOTRON CARD */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
                  <Award className="w-48 h-48 text-slate-400" />
                </div>
                
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest font-mono mb-4">
                  Clasificación de Periodontitis Consenso AAP/EFP 2018
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gravedad y Complejidad</span>
                      <div className={`text-3xl font-black font-display rounded-2xl px-4 py-2 border inline-block ${aapStageColor}`}>
                        {aapStageLabel}
                      </div>
                      <p className="text-sm font-extrabold text-slate-800 dark:text-teal-400 mt-1">{aapStageSub}</p>
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                      {aapStageDesc}
                    </p>
                  </div>

                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tasa de Progresión Anticipada</span>
                      <div className={`text-3xl font-black font-display rounded-2xl px-4 py-2 border inline-block ${aapGradeColor}`}>
                        {aapGradeLabel}
                      </div>
                      <p className="text-sm font-extrabold text-slate-800 dark:text-teal-400 mt-1">{aapGradeSub}</p>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                      {aapGradeDesc}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 mt-6 leading-relaxed font-mono flex items-start gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-teal-600 dark:text-teal-400">Criterio Diagnóstico: </span>
                    Pérdida de inserción clínica máxima detectada en boca de <span className="text-slate-800 dark:text-white font-bold">{maxCALInMouth}mm</span> (Etapa {aapStage}), con un gradiente de progresión calculado de <span className="text-slate-800 dark:text-white font-bold">{praiseRatio.toFixed(2)} % Hueso/Edad</span> (Grado {aapGrade}).
                  </div>
                </div>
              </div>

              {/* THREE DYNAMIC CHECKLIST MODULES FOR STAGES AND GRADES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Staging Guidelines Details */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
                  <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
                    <span>Requisitos de Severidad (Etapa)</span>
                    <Layers className="w-4 h-4 text-slate-500" />
                  </h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {maxCAL >= 5 ? (
                          <CheckCircle className="w-4 h-4 text-teal-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Etapa III o IV (Pérdida ≥ 5 mm)</p>
                        <p className="text-[10px] text-slate-400 font-light mt-0.5">La destrucción de soporte ósea está en niveles severos y críticos.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {maxCAL >= 3 && maxCAL <= 4 ? (
                          <CheckCircle className="w-4 h-4 text-teal-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Etapa II (Pérdida de 3-4 mm)</p>
                        <p className="text-[10px] text-slate-400 font-light mt-0.5">Pérdida moderada confinada al espacio superior de la cresta alveolar.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {maxCAL > 0 && maxCAL <= 2 ? (
                          <CheckCircle className="w-4 h-4 text-teal-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Etapa I (Pérdida de 1-2 mm)</p>
                        <p className="text-[10px] text-slate-400 font-light mt-0.5">Bolsas superficiales leves, periodontitis de instauración muy inicial.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="mt-0.5 shrink-0">
                        {teethLostPerio >= 5 ? (
                          <CheckCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Dientes Ausentes &ge; 5 (Complejidad Etapa IV)</p>
                        <p className="text-[10px] text-slate-400 font-light mt-0.5">Pérdida severa de unidades funcionales dentarias debida a enfermedad periodontal.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Grading Modifiers Detailed Panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
                  <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
                    <span>Modificadores de Grado Sistémicos</span>
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                  </h5>

                  <div className="space-y-4">
                    {/* Smoking details */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Tabaquismo Activo:</span>
                        <span className="text-[10px] font-mono font-black text-teal-600 dark:text-teal-400">{praSmoking} cig/día</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`h-2.5 flex-1 rounded-full ${praSmoking === 0 ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"}`} />
                        <div className={`h-2.5 flex-1 rounded-full ${praSmoking > 0 && praSmoking < 10 ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"}`} />
                        <div className={`h-2.5 flex-1 rounded-full ${praSmoking >= 10 ? "bg-red-500" : "bg-slate-200 dark:bg-slate-800"}`} />
                      </div>
                      <p className="text-[9px] text-slate-400 leading-snug">
                        {praSmoking >= 10 
                          ? "Fumador severo (≥10 cigs/día): Forzar Grado C automáticamente debido al alto daño inmune." 
                          : praSmoking > 0 
                          ? "Fumador moderado (<10 cigs/día): Impone Grado B mínimo." 
                          : "No fumador: Permite clasificar al Grado A si la pérdida ósea es insignificante."}
                      </p>
                    </div>

                    {/* Diabetes glycemic details */}
                    <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Diabetes / Hemoglobina Glicosilada:</span>
                        <span className="text-[10px] font-mono font-black text-teal-500 dark:text-teal-400">
                          {praDiabetes === "none" ? "Saludable" : praDiabetes === "controlled" ? "HbA1c < 7%" : "HbA1c ≥ 7%"}
                        </span>
                      </div>
                      <div className="flex gap-2 text-[9.5px] font-mono mt-1 text-center font-bold">
                        <span className={`flex-1 py-1 px-1 rounded-lg border ${praDiabetes === "none" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-500/30" : "bg-slate-50 dark:bg-slate-800/20 text-slate-400 border-transparent"}`}>Sin Dx</span>
                        <span className={`flex-1 py-1 px-1 rounded-lg border ${praDiabetes === "controlled" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-500/30" : "bg-slate-50 dark:bg-slate-800/20 text-slate-400 border-transparent"}`}>Ctrl. Grado B</span>
                        <span className={`flex-1 py-1 px-1 rounded-lg border ${praDiabetes === "severe" ? "bg-red-50 dark:bg-red-950/20 text-red-600 border-red-500/30" : "bg-slate-50 dark:bg-slate-800/20 text-slate-400 border-transparent"}`}>Desctrl. Grado C</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-snug mt-1">
                        El estatus metabólico sistémico determina directamente la velocidad y la capacidad regenerativa de los odontoblastos y queratinocitos.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* RIGHT SIDE: AAP GRAPHIC COMPARATIVE MATRIX */}
            <div className="xl:col-span-4 flex flex-col justify-between space-y-6">
              
              {/* INTERACTIVE COMPARATIVE AAP TABLE */}
              <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white space-y-4 shadow-xl">
                <div>
                  <h4 className="text-xs font-bold font-display uppercase tracking-widest text-teal-400">
                    Estadificación Interactiva
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Matriz de clasificación consolidada mundial
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono">
                  {/* Row headers */}
                  <div className="col-span-1 text-left text-slate-500 font-bold self-center">ETAPAS</div>
                  <div className={`py-2 rounded-lg border ${aapStage === "I" ? "bg-emerald-500/20 border-emerald-500 font-black text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-slate-800/30 border-transparent opacity-40 text-slate-300"}`}>I</div>
                  <div className={`py-2 rounded-lg border ${aapStage === "II" ? "bg-amber-500/20 border-amber-500 font-black text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]" : "bg-slate-800/30 border-transparent opacity-40 text-slate-300"}`}>II</div>
                  <div className={`py-2 rounded-lg border ${aapStage === "III" || aapStage === "IV" ? "bg-red-500/20 border-red-500 font-black text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]" : "bg-slate-800/30 border-transparent opacity-40 text-slate-300"}`}>{aapStage === "IV" ? "IV" : "III"}</div>

                  {/* Attachment loss row */}
                  <div className="col-span-1 text-left text-slate-400 font-bold self-center">NIC</div>
                  <div className="py-1 text-slate-300">1-2mm</div>
                  <div className="py-1 text-slate-300">3-4mm</div>
                  <div className="py-1 text-slate-400">&ge;5mm</div>

                  {/* Separation line */}
                  <div className="col-span-4 border-t border-slate-800 my-1" />

                  {/* Grade rows */}
                  <div className="col-span-1 text-left text-slate-500 font-bold self-center">GRADOS</div>
                  <div className={`py-2 rounded-lg border ${aapGrade === "A" ? "bg-emerald-500/20 border-emerald-500 font-black text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-slate-800/30 border-transparent opacity-40 text-slate-300"}`}>A</div>
                  <div className={`py-2 rounded-lg border ${aapGrade === "B" ? "bg-amber-500/20 border-amber-500 font-black text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]" : "bg-slate-800/30 border-transparent opacity-40 text-slate-300"}`}>B</div>
                  <div className={`py-2 rounded-lg border ${aapGrade === "C" ? "bg-red-500/20 border-red-500 font-black text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]" : "bg-slate-800/30 border-transparent opacity-40 text-slate-300"}`}>C</div>

                  {/* Progression speeds */}
                  <div className="col-span-1 text-left text-slate-400 font-bold self-center">Pérd./Edad</div>
                  <div className="py-1 text-slate-300">&lt;0.25</div>
                  <div className="py-1 text-slate-300">0.25-1.0</div>
                  <div className="py-1 text-slate-400">&gt;1.0</div>
                </div>

                <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 text-[10px] text-slate-300 leading-relaxed font-light mt-2">
                  <div className="font-bold text-teal-400 mb-1 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5" /> Notas de Diagnóstico:
                  </div>
                  La clasificación activa de tu paciente se resalta dinámicamente en color verde, ámbar o rojo según la severidad clínica arrojada por el periodontograma y sus hábitos sistémicos.
                </div>
              </div>

              {/* ACTION PLAN RECOMMENDATION */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 flex-1">
                <span className="text-[10px] font-bold text-teal-605 dark:text-teal-400 uppercase tracking-widest block font-mono">
                  PROTOCOLO DE INTERVENCION SEGUN AAP 2018:
                </span>

                <div className="text-xs text-slate-655 dark:text-slate-300 leading-relaxed font-light flex-1">
                  {aapStage === "IV" ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-sans">
                        <Zap className="w-4 h-4 text-rose-500 animate-pulse" /> REHABILITACIÓN MULTIDISCIPLINAR REQUERIDA (ETAPA IV):
                      </p>
                      <p>
                        Se recomienda terapia quirúrgica periodontal avanzada (colgajos, cirugía regenerativa), ferulización y reconstrucción de mordida colapsada. Requiere interconsulta estrecha con Rehabilitación Oral y Endodoncia para resguardar la dentadura funcional remanente.
                      </p>
                    </div>
                  ) : aapStage === "III" ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5 font-sans">
                        <Sliders className="w-4 h-4 text-red-500" /> TERAPIA PERIODONTAL QUIRÚRGICA & FASE I (ETAPA III):
                      </p>
                      <p>
                        Fase higiénica estricta con instrumental piezoeléctrico ultrasónico, curetas de Gracey e irrigación antiséptica. Evaluar re-evaluación a las 6 semanas; de persistir bolsas ≥6mm, proceder a colgajos de acceso de Kirkland o eliminación de bolsas.
                      </p>
                    </div>
                  ) : aapStage === "II" ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-sans">
                        <Sliders className="w-4 h-4 text-amber-500" /> TRATAMIENTO CONVENCIONAL DE FASE I (ETAPA II):
                      </p>
                      <p>
                        Raspaje y alisado radicular meticuloso cuadrante por cuadrante bajo anestesia local. Profilaxis dental completa con tazas de goma y pasta abrasiva de fluoruro. Refuerzo sistemático del hábito de cepillado interdental.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-sans">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> MEDIDAS PREVENTIVAS & PROFILAXIS (ETAPA I):
                      </p>
                      <p>
                        Remoción de depósitos supra de tártaro bacteriano (tartrectomía), pulido de superficies coronales y evaluación de higiene trisemestral. Excelente pronóstico clínico general.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex text-[9px] text-slate-400 dark:text-slate-500 font-mono italic">
                  * El dictamen ha sido guiado por las guías clínicas mundiales unificadas de la Academia Americana de Periodoncia de 2018.
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
