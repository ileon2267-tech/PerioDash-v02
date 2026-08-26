import React, { useState, useMemo, useEffect } from 'react';
import { Patient, TreatmentProcedure, TreatmentPlan, ToothState, PeriodonState, InformedConsentRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Plus, Trash2, Calculator, CheckCircle2, DollarSign, 
  AlertTriangle, Sparkles, Eye, ArrowRight, Activity, Smile, 
  Layers, Check, Sparkle, RefreshCw, HelpCircle, Info,
  ShieldCheck, Camera, FileCheck, PenTool, Lock, ShieldAlert, X
} from 'lucide-react';
import { InformedConsentModal } from './InformedConsentModal';
import { recordHipaaAudit } from '../utils/hipaaAudit';

interface TreatmentPlanModuleProps {
  patient: Patient;
  aranceles: Record<string, number>;
  onUpdatePatient: (updated: Patient) => void;
}

interface ClinicalDiagnosis {
  id: string;
  category: 'odontologia' | 'periodoncia' | 'higienico';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedTeeth: number[];
  suggestedProcedures: {
    description: string;
    cost: number;
    phase: 'Diagnostico' | 'Saneamiento' | 'Rehabilitacion' | 'Mantenimiento';
    tooth?: number;
  }[];
}

const UPPER_TEETH_PRED = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH_PRED = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export default function TreatmentPlanModule({ patient, aranceles, onUpdatePatient }: TreatmentPlanModuleProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newCost, setNewCost] = useState<number>(0);
  const [newPhase, setNewPhase] = useState<TreatmentProcedure['phase']>('Saneamiento');
  const [newTooth, setNewTooth] = useState<string>('');
  const [newSurface, setNewSurface] = useState<string>('');
  const [newDiscount, setNewDiscount] = useState<number>(0);
  const [viewPredictive, setViewPredictive] = useState<'initial' | 'predicted'>('predicted');
  const [selectedProcForConsent, setSelectedProcForConsent] = useState<TreatmentProcedure | null>(null);
  const [blockedProcedureAlert, setBlockedProcedureAlert] = useState<TreatmentProcedure | null>(null);

  // Audit access to treatment plan
  useEffect(() => {
    if (patient?.id) {
      recordHipaaAudit("VIEW_TREATMENT_PLAN", `Acceso a plan de tratamiento y presupuesto de ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Plan de Tratamiento & Presupuestos ePHI",
        severity: "info"
      });
    }
  }, [patient?.id]);

  useEffect(() => {
    if (!blockedProcedureAlert) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBlockedProcedureAlert(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blockedProcedureAlert]);

  const tp = patient.treatmentPlan || { procedures: [], financing: { months: 1, downPayment: 0, interestRate: 0 } };
  const procedures = tp.procedures || [];

  const handleSaveConsent = (procId: string, consent: InformedConsentRecord) => {
    const updatedProcedures = procedures.map(p => {
      if (p.id === procId) {
        return { ...p, informedConsent: consent };
      }
      return p;
    });
    onUpdatePatient({
      ...patient,
      treatmentPlan: {
        ...tp,
        procedures: updatedProcedures
      }
    });
  };

  const getDentitoWarning = () => {
    const warnings = [];
    if (patient?.anamnesis?.hta) {
      warnings.push("El paciente indicó hipertensión. Sugiero protocolo de anestesia sin vasoconstrictor y control de presión arterial pre-quirúrgico.");
    }
    if (patient?.anamnesis?.diabetes) {
      warnings.push("El paciente es diabético. Monitorear hemoglobina glicosilada (HbA1c) previo a cirugías complejas y considerar profilaxis antibiótica.");
    }
    if (patient?.anamnesis?.alergias) {
      warnings.push(`Alerta de alergias: ${patient.anamnesis.alergias}. Revisar indicaciones medicamentosas post-operatorias.`);
    }
    return warnings;
  };
  const dentitoWarnings = getDentitoWarning();

  // Point 2: Automated Smart Clinical Diagnosis & Recommendation Engine
  const clinicalDiagnoses = useMemo<ClinicalDiagnosis[]>(() => {
    const diagnoses: ClinicalDiagnosis[] = [];
    
    // 1. Caries Scanning
    const cariesTeeth: number[] = [];
    Object.entries(patient.odontogram || {}).forEach(([numStr, state]) => {
      const num = parseInt(numStr);
      const s = state as ToothState;
      const hasCaries = Object.values(s.surfaces).some(val => val === 'caries');
      if (hasCaries) {
        cariesTeeth.push(num);
      }
    });

    if (cariesTeeth.length > 0) {
      diagnoses.push({
        id: 'diag-caries',
        category: 'odontologia',
        title: cariesTeeth.length > 3 ? 'Caries Dentales Múltiples' : 'Caries Dentales Activas',
        description: `Se detectaron lesiones de caries activas en caras expuestas de las piezas: ${cariesTeeth.join(', ')}. Requiere remoción de tejido infectado y obturación estética directa.`,
        severity: cariesTeeth.length > 3 ? 'high' : 'medium',
        affectedTeeth: cariesTeeth,
        suggestedProcedures: cariesTeeth.map(num => ({
          description: `Restauración Resina Composite (Caries)`,
          cost: aranceles['Restauración Resina Composite'] || 55000,
          phase: 'Saneamiento',
          tooth: num
        }))
      });
    }

    // 2. Missing Teeth Scanning
    const absentTeeth: number[] = [];
    Object.entries(patient.odontogram || {}).forEach(([numStr, state]) => {
      const num = parseInt(numStr);
      const s = state as ToothState;
      if (s.condition === 'ausente') {
        absentTeeth.push(num);
      }
    });

    if (absentTeeth.length > 0) {
      diagnoses.push({
        id: 'diag-ausencias',
        category: 'odontologia',
        title: 'Ausencia Dental (Pérdida de Soporte)',
        description: `Pérdida de elementos dentarios en las posiciones: ${absentTeeth.join(', ')}. Provoca alteración en la masticación, migración de piezas vecinas y pérdida de la dimensión vertical.`,
        severity: 'medium',
        affectedTeeth: absentTeeth,
        suggestedProcedures: absentTeeth.map(num => ({
          description: `Cirugía de Implante Dental`,
          cost: aranceles['Cirugía de Implante Dental'] || 450000,
          phase: 'Rehabilitacion',
          tooth: num
        }))
      });
    }

    // 3. Periodontal Deep Pockets Scanning
    const perioTeeth: number[] = [];
    let bopCount = 0; // Bleeding on probing
    Object.entries(patient.periodontogram || {}).forEach(([numStr, state]) => {
      const num = parseInt(numStr);
      const s = state as PeriodonState;
      
      const maxPocket = Math.max(
        s.vestibularPocket.mesial, s.vestibularPocket.central, s.vestibularPocket.distal,
        s.palatinoPocket.mesial, s.palatinoPocket.central, s.palatinoPocket.distal
      );
      
      const hasBleeding = Object.values(s.sangradoVestibular).some(v => v) || 
                          Object.values(s.sangradoPalatino).some(v => v);

      if (maxPocket >= 4) {
        perioTeeth.push(num);
      }
      if (hasBleeding) {
        bopCount++;
      }
    });

    if (perioTeeth.length > 0) {
      const isSevere = perioTeeth.length > 5;
      diagnoses.push({
        id: 'diag-periodontitis',
        category: 'periodoncia',
        title: isSevere ? 'Periodontitis Moderada a Severa Activa' : 'Periodontitis Leve / Gingivitis Localizada',
        description: `Pérdida de inserción clínica y bolsas patológicas de hasta ${isSevere ? '≥ 5mm' : '4mm'} con signos de sangrado al sondaje en piezas: ${perioTeeth.join(', ')}. Requiere debridamiento y raspado radicular.`,
        severity: isSevere ? 'high' : 'medium',
        affectedTeeth: perioTeeth,
        suggestedProcedures: [
          {
            description: `Raspado Radicular por Sector`,
            cost: aranceles['Raspado Radicular por Sector'] || 65000,
            phase: 'Saneamiento'
          }
        ]
      });
    }

    // 4. O'Leary Plaque Index Scanning
    let totalPlacaSurfaces = 0;
    let totalPossibleSurfaces = 0;
    Object.values(patient.oLeary || {}).forEach((state) => {
      totalPossibleSurfaces += 4;
      if (state.mesial) totalPlacaSurfaces++;
      if (state.distal) totalPlacaSurfaces++;
      if (state.vestibular) totalPlacaSurfaces++;
      if (state.lingual) totalPlacaSurfaces++;
    });

    const plaqueIndex = totalPossibleSurfaces > 0 ? (totalPlacaSurfaces / totalPossibleSurfaces) * 100 : 0;
    if (plaqueIndex > 20) {
      diagnoses.push({
        id: 'diag-oleary',
        category: 'higienico',
        title: `Control de Placa Deficiente (${Math.round(plaqueIndex)}%)`,
        description: `Presencia de biofilm bacteriano activo por encima del margen de seguridad clínico (20%). Alto riesgo de desarrollo de nuevas caries e inflamación gingival activa.`,
        severity: plaqueIndex > 50 ? 'high' : 'medium',
        affectedTeeth: [],
        suggestedProcedures: [
          {
            description: `Limpieza Profiláctica`,
            cost: aranceles['Limpieza Profiláctica'] || 45000,
            phase: 'Saneamiento'
          },
          {
            description: `Sondaje de Diagnóstico 6 puntos`,
            cost: aranceles['Sondaje de Diagnóstico 6 puntos'] || 30000,
            phase: 'Diagnostico'
          }
        ]
      });
    }

    return diagnoses;
  }, [patient, aranceles]);

  // Handle suggested procedures integration
  const allSuggestedProcedures = useMemo(() => {
    const list: any[] = [];
    clinicalDiagnoses.forEach(diag => {
      diag.suggestedProcedures.forEach(proc => {
        list.push({
          ...proc,
          diagnosticId: diag.id,
          category: diag.category
        });
      });
    });
    return list;
  }, [clinicalDiagnoses]);

  const pendingSuggestedProcedures = useMemo(() => {
    return allSuggestedProcedures.filter(s => {
      // Check if duplicate is already in treatment plan
      return !procedures.some(p => 
        p.description.toLowerCase() === s.description.toLowerCase() && 
        (p.tooth === (s.tooth ? String(s.tooth) : undefined) || (!p.tooth && !s.tooth))
      );
    });
  }, [allSuggestedProcedures, procedures]);

  const handleApplySuggested = () => {
    if (pendingSuggestedProcedures.length === 0) return;

    const currentProcs = [...procedures];
    pendingSuggestedProcedures.forEach(s => {
      currentProcs.push({
        id: `proc-auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        phase: s.phase,
        description: s.description,
        cost: s.cost,
        completed: false,
        tooth: s.tooth ? String(s.tooth) : undefined,
        discount: 0
      });
    });

    onUpdatePatient({
      ...patient,
      treatmentPlan: {
        ...tp,
        procedures: currentProcs
      }
    });
  };

  // Point 1: Smiley Rehabilitation Index & Predictor Logic
  const smileRehabStats = useMemo(() => {
    // Initial active pathologies
    let initialCaries = 0;
    let initialAbsent = 0;
    let initialPockets = 0;

    Object.values(patient.odontogram || {}).forEach((s) => {
      const hasCaries = Object.values(s.surfaces).some(val => val === 'caries');
      if (hasCaries) initialCaries++;
      if (s.condition === 'ausente') initialAbsent++;
    });

    Object.values(patient.periodontogram || {}).forEach((s) => {
      const maxPocket = Math.max(
        s.vestibularPocket.mesial, s.vestibularPocket.central, s.vestibularPocket.distal,
        s.palatinoPocket.mesial, s.palatinoPocket.central, s.palatinoPocket.distal
      );
      if (maxPocket >= 4) initialPockets++;
    });

    const totalPathologies = initialCaries + initialAbsent + initialPockets;

    // Resolved pathologies (matching procedures in plan)
    let resolvedCaries = 0;
    let resolvedAbsent = 0;
    let resolvedPockets = 0;

    procedures.forEach(p => {
      const desc = p.description.toLowerCase();
      if (desc.includes('resina') || desc.includes('restauración') || desc.includes('composite') || desc.includes('caries')) {
        resolvedCaries++;
      }
      if (desc.includes('implante') || desc.includes('prótesis') || desc.includes('corona')) {
        resolvedAbsent++;
      }
      if (desc.includes('raspado') || desc.includes('profiláctica') || desc.includes('limpieza')) {
        resolvedPockets++;
      }
    });

    const totalResolved = Math.min(
      totalPathologies,
      resolvedCaries + resolvedAbsent + resolvedPockets
    );

    const percentage = totalPathologies > 0 ? Math.round((totalResolved / totalPathologies) * 100) : 100;

    return {
      total: totalPathologies,
      resolved: totalResolved,
      percentage,
      initialCaries,
      initialAbsent,
      initialPockets,
      resolvedCaries: Math.min(initialCaries, resolvedCaries),
      resolvedAbsent: Math.min(initialAbsent, resolvedAbsent),
      resolvedPockets: Math.min(initialPockets, resolvedPockets)
    };
  }, [patient, procedures]);

  // Tooth predicted condition check for Point 1
  const getToothPredictedStatus = (toothNum: number) => {
    const original = patient?.odontogram?.[toothNum] || {
      toothNumber: toothNum,
      surfaces: { vestibular: 'sano', occlusal: 'sano', lingual: 'sano', mesial: 'sano', distal: 'sano' },
      condition: 'sano'
    };

    const s = { ...original };
    const hasInitialCaries = Object.values(s.surfaces).some(v => v === 'caries');
    const isInitialAbsent = s.condition === 'ausente';

    // Check if there is a plan procedure for this tooth
    const toothProcs = procedures.filter(p => p.tooth === String(toothNum));
    const hasResinaProc = toothProcs.some(p => {
      const d = p.description.toLowerCase();
      return d.includes('resina') || d.includes('restauración') || d.includes('composite') || d.includes('caries');
    });
    const hasImplanteProc = toothProcs.some(p => {
      const d = p.description.toLowerCase();
      return d.includes('implante') || d.includes('prótesis') || d.includes('corona');
    });

    let displayCaries = hasInitialCaries;
    let displayCondition = s.condition;

    if (hasResinaProc) {
      displayCaries = false; // resolved!
    }
    if (hasImplanteProc && isInitialAbsent) {
      displayCondition = 'implante'; // resolved!
    }

    return {
      toothNumber: toothNum,
      hasCaries: displayCaries,
      condition: displayCondition,
      isResolved: (hasInitialCaries && !displayCaries) || (isInitialAbsent && displayCondition === 'implante')
    };
  };

  const handleAddDefault = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && aranceles[val] !== undefined) {
      setNewDesc(val);
      setNewCost(aranceles[val]);
    }
  };

  const handleAddProcedure = () => {
    if (!newDesc.trim()) return;
    
    const newProc: TreatmentProcedure = {
      id: `proc-${Date.now()}`,
      phase: newPhase,
      description: newDesc,
      cost: newCost,
      completed: false,
      tooth: newTooth || undefined,
      surface: newSurface || undefined,
      discount: newDiscount || 0
    };

    const updatedPln: TreatmentPlan = {
      ...tp,
      procedures: [...procedures, newProc]
    };

    onUpdatePatient({ ...patient, treatmentPlan: updatedPln });
    setNewDesc('');
    setNewCost(0);
    setNewTooth('');
    setNewSurface('');
    setNewDiscount(0);
    setShowAddForm(false);

    recordHipaaAudit("UPDATE_TREATMENT_PLAN", `Procedimiento agregado: "${newProc.description}" (${newProc.phase}) para ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Plan de Tratamiento ePHI",
      severity: "info"
    });
  };

  const handleToggleComplete = (id: string) => {
    const targetProc = procedures.find(p => p.id === id);
    if (targetProc && !targetProc.completed) {
      if (!targetProc.informedConsent?.accepted) {
        setBlockedProcedureAlert(targetProc);
        return;
      }
    }
    const updated = procedures.map(p => p.id === id ? { ...p, completed: !p.completed } : p);
    onUpdatePatient({ ...patient, treatmentPlan: { ...tp, procedures: updated } });

    if (targetProc) {
      recordHipaaAudit("UPDATE_TREATMENT_PLAN", `Cambio de estado en procedimiento: "${targetProc.description}" a ${!targetProc.completed ? 'COMPLETADO' : 'PENDIENTE'} para ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Plan de Tratamiento ePHI",
        severity: "info"
      });
    }
  };

  const handleDelete = (id: string) => {
    const targetProc = procedures.find(p => p.id === id);
    const updated = procedures.map(p => p).filter(p => p.id !== id);
    onUpdatePatient({ ...patient, treatmentPlan: { ...tp, procedures: updated } });

    recordHipaaAudit("DELETE_TREATMENT_PROCEDURE", `Procedimiento eliminado: "${targetProc?.description || id}" del plan de ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Plan de Tratamiento ePHI",
      severity: "warning"
    });
  };

  const totalCost = procedures.reduce((acc, p) => acc + Math.round(p.cost * (1 - ((p.discount || 0) / 100))), 0);
  const totalCompleted = procedures.filter(p => p.completed).reduce((acc, p) => acc + Math.round(p.cost * (1 - ((p.discount || 0) / 100))), 0);
  const totalRemaining = totalCost - totalCompleted;

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="treatment-plan-view">
      
      {/* Competitor Crusher Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl" />
        <div className="space-y-1 relative z-10">
          <h3 className="text-xl font-display font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Planificación Clínica Predictiva
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Módulo inteligente de diagnósticos integrados, estimaciones y simulaciones predictivas "Antes vs Después".
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-md inline-flex items-center gap-2 shrink-0 relative z-10 border border-teal-500/20"
        >
          <Plus className="w-4 h-4" /> 
          <span>Agregar Procedimiento Manual</span>
        </button>
      </div>

      {/* Point 1: Live Interactive Smile Transformation & "Antes vs Después" Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Simulator "Antes vs Después" */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/40 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Smile className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Pronóstico de Sonrisa Interactiva</h4>
                <p className="text-[11px] text-slate-400">Ver restauración cosmética y anatómica en tiempo real</p>
              </div>
            </div>

            <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800/60 shrink-0">
              <button
                onClick={() => setViewPredictive('initial')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewPredictive === 'initial' ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Estado Inicial
              </button>
              <button
                onClick={() => setViewPredictive('predicted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${viewPredictive === 'predicted' ? 'bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/10 shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Sparkles className="w-3 h-3 text-teal-500 animate-pulse" />
                Predicción Final
              </button>
            </div>
          </div>

          {/* Visual Teeth Predicator Arches */}
          <div className="py-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-4 space-y-6 overflow-x-auto scrollbar-thin">
            <div className="text-center min-w-[650px]">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-4">Arcada Superior (Anatómica)</span>
              <div className="flex justify-center gap-1.5 px-2">
                {UPPER_TEETH_PRED.map(num => {
                  const o = patient.odontogram[num] || { condition: 'sano', surfaces: {} };
                  const pred = getToothPredictedStatus(num);
                  
                  // Decide visual styles based on current tab view
                  const isAbsent = viewPredictive === 'initial' ? (o.condition === 'ausente') : (pred.condition === 'ausente');
                  const isImplant = viewPredictive === 'initial' ? (o.condition === 'implante') : (pred.condition === 'implante');
                  const hasCaries = viewPredictive === 'initial' ? Object.values(o.surfaces).some(v => v === 'caries') : pred.hasCaries;
                  const isComposite = viewPredictive === 'initial' ? Object.values(o.surfaces).some(v => v === 'obturado') : (!pred.hasCaries && Object.values(o.surfaces).some(v => v === 'caries' || v === 'obturado'));

                  return (
                    <div 
                      key={num} 
                      className={`w-9 h-11 rounded-lg border flex flex-col items-center justify-between py-1.5 transition-all duration-300 relative shrink-0 ${
                        isAbsent 
                          ? 'bg-slate-200/50 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-700 opacity-40' 
                          : isImplant 
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-400/40' 
                            : hasCaries 
                              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-350 dark:border-rose-900/60'
                              : isComposite
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-300/60'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-[8px] font-mono font-bold text-slate-400">{num}</span>
                      
                      {/* Interactive indicator mark */}
                      <div className="w-4 h-4 rounded-full flex items-center justify-center">
                        {isAbsent ? (
                          <span className="text-[8px] text-slate-400 font-bold">X</span>
                        ) : isImplant ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center text-[6px] text-white font-extrabold shadow-sm animate-pulse">I</div>
                        ) : hasCaries ? (
                          <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm animate-ping" />
                        ) : isComposite ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex items-center justify-center text-[7px] text-white font-bold">✓</div>
                        ) : (
                          <span className="w-1.5 h-3 bg-slate-200 dark:bg-slate-700 rounded-xs" />
                        )}
                      </div>

                      {/* Sparkle highlight if just resolved */}
                      {viewPredictive === 'predicted' && pred.isResolved && (
                        <div className="absolute -top-1 -right-1">
                          <Sparkle className="w-3 h-3 text-emerald-500 fill-emerald-500 animate-bounce" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center min-w-[650px]">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-4">Arcada Inferior (Anatómica)</span>
              <div className="flex justify-center gap-1.5 px-2">
                {LOWER_TEETH_PRED.map(num => {
                  const o = patient.odontogram[num] || { condition: 'sano', surfaces: {} };
                  const pred = getToothPredictedStatus(num);
                  
                  const isAbsent = viewPredictive === 'initial' ? (o.condition === 'ausente') : (pred.condition === 'ausente');
                  const isImplant = viewPredictive === 'initial' ? (o.condition === 'implante') : (pred.condition === 'implante');
                  const hasCaries = viewPredictive === 'initial' ? Object.values(o.surfaces).some(v => v === 'caries') : pred.hasCaries;
                  const isComposite = viewPredictive === 'initial' ? Object.values(o.surfaces).some(v => v === 'obturado') : (!pred.hasCaries && Object.values(o.surfaces).some(v => v === 'caries' || v === 'obturado'));

                  return (
                    <div 
                      key={num} 
                      className={`w-9 h-11 rounded-lg border flex flex-col items-center justify-between py-1.5 transition-all duration-300 relative shrink-0 ${
                        isAbsent 
                          ? 'bg-slate-200/50 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-700 opacity-40' 
                          : isImplant 
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-400/40' 
                            : hasCaries 
                              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-350 dark:border-rose-900/60'
                              : isComposite
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-300/60'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-[8px] font-mono font-bold text-slate-400">{num}</span>
                      
                      <div className="w-4 h-4 rounded-full flex items-center justify-center">
                        {isAbsent ? (
                          <span className="text-[8px] text-slate-400 font-bold">X</span>
                        ) : isImplant ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center text-[6px] text-white font-extrabold shadow-sm animate-pulse">I</div>
                        ) : hasCaries ? (
                          <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm animate-ping" />
                        ) : isComposite ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex items-center justify-center text-[7px] text-white font-bold">✓</div>
                        ) : (
                          <span className="w-1.5 h-3 bg-slate-200 dark:bg-slate-700 rounded-xs" />
                        )}
                      </div>

                      {viewPredictive === 'predicted' && pred.isResolved && (
                        <div className="absolute -top-1 -right-1">
                          <Sparkle className="w-3 h-3 text-emerald-500 fill-emerald-500 animate-bounce" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Point 1 Smiley progress visualizer */}
          <div className="bg-slate-50/20 dark:bg-slate-950/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1 md:col-span-2">
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Porcentaje de Rehabilitación de Sonrisa:</span>
                <span className="text-teal-600 dark:text-teal-400 font-mono">{smileRehabStats.percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${smileRehabStats.percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2 rounded-full"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal pt-1">
                {smileRehabStats.percentage === 100 
                  ? "✓ El paciente no posee patologías activas detectadas o todas se encuentran cubiertas en el plan." 
                  : `Se resolverán ${smileRehabStats.resolved} de las ${smileRehabStats.total} anomalías iniciales registradas en su ficha clínica.`}
              </p>
            </div>
            
            <div className="flex flex-col justify-center items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado de Pronóstico</span>
              <span className={`text-sm font-black mt-1 ${
                smileRehabStats.percentage >= 80 
                  ? 'text-emerald-500' 
                  : smileRehabStats.percentage >= 40 
                    ? 'text-amber-500' 
                    : 'text-rose-500'
              }`}>
                {smileRehabStats.percentage >= 80 ? "Rehabilitado" : smileRehabStats.percentage >= 40 ? "En Progreso" : "Deficiente"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Diagnosis Scanner (Point 2) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
              <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
                <Activity className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Escáner de Diagnóstico Automático</h4>
                <p className="text-[11px] text-slate-400">Análisis basado en directrices clínicas de la AAP y FDI</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {clinicalDiagnoses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">¡Boca Saludable!</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">No se encontraron patologías activas en el odontograma o periodontograma.</p>
                </div>
              ) : (
                clinicalDiagnoses.map((diag, index) => (
                  <div 
                    key={diag.id} 
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{diag.title}</span>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
                        diag.severity === 'high' 
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/15' 
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/15'
                      }`}>
                        {diag.severity === 'high' ? 'Severo' : 'Moderado'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {diag.description}
                    </p>
                    <div className="pt-1 flex flex-wrap gap-1">
                      {diag.suggestedProcedures.map((proc, pidx) => (
                        <div key={pidx} className="bg-teal-500/5 border border-teal-500/10 rounded-lg px-2 py-1 flex items-center justify-between gap-3 w-full text-[10.5px]">
                          <span className="text-teal-600 dark:text-teal-400 font-medium">{proc.description} {proc.tooth ? `P.${proc.tooth}` : ''}</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">${proc.cost.toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/40">
            {pendingSuggestedProcedures.length > 0 ? (
              <button
                onClick={handleApplySuggested}
                className="w-full text-center bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-extrabold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border border-teal-500/20"
              >
                <Sparkles className="w-4 h-4 animate-bounce" />
                <span>Incorporar Tratamientos Sugeridos ({pendingSuggestedProcedures.length})</span>
              </button>
            ) : (
              <div className="w-full text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Todos los tratamientos sugeridos ya se encuentran en el plan.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Warnings & Active Contraindications alerts from Dentito */}
      {dentitoWarnings.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-4 shadow-sm flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-800/60 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              Dentito Copiloto
              <span className="bg-indigo-200/50 dark:bg-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-[9px] px-1.5 py-0.5 rounded-md uppercase font-black tracking-wider">Sugerencia Clínica</span>
            </h4>
            <ul className="mt-2 space-y-1">
              {dentitoWarnings.map((warn, i) => (
                <li key={i} className="text-xs text-indigo-800/80 dark:text-indigo-300/80 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                  <span>{warn}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Manual Procedures Add Form Drawer */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-teal-100 dark:border-teal-900/30 shadow-sm space-y-4 mb-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Nuevo Procedimiento Clínico</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Arancel Predefinido:</label>
                  <select
                    onChange={handleAddDefault}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                    defaultValue=""
                  >
                    <option value="">Selección Rápida...</option>
                    {Object.keys(aranceles).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Fase:</label>
                  <select
                    value={newPhase}
                    onChange={(e) => setNewPhase(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="Diagnostico">Diagnóstico / Preventiva</option>
                    <option value="Saneamiento">Saneamiento Básico</option>
                    <option value="Rehabilitacion">Rehabilitación Compleja</option>
                    <option value="Mantenimiento">Mantenimiento Periodontal</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-6">
                 <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Prestación (Descripción):</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="E.j. Restauración Composite"
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pieza:</label>
                  <input
                    type="text"
                    value={newTooth}
                    onChange={(e) => setNewTooth(e.target.value)}
                    placeholder="E.j. 1.4, Arcada Sup"
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Cara/Superficie:</label>
                  <input
                    type="text"
                    value={newSurface}
                    onChange={(e) => setNewSurface(e.target.value)}
                    placeholder="E.j. Mesial, TODAS"
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Descuento (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Valor Base ($):</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono font-bold text-teal-600 dark:text-teal-400"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="text-xs uppercase text-slate-500 font-bold">Subtotal Estimado:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">${Math.round(newCost * (1 - (newDiscount / 100))).toLocaleString('es-CL')}</span>
                </div>
                <button
                  onClick={handleAddProcedure}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer border border-teal-500/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Confirmar Prestación
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Procedures Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-0 overflow-hidden shadow-xs">
        {procedures.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-semibold">No data / Presupuesto vacío</p>
            <p className="text-xs font-light mt-1">Acá se listarán los procedimientos y costos aprobados para este plan de tratamiento.</p>
          </div>
        ) : (
          <div>
            {/* Consent Progress Header Bar */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  Consentimientos Informados:
                </span>
                <span className="bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full font-mono font-bold text-[11px] border border-teal-500/20">
                  {procedures.filter(p => p.informedConsent?.accepted).length} / {procedures.length} Validados
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Haga clic en <strong className="text-amber-500">"Pendiente"</strong> para realizar la verificación digital con firma táctil o fotografía en vivo.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="text-[10px] uppercase bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Fase Tratamiento</th>
                    <th className="px-6 py-3">Pieza</th>
                    <th className="px-6 py-3">Cara</th>
                    <th className="px-6 py-3">Prestación</th>
                    <th className="px-6 py-3 text-center">Consentimiento Informado</th>
                    <th className="px-6 py-3 text-right">Valor Base</th>
                    <th className="px-6 py-3 text-right">Dto (%)</th>
                    <th className="px-6 py-3 text-right">Subtotal ($)</th>
                    <th className="px-6 py-3 text-center">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {procedures.map((proc) => {
                    const discountValue = proc.discount || 0;
                    const subtotal = Math.round(proc.cost * (1 - (discountValue / 100)));
                    return (
                    <tr key={proc.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${proc.completed ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <button 
                          onClick={() => handleToggleComplete(proc.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${proc.completed ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 dark:bg-slate-800 dark:text-slate-500'}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border ${
                          proc.phase === 'Saneamiento' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                          proc.phase === 'Diagnostico' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
                          proc.phase === 'Rehabilitacion' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' :
                          'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800'
                        }`}>
                          {proc.phase}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200 text-xs">
                        {proc.tooth ? <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">{proc.tooth}</span> : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200 text-xs">
                        {proc.surface || <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">
                        <span className={proc.completed ? 'line-through decoration-slate-400 text-slate-400' : ''}>{proc.description}</span>
                      </td>

                      {/* Consent status cell */}
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        {proc.informedConsent?.accepted ? (
                          <button
                            onClick={() => setSelectedProcForConsent(proc)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-2xs"
                            title="Ver Consentimiento Validado"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Validado</span>
                            {proc.informedConsent.verificationMethod === 'camera' ? (
                              <Camera className="w-3 h-3 text-emerald-500 ml-0.5" />
                            ) : (
                              <FileCheck className="w-3 h-3 text-emerald-500 ml-0.5" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedProcForConsent(proc)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs"
                            title="Firmar / Capturar Consentimiento"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                            <span>Pendiente</span>
                          </button>
                        )}
                      </td>

                      <td className="px-6 py-3 whitespace-nowrap text-right font-mono text-slate-500 dark:text-slate-400 text-xs">
                        ${proc.cost.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right font-mono text-rose-500 text-xs font-bold">
                        {discountValue > 0 ? `-${discountValue}%` : '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                        ${subtotal.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center text-red-500 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onClick={() => handleDelete(proc.id)}>
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Budget Summary Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-end items-center gap-8">
              <div className="text-right space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Ejecutado (Pagado)</p>
                <div className="text-sm font-mono font-medium text-slate-600 dark:text-slate-400">${totalCompleted.toLocaleString('es-CL')}</div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Total Restante</p>
                <div className="text-sm font-mono font-medium text-amber-600 dark:text-amber-500">${totalRemaining.toLocaleString('es-CL')}</div>
              </div>
              <div className="text-right space-y-1 pl-6 border-l border-slate-200 dark:border-slate-700">
                <p className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400">Presupuesto Global</p>
                <div className="text-xl font-mono font-black text-slate-900 dark:text-white flex flex-row items-center gap-1 justify-end">
                   <DollarSign className="w-4 h-4 text-slate-400" />
                   {totalCost.toLocaleString('es-CL')}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Informed Consent Verification Modal */}
      {selectedProcForConsent && (
        <InformedConsentModal
          procedure={selectedProcForConsent}
          patient={patient}
          onSaveConsent={handleSaveConsent}
          onClose={() => setSelectedProcForConsent(null)}
        />
      )}

      {/* Legal Lock Execution Alert Modal */}
      {blockedProcedureAlert && (
        <div 
          onClick={() => setBlockedProcedureAlert(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center relative max-h-[90vh] overflow-y-auto my-auto flex flex-col"
          >
            <button
              type="button"
              onClick={() => setBlockedProcedureAlert(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-all duration-150"
              title="Cerrar ventana"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
              <Lock className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Bloqueo de Seguridad Clínica y Legal
              </span>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white pt-2">
                Firma de Consentimiento Requerida
              </h4>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              No es posible marcar como realizado el procedimiento <strong className="text-slate-900 dark:text-white">{blockedProcedureAlert.description}</strong> sin la firma y registro previo del Consentimiento Informado del paciente.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setBlockedProcedureAlert(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const target = blockedProcedureAlert;
                  setBlockedProcedureAlert(null);
                  setSelectedProcForConsent(target);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-teal-600 text-white text-xs font-black shadow-md hover:from-amber-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" /> Firmar Ahora
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
