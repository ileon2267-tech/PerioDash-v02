import React, { useState } from 'react';
import { Patient, CustomSpecialtyMarker } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Zap, 
  Layers, 
  Baby, 
  Scissors, 
  Sparkles, 
  Activity, 
  Check, 
  AlertTriangle, 
  Info, 
  Ruler, 
  ShieldAlert, 
  Scale, 
  ChevronRight,
  Copy,
  Sparkle,
  Sliders,
  Plus,
  Trash2,
  Tag,
  Palette
} from 'lucide-react';

interface SpecialtyToolsSuiteProps {
  patient?: Patient;
  onUpdatePatient?: (updatedPatient: Patient) => void;
  activeSpecialtyDefault?: string;
  onClose?: () => void;
}

export const SpecialtyToolsSuite: React.FC<SpecialtyToolsSuiteProps> = ({
  patient,
  onUpdatePatient,
  activeSpecialtyDefault = 'endodoncia',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<string>(activeSpecialtyDefault);
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  // ----------------------------------------------------
  // SPECIALTY TOOL BUILDER STATES (CUSTOM MARKERS)
  // ----------------------------------------------------
  const [builderTitle, setBuilderTitle] = useState<string>('Índice de Resorción / Riesgo Apical');
  const [builderSpecialty, setBuilderSpecialty] = useState<string>('endodoncia');
  const [builderToothNumber, setBuilderToothNumber] = useState<number | ''>(21);
  const [builderSeverityLevel, setBuilderSeverityLevel] = useState<'normal' | 'leve' | 'moderado' | 'severo' | 'critico'>('severo');
  const [builderColor, setBuilderColor] = useState<string>('rose');
  const [builderScoreValue, setBuilderScoreValue] = useState<number>(8);
  const [builderScaleMax, setBuilderScaleMax] = useState<number>(10);
  const [builderNotes, setBuilderNotes] = useState<string>('Calcificación de conducto con resorción externa. Requiere microscopio clínico y ultrasonido.');

  const handleSaveMarker = () => {
    if (!patient || !onUpdatePatient) return;
    const newMarker: CustomSpecialtyMarker = {
      id: 'mkr_' + Date.now(),
      title: builderTitle.trim() || 'Marcador Personalizado',
      specialty: builderSpecialty,
      toothNumber: builderToothNumber ? Number(builderToothNumber) : undefined,
      severityLevel: builderSeverityLevel,
      color: builderColor,
      scoreValue: Number(builderScoreValue),
      scaleMax: Number(builderScaleMax),
      notes: builderNotes.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedList = [newMarker, ...(patient.customSpecialtyMarkers || [])];
    onUpdatePatient({
      ...patient,
      customSpecialtyMarkers: updatedList
    });

    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const handleDeleteMarker = (markerId: string) => {
    if (!patient || !onUpdatePatient) return;
    const updatedList = (patient.customSpecialtyMarkers || []).filter(m => m.id !== markerId);
    onUpdatePatient({
      ...patient,
      customSpecialtyMarkers: updatedList
    });
  };

  // ----------------------------------------------------
  // 1. ENDO CALCULATOR STATES
  // ----------------------------------------------------
  const [endoLTA, setEndoLTA] = useState<number>(22); // Longitud Aparente Apical
  const [endoReferenceDist, setEndoReferenceDist] = useState<number>(1.0); // Distancia al ápice (0.5 - 1.0mm)
  const [endoCanalCount, setEndoCanalCount] = useState<number>(2);
  const [endoCurvature, setEndoCurvature] = useState<string>('moderada'); // leve, moderada, severa
  const [endoCalcification, setEndoCalcification] = useState<boolean>(false);
  const [endoRetreatment, setEndoRetreatment] = useState<boolean>(false);

  // Endodontic Work Length Calculation
  const endoEstimatedLTE = Math.max(10, Number((endoLTA - endoReferenceDist).toFixed(1)));
  
  // AAE Difficulty score calculation
  const getEndoDifficulty = () => {
    let score = 0;
    if (endoCurvature === 'moderada') score += 2;
    if (endoCurvature === 'severa') score += 4;
    if (endoCalcification) score += 3;
    if (endoRetreatment) score += 3;
    if (endoCanalCount >= 3) score += 2;

    if (score <= 2) return { level: 'Baja Complejidad (Caso Estándar)', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (score <= 5) return { level: 'Complejidad Moderada (Atención Especial)', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { level: 'Alta Complejidad (Evaluación por Especialista)', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
  };

  // ----------------------------------------------------
  // 2. ORTHO (MOYERS & TANAKA-JOHNSTON) CALCULATOR STATES
  // ----------------------------------------------------
  const [incisorWidthSum, setIncisorWidthSum] = useState<number>(28); // Suma 4 incisivos inferiores en mm
  const [archType, setArchType] = useState<'inferior' | 'superior'>('inferior');
  const [spaceAvailable, setSpaceAvailable] = useState<number>(23); // Espacio disponible en la arcada (mm)

  // Tanaka-Johnston Formula:
  // Inferior: (Suma Incisivos / 2) + 10.5 mm por cuadrante
  // Superior: (Suma Incisivos / 2) + 11.0 mm por cuadrante
  const estimatedPerQuadrant = (incisorWidthSum / 2) + (archType === 'inferior' ? 10.5 : 11.0);
  const estimatedTotalSpaceRequired = Number((estimatedPerQuadrant * 2).toFixed(1));
  const spaceDiscrepancy = Number((spaceAvailable - estimatedTotalSpaceRequired).toFixed(1));

  // ----------------------------------------------------
  // 3. PEDIATRIC ANESTHESIA & WEIGHT CALCULATOR STATES
  // ----------------------------------------------------
  const [childWeightKg, setChildWeightKg] = useState<number>(20);
  const [anestheticType, setAnestheticType] = useState<string>('lidocaina2'); // lidocaina2, mepivacaina3, articaina4

  // Max mg/kg calculations according to Clark & AAPD guidelines:
  // Lidocaine 2% w/ epi: max 4.4 mg/kg (max 300mg total). Each carpule (1.8ml) has 36mg lidocaine.
  // Mepivacaine 3%: max 4.4 mg/kg (max 300mg total). Each carpule has 54mg.
  // Articaine 4%: max 5.0 mg/kg (max 500mg total). Each carpule has 72mg.
  const getPediatricAnesthesiaMax = () => {
    let mgPerKg = 4.4;
    let mgPerCarpule = 36;
    let name = 'Lidocaína 2% con Epinefrina 1:100k';

    if (anestheticType === 'mepivacaina3') {
      mgPerKg = 4.4;
      mgPerCarpule = 54;
      name = 'Mepivacaína 3% Sin Vasoconstrictor';
    } else if (anestheticType === 'articaina4') {
      mgPerKg = 5.0;
      mgPerCarpule = 72;
      name = 'Articaína 4% con Epinefrina 1:100k/200k';
    }

    const maxMgTotal = Math.min(mgPerKg * childWeightKg, 300);
    const maxCarpules = Number((maxMgTotal / mgPerCarpule).toFixed(1));

    return { name, maxMgTotal: Math.round(maxMgTotal), maxCarpules };
  };

  // ----------------------------------------------------
  // 4. IMPLANTOLOGY & SURGERY BONE QUALITY STATES
  // ----------------------------------------------------
  const [boneType, setBoneType] = useState<string>('D2'); // D1, D2, D3, D4
  const [xrayDistanceNerve, setXrayDistanceNerve] = useState<number>(12); // mm measured on X-ray
  const [xrayMagnification, setXrayMagnification] = useState<number>(1.25); // 1.25x (25% enlargement standard panoramic)

  // Real Bone Height & Safe Implant Length Calculation (2mm safety margin to Nerve/Sinus)
  const realBoneHeight = Number((xrayDistanceNerve / xrayMagnification).toFixed(1));
  const maxSafeImplantLength = Number(Math.max(0, realBoneHeight - 2.0).toFixed(1));

  const getBoneProtocol = () => {
    switch (boneType) {
      case 'D1':
        return { name: 'D1 - Hueso Cortical Denso (Mandíbula anterior)', drilling: 'Fresado completo + Macho de rosca cortical (Evita sobre-calentamiento)', torque: '40 - 50 Ncm', integrationMonths: '3 Meses' };
      case 'D2':
        return { name: 'D2 - Cortical Gruesa y Trabeculado Denso (Mandíbula/Maxilar)', drilling: 'Protocolo de fresado estándar secuencial', torque: '35 - 45 Ncm', integrationMonths: '3-4 Meses' };
      case 'D3':
        return { name: 'D3 - Cortical Delgada y Trabeculado Poroso (Maxilar anterior)', drilling: 'Fresado ligero + Compactación/Osteótomos si se busca estabilidad', torque: '25 - 35 Ncm', integrationMonths: '4 Meses' };
      case 'D4':
        return { name: 'D4 - Trabeculado Muy Poroso / Blando (Maxilar posterior)', drilling: 'Sub-fresado significativo (Underdrilling) o expansión con osteótomos', torque: '15 - 25 Ncm (Carga progresiva)', integrationMonths: '6 Meses' };
      default:
        return { name: 'Estándar', drilling: 'Protocolo estándar', torque: '35 Ncm', integrationMonths: '4 Meses' };
    }
  };

  // ----------------------------------------------------
  // 5. ESTHETIC GOLDEN RATIO (1.618) CALCULATOR STATES
  // ----------------------------------------------------
  const [centralIncisorWidth, setCentralIncisorWidth] = useState<number>(8.5); // mm

  const lateralIncisorWidthGolden = Number((centralIncisorWidth / 1.618).toFixed(2));
  const canineApparentWidthGolden = Number((lateralIncisorWidthGolden / 1.618).toFixed(2));

  // ----------------------------------------------------
  // 6. PERIODONTAL GRADING & CAL CALCULATOR STATES
  // ----------------------------------------------------
  const [probingDepth, setProbingDepth] = useState<number>(6); // mm
  const [gingivalRecession, setGingivalRecession] = useState<number>(2); // mm
  const [boneLossPercentage, setBoneLossPercentage] = useState<number>(35); // %
  const [patientAge, setPatientAge] = useState<number>(patient?.birthdate ? (new Date().getFullYear() - new Date(patient.birthdate).getFullYear()) : 45);

  const clinicalAttachmentLoss = probingDepth + gingivalRecession;
  const boneLossAgeRatio = Number((boneLossPercentage / (patientAge || 40)).toFixed(2));

  const getPerioGradeByTonetti = () => {
    if (boneLossAgeRatio < 0.25) return { grade: 'Grado A (Progresión Lenta)', color: 'text-emerald-600 dark:text-emerald-400' };
    if (boneLossAgeRatio <= 1.0) return { grade: 'Grado B (Progresión Moderada)', color: 'text-amber-600 dark:text-amber-400' };
    return { grade: 'Grado C (Progresión Rápida / Alto Riesgo)', color: 'text-rose-600 dark:text-rose-400' };
  };

  // Copy or apply calculations to Patient record
  const handleCopyNote = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);

    if (patient && onUpdatePatient) {
      const currentNotes = patient.notes || '';
      const updatedNotes = currentNotes ? `${currentNotes}\n\n[Herramientas Especializadas - ${new Date().toLocaleDateString()}]:\n${text}` : text;
      onUpdatePatient({
        ...patient,
        notes: updatedNotes
      });
    }
  };

  const TABS = [
    { id: 'endodoncia', name: 'Endodoncia', icon: Zap, color: 'from-amber-500 to-orange-600', badge: 'Clark & AAE' },
    { id: 'ortodoncia', name: 'Ortodoncia', icon: Layers, color: 'from-indigo-500 to-blue-600', badge: 'Tanaka-Johnston' },
    { id: 'odontopediatria', name: 'Odontopediatría', icon: Baby, color: 'from-sky-500 to-cyan-600', badge: 'Dosis Anestesia' },
    { id: 'cirugia', name: 'Cirugía & Implantes', icon: Scissors, color: 'from-rose-500 to-red-600', badge: 'Misch & Nervio' },
    { id: 'estetica', name: 'Estética & Proporción', icon: Sparkles, color: 'from-purple-500 to-pink-600', badge: 'Áurea 1.618' },
    { id: 'periodoncia', name: 'Periodoncia', icon: Activity, color: 'from-teal-500 to-emerald-600', badge: 'AAP 2018 & CAL' },
    { id: 'builder', name: 'Tool Builder Pro', icon: Sliders, color: 'from-fuchsia-500 to-pink-600', badge: 'Creador Escalas' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
      
      {/* Banner Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xs">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              SpecTools Pro: Calculadoras Biométricas por Especialidad
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase">
                Exclusivo
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fórmulas diagnósticas y cálculos clínicos validados para apoyo en decisiones de alta precisión.
            </p>
          </div>
        </div>

        {patient && (
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>Paciente:</span>
            <span className="text-teal-600 dark:text-teal-400 font-extrabold">{patient.name}</span>
          </div>
        )}
      </div>

      {/* Specialty Tabs Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isActive 
                  ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-teal-500/30 dark:bg-slate-800 dark:border-teal-500/50' 
                  : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-teal-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {tab.badge}
                </span>
              </div>
              <div>
                <span className="text-xs font-black block leading-tight">{tab.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}
      <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
        
        {/* ====================================================== */}
        {/* TAB 1: ENDODONCIA - CONDUCTOMETRÍA & AAE COMPLEXITY   */}
        {/* ====================================================== */}
        {activeTab === 'endodoncia' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Calculadora de Conductometría Radicular & Riesgo AAE
                </h4>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Regla Apical 0.5 - 1.0mm
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Longitud Aparente en Radiografía (LTA en mm):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={endoLTA}
                    onChange={(e) => setEndoLTA(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-amber-600 dark:text-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Distancia de Seguridad Apical Requerida (mm):
                  </label>
                  <select
                    value={endoReferenceDist}
                    onChange={(e) => setEndoReferenceDist(parseFloat(e.target.value))}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value={0.5}>0.5 mm del ápice radiográfico (Cálculo Ajustado)</option>
                    <option value={1.0}>1.0 mm del ápice radiográfico (Recomendación Estándar)</option>
                    <option value={1.5}>1.5 mm del ápice (Reabsorción Apical o Lesión Extensa)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Curvatura del Conducto:</label>
                    <select
                      value={endoCurvature}
                      onChange={(e) => setEndoCurvature(e.target.value)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="recto">Recto (&lt; 10°)</option>
                      <option value="moderada">Moderada (10° - 30°)</option>
                      <option value="severa">Severa (&gt; 30° / Baioneta)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Conductos Estimados:</label>
                    <input
                      type="number"
                      value={endoCanalCount}
                      onChange={(e) => setEndoCanalCount(parseInt(e.target.value) || 1)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={endoCalcification}
                      onChange={(e) => setEndoCalcification(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    Calcificación Pulpar / Atresia
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={endoRetreatment}
                      onChange={(e) => setEndoRetreatment(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    Re-tratamiento (Gutapercha previa)
                  </label>
                </div>
              </div>

              {/* Results */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Longitud de Trabajo Estimada (LTE)</span>
                  <div className="text-3xl font-black text-amber-500 font-mono tracking-tight">
                    {endoEstimatedLTE} <span className="text-sm text-slate-400 font-sans font-normal">mm</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Fórmula: LTA ({endoLTA}mm) - Marcador Apical ({endoReferenceDist}mm)
                  </p>

                  <div className={`mt-4 p-3 rounded-xl border text-xs font-bold ${getEndoDifficulty().bg} ${getEndoDifficulty().color}`}>
                    <span className="block text-[10px] font-extrabold uppercase opacity-80">Índice AAE de Complejidad:</span>
                    {getEndoDifficulty().level}
                  </div>
                </div>

                <button
                  onClick={() => handleCopyNote(`[Endodoncia - Conductometría]: LTA=${endoLTA}mm, LTE Estimada=${endoEstimatedLTE}mm (a ${endoReferenceDist}mm de ápice). Complejidad AAE: ${getEndoDifficulty().level}.`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedNote ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedNote ? '¡Copiado e Incluido en Ficha!' : 'Copiar y Adjuntar a Ficha del Paciente'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* TAB 2: ORTODONCIA - MOYERS & TANAKA-JOHNSTON           */}
        {/* ====================================================== */}
        {activeTab === 'ortodoncia' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Análisis de Discrepancia de Espacio (Tanaka-Johnston)
                </h4>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Predicción Caninos & Premolares
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Suma Ancho Mesiodistal de los 4 Incisivos Inferiores (mm):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={incisorWidthSum}
                    onChange={(e) => setIncisorWidthSum(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-indigo-600 dark:text-indigo-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Arcada a Evaluar:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setArchType('inferior')}
                      className={`p-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        archType === 'inferior' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Arcada Inferior (+10.5 mm)
                    </button>
                    <button
                      onClick={() => setArchType('superior')}
                      className={`p-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        archType === 'superior' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Arcada Superior (+11.0 mm)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Espacio Actualmente Disponible en el Arco (mm):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={spaceAvailable}
                    onChange={(e) => setSpaceAvailable(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Espacio Requerido Estimado (Total Ambos Lados)</span>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {estimatedTotalSpaceRequired} <span className="text-xs text-slate-400 font-sans font-normal">mm ({estimatedPerQuadrant} mm / cuadrante)</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Discrepancia de Espacio Final</span>
                    <div className={`text-xl font-black ${spaceDiscrepancy < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {spaceDiscrepancy > 0 ? `+${spaceDiscrepancy} mm (Espacio Sobrante)` : `${spaceDiscrepancy} mm (Apiñamiento / Falta de Espacio)`}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyNote(`[Ortodoncia - Tanaka-Johnston]: Suma Incisivos=${incisorWidthSum}mm, Arcada=${archType}. Espacio Requerido=${estimatedTotalSpaceRequired}mm, Disponible=${spaceAvailable}mm. Discrepancia: ${spaceDiscrepancy}mm.`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedNote ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedNote ? '¡Copiado e Incluido en Ficha!' : 'Copiar Resultado a la Ficha'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* TAB 3: ODONTOPEDIATRÍA - DOSIS ANESTÉSICO INFANTIL    */}
        {/* ====================================================== */}
        {activeTab === 'odontopediatria' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-sky-500" />
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Calculadora Biométrica de Anestesia Local Pediátrica
                </h4>
              </div>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                Límite de Seguridad AAPD
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peso Corporal del Paciente Infantil (Kg):
                  </label>
                  <input
                    type="number"
                    value={childWeightKg}
                    onChange={(e) => setChildWeightKg(parseFloat(e.target.value) || 1)}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sky-600 dark:text-sky-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Anestésico Local Utilizado:
                  </label>
                  <select
                    value={anestheticType}
                    onChange={(e) => setAnestheticType(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="lidocaina2">Lidocaína 2% con Epinefrina (36mg / carpule - máx 4.4 mg/kg)</option>
                    <option value="mepivacaina3">Mepivacaína 3% Sin Vasoconstrictor (54mg / carpule - máx 4.4 mg/kg)</option>
                    <option value="articaina4">Articaína 4% con Epinefrina (72mg / carpule - máx 5.0 mg/kg)</option>
                  </select>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                    Dosis Máxima Permitida ({getPediatricAnesthesiaMax().name})
                  </span>
                  <div className="text-3xl font-black text-sky-500 font-mono tracking-tight">
                    {getPediatricAnesthesiaMax().maxCarpules} <span className="text-sm text-slate-400 font-sans font-normal">Carpules (Tubos 1.8ml)</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold">
                    Equivalente a máximo: {getPediatricAnesthesiaMax().maxMgTotal} mg de principio activo
                  </p>

                  <div className="mt-3 p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-[11px] text-sky-800 dark:text-sky-300">
                    ⚠️ Siempre aspirar antes de inyectar. Nunca sobrepasar {getPediatricAnesthesiaMax().maxCarpules} carpules en esta sesión de {childWeightKg} kg.
                  </div>
                </div>

                <button
                  onClick={() => handleCopyNote(`[Odontopediatría - Anestesia]: Peso=${childWeightKg}kg. Anestésico=${getPediatricAnesthesiaMax().name}. Dosis máx de seguridad=${getPediatricAnesthesiaMax().maxCarpules} carpules (${getPediatricAnesthesiaMax().maxMgTotal} mg).`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedNote ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedNote ? '¡Copiado e Incluido en Ficha!' : 'Copiar Dosis Máxima a la Ficha'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* TAB 4: CIRUGÍA E IMPLANTOLOGÍA - MISCH BONE & NERVE   */}
        {/* ====================================================== */}
        {activeTab === 'cirugia' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-rose-500" />
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Planificación Implantológica (Misch) & Seguridad Anatómica
                </h4>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                Margen de Seguridad 2mm
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Calidad y Densidad Ósea (Misch):
                  </label>
                  <select
                    value={boneType}
                    onChange={(e) => setBoneType(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-rose-600 dark:text-rose-400"
                  >
                    <option value="D1">D1 - Cortical Denso (Mandíbula Sínfisis)</option>
                    <option value="D2">D2 - Cortical Gruesa + Trabeculado Denso (Cuerpo Mandibular)</option>
                    <option value="D3">D3 - Cortical Delgada + Trabeculado Poroso (Maxilar Anterior)</option>
                    <option value="D4">D4 - Trabeculado Muy Poroso / Blando (Tuber Maxilar)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Distancia Radiográfica al Nervio (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={xrayDistanceNerve}
                      onChange={(e) => setXrayDistanceNerve(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Factor Ampliación Rx:</label>
                    <select
                      value={xrayMagnification}
                      onChange={(e) => setXrayMagnification(parseFloat(e.target.value))}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value={1.0}>1.0x (CBCT 3D Tomografía Real)</option>
                      <option value={1.25}>1.25x (Panorámica Digital Estándar)</option>
                      <option value={1.30}>1.30x (Panorámica Convencional)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                    Longitud Máxima de Implante Seguro
                  </span>
                  <div className="text-3xl font-black text-rose-500 font-mono tracking-tight">
                    {maxSafeImplantLength} <span className="text-sm text-slate-400 font-sans font-normal">mm</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Altura real: {realBoneHeight}mm con margen de seguridad prequirúrgico de 2.0mm.
                  </p>

                  <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Protocolo recomendación Misch ({getBoneProtocol().name}):</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">⚙️ Fresado: {getBoneProtocol().drilling}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">⚡ Torque: {getBoneProtocol().torque} • Osteointegración: {getBoneProtocol().integrationMonths}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyNote(`[Cirugía & Implantes]: Calidad Ósea=${boneType}. Altura Real=${realBoneHeight}mm, Implante Máx Seguro=${maxSafeImplantLength}mm (Margen 2mm NAI/Seno). Protocolo fresado: ${getBoneProtocol().drilling}. Torque: ${getBoneProtocol().torque}.`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedNote ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedNote ? '¡Copiado e Incluido en Ficha!' : 'Copiar Plan de Implante a la Ficha'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* TAB 5: ESTÉTICA - PROPORCIÓN ÁUREA 1.618               */}
        {/* ====================================================== */}
        {activeTab === 'estetica' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Diseño de Sonrisa & Proporción Áurea (Golden Ratio 1.618)
                </h4>
              </div>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                Lombardi & Levin Golden Proportion
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ancho Mesiodistal del Incisivo Central Superior (mm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={centralIncisorWidth}
                    onChange={(e) => setCentralIncisorWidth(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-purple-600 dark:text-purple-400 outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Basado en la Proporción Áurea de Lombardi (1.618), se proyecta el ancho aparente visible de frente para lograr armonía facial estética.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Dimensiones Áureas Proyectadas (Visión Frontal)</span>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">Incisivo Central</span>
                      <span className="text-lg font-black font-mono text-slate-800 dark:text-white">{centralIncisorWidth} mm</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">Incisivo Lateral</span>
                      <span className="text-lg font-black font-mono text-purple-600 dark:text-purple-400">{lateralIncisorWidthGolden} mm</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">Canino Visible</span>
                      <span className="text-lg font-black font-mono text-purple-600 dark:text-purple-400">{canineApparentWidthGolden} mm</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyNote(`[Diseño de Sonrisa - Proporción Áurea 1.618]: Central=${centralIncisorWidth}mm -> Lateral Áureo=${lateralIncisorWidthGolden}mm -> Canino Visible=${canineApparentWidthGolden}mm.`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedNote ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedNote ? '¡Copiado e Incluido en Ficha!' : 'Copiar Medidas Áureas a la Ficha'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* TAB 6: PERIODONCIA - AAP 2018 GRADING & CAL           */}
        {/* ====================================================== */}
        {activeTab === 'periodoncia' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-500" />
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Cálculo Periodontal Tonetti 2018 (CAL & Progresión Pérdida Ósea / Edad)
                </h4>
              </div>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                AAP / EFP
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Profundidad Sondaje (mm):</label>
                    <input
                      type="number"
                      value={probingDepth}
                      onChange={(e) => setProbingDepth(parseInt(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Recesión Gingival (mm):</label>
                    <input
                      type="number"
                      value={gingivalRecession}
                      onChange={(e) => setGingivalRecession(parseInt(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">% Pérdida Ósea Radiográfica:</label>
                    <input
                      type="number"
                      value={boneLossPercentage}
                      onChange={(e) => setBoneLossPercentage(parseInt(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-teal-600 dark:text-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Edad del Paciente:</label>
                    <input
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(parseInt(e.target.value) || 1)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Nivel de Inserción Clínica (CAL = Sondaje + Recesión)</span>
                  <div className="text-3xl font-black text-teal-500 font-mono tracking-tight">
                    {clinicalAttachmentLoss} <span className="text-sm text-slate-400 font-sans font-normal">mm de pérdida</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Cociente Pérdida Ósea / Edad (Gradiación Tonetti)</span>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black font-mono text-slate-800 dark:text-white">{boneLossAgeRatio}</span>
                      <span className={`text-xs font-black ${getPerioGradeByTonetti().color}`}>
                        {getPerioGradeByTonetti().grade}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyNote(`[Periodoncia - AAP 2018]: CAL=${clinicalAttachmentLoss}mm (Sondaje ${probingDepth}mm + Recesión ${gingivalRecession}mm). Pérdida ósea/Edad = ${boneLossAgeRatio} -> ${getPerioGradeByTonetti().grade}.`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedNote ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedNote ? '¡Copiado e Incluido en Ficha!' : 'Copiar Diagnóstico Periodontal a la Ficha'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* TAB 7: SPECIALTY TOOL BUILDER PRO (CUSTOM MARKERS)    */}
        {/* ====================================================== */}
        {activeTab === 'builder' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-fuchsia-500" />
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Specialty Tool Builder Pro: Creador de Marcadores Visuales
                </h4>
              </div>
              <span className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-0.5 rounded-full border border-fuchsia-500/20">
                Personalización Total
              </span>
            </div>

            {/* Builder Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form Config */}
              <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h5 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-fuchsia-500" /> Definir Nuevo Marcador o Escala
                </h5>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Título del Marcador / Diagnóstico:
                  </label>
                  <input
                    type="text"
                    value={builderTitle}
                    onChange={(e) => setBuilderTitle(e.target.value)}
                    placeholder="Ej. Índice de Calcificación Conducto Mesial"
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Especialidad:</label>
                    <select
                      value={builderSpecialty}
                      onChange={(e) => setBuilderSpecialty(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-teal-600 dark:text-teal-400"
                    >
                      <option value="endodoncia">Endodoncia</option>
                      <option value="ortodoncia">Ortodoncia</option>
                      <option value="odontopediatria">Odontopediatría</option>
                      <option value="cirugia">Cirugía & Implantes</option>
                      <option value="estetica">Estética</option>
                      <option value="periodoncia">Periodoncia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Pieza Dental FDI (Opcional):</label>
                    <input
                      type="number"
                      value={builderToothNumber}
                      onChange={(e) => setBuilderToothNumber(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="Ej. 21, 36, 11"
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Escala / Nivel Severidad:</label>
                    <select
                      value={builderSeverityLevel}
                      onChange={(e) => setBuilderSeverityLevel(e.target.value as any)}
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="normal">Normal / Leve (Verde)</option>
                      <option value="leve">Monitoreo (Azul)</option>
                      <option value="moderado">Atención (Amarillo)</option>
                      <option value="severo">Severo (Naranja)</option>
                      <option value="critico">Crítico / Urgente (Rojo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Tono Visual Insignia:</label>
                    <select
                      value={builderColor}
                      onChange={(e) => setBuilderColor(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="rose">Rosa / Carmesí</option>
                      <option value="amber">Ámbar / Naranja</option>
                      <option value="emerald">Esmeralda / Verde</option>
                      <option value="sky">Azul Cielo</option>
                      <option value="purple">Violeta</option>
                      <option value="indigo">Índigo</option>
                      <option value="teal">Verde Azulado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Puntaje / Medición:</label>
                    <input
                      type="number"
                      value={builderScoreValue}
                      onChange={(e) => setBuilderScoreValue(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Máximo Escala:</label>
                    <input
                      type="number"
                      value={builderScaleMax}
                      onChange={(e) => setBuilderScaleMax(parseFloat(e.target.value) || 10)}
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Indicaciones / Protocolo del Dentista:
                  </label>
                  <textarea
                    rows={2}
                    value={builderNotes}
                    onChange={(e) => setBuilderNotes(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none"
                  />
                </div>

                <button
                  onClick={handleSaveMarker}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Guardar Marcador en Ficha del Paciente
                </button>
              </div>

              {/* Preview & Current Patient Markers */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">Vista Previa del Marcador Creado</span>
                  
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-fuchsia-500" />
                        {builderTitle || 'Sin título'}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300">
                        {builderSpecialty}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500 dark:text-slate-400">
                        {builderToothNumber ? `Pieza Dental FDI #${builderToothNumber}` : 'Evaluación General'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase bg-${builderColor}-500/20 text-${builderColor}-700 dark:text-${builderColor}-300`}>
                        {builderSeverityLevel} ({builderScoreValue} / {builderScaleMax})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-fuchsia-500 h-full rounded-full transition-all" 
                        style={{ width: `${Math.min(100, Math.max(0, (builderScoreValue / (builderScaleMax || 1)) * 100))}%` }}
                      />
                    </div>

                    {builderNotes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                        "{builderNotes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Patient Saved Custom Markers List */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 max-h-[300px] overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                      Marcadores Personalizados Guardados ({patient?.customSpecialtyMarkers?.length || 0})
                    </span>
                  </div>

                  {!patient?.customSpecialtyMarkers || patient.customSpecialtyMarkers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No hay marcadores personalizados guardados para este paciente aún.</p>
                  ) : (
                    <div className="space-y-2">
                      {patient.customSpecialtyMarkers.map(mkr => (
                        <div key={mkr.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-extrabold text-slate-800 dark:text-slate-100">{mkr.title}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">{mkr.specialty} {mkr.toothNumber ? `• Diente #${mkr.toothNumber}` : ''}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteMarker(mkr.id)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="Eliminar marcador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-500">Puntaje: {mkr.scoreValue}/{mkr.scaleMax}</span>
                            <span className="uppercase px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300">
                              {mkr.severityLevel}
                            </span>
                          </div>

                          {mkr.notes && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">{mkr.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
