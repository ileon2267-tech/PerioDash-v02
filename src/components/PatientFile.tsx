import React, { useState, useEffect, useRef } from 'react';
import { Patient, Evolution, Anamnesis, Consentimiento } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import ClinicalPhotography from './ClinicalPhotography';
import PatientCommunications from './PatientCommunications';
import { recordHipaaAudit } from '../utils/hipaaAudit';
import { 
  Save, 
  Plus, 
  FileText, 
  HeartPulse, 
  Activity, 
  User, 
  Calendar, 
  Trash2, 
  PenTool, 
  X, 
  RotateCcw, 
  Check, 
  ShieldAlert,
  Zap,
  Layers,
  Scissors,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileCheck,
  Sparkles,
  Baby,
  Info,
  ChevronRight,
  HelpCircle,
  Camera,
  MessageSquare,
  ArrowLeft,
  Users
} from 'lucide-react';

interface PatientFileProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  onClose: () => void;
}

const ToggleHeader = ({ id, icon: Icon, title, description, expandedSection, setExpandedSection, rightElement }: any) => {
  const isOpen = expandedSection === id;
  return (
    <div 
       onClick={() => setExpandedSection(isOpen ? '' : id)}
       className={`flex items-center justify-between p-4 sm:p-5 cursor-pointer transition-colors ${isOpen ? 'bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
    >
       <div className="flex items-center gap-3">
         <div className={`p-2 rounded-xl transition-colors ${isOpen ? 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            <Icon className="w-5 h-5" />
         </div>
         <div className="flex flex-col text-left">
           <h3 className={`font-bold transition-colors ${isOpen ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>{title}</h3>
           {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>}
         </div>
       </div>
       <div className="flex items-center gap-4">
         {rightElement && (
           <div onClick={(e) => e.stopPropagation()}>
             {rightElement}
           </div>
         )}
         <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
       </div>
    </div>
  )
}

export default function PatientFile({ patient, onUpdatePatient, onClose }: PatientFileProps) {
  const [activeTab, setActiveTab] = useState<'anamnesis' | 'evoluciones' | 'consentimientos' | 'fotografia' | 'comunicaciones'>('anamnesis');
  const [expandedSection, setExpandedSection] = useState<string>('motivo');
  
  // Consentimientos state
  const consentimientos = patient.consentimientos || [];
  const [newConsentType, setNewConsentType] = useState('Consentimiento General Quirúrgico');
  
  // Signature Drawing state
  const [signingId, setSigningId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!signingId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSigningId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [signingId]);

  // Legal Texts for Consents
  const CONSENT_TEXTS: Record<string, string> = {
    'Consentimiento General Quirúrgico': `INFORMACIÓN DE PROCEDIMIENTOS QUIRÚRGICOS DENTALES (Extracciones, Implantes, Cirugías):

Yo, el firmante, por la presente doy el consentimiento para que los profesionales de PerioClinic realicen los procedimientos quirúrgicos bucales requeridos en mi plan de cuidados. Comprendo que intervenciones como exodoncias bucales sencillas o complejas, así como la colocación de implantes oseointegrados, conllevan ciertos riesgos y eventuales efectos secundarios inherentes:
1. Dolor localizado y molestias posoperatorias manejables mediante analgésicos.
2. Sangrado controlado o hematomas pasajeros en el área de intervención.
3. Posible inflamación de los tejidos blandos durante 48 a 72 horas.
4. Riesgo infrecuente de parestesias pasajeras o infección menor.

He sido debidamente informado(a) sobre los autocuidados posoperatorios, la necesidad de higiene rigurosa, y acepto acatar todas las indicaciones médicas impartidas.`,

    'Consentimiento Periodontal': `INFORMACIÓN Y REQUISITOS DEL TRATAMIENTO DE PERIODONCIA (Destartraje, Alisado Radicular, Mantenimiento):

Yo declaro estar plenamente informado(a) acerca de mi diagnóstico de salud de los tejidos que soportan mis dientes (Periodontitis / Gingivitis) y las indicaciones del plan terapéutico. Comprendo que el tratamiento periodontal clínico persigue detener o retrasar el avance de la enfermedad activa mediante raspaje profundo mecánico, alisado de raíces y, de ser necesario, cirugías periodontales de colgajo.
Declaro comprender los riesgos y consecuencias normales del tratamiento:
1. Sensibilidad térmica transitoria de las piezas al calor o frío.
2. Retracción natural de encías a su nivel no inflamado (los dientes lucirán más largos tras sanarse el edema).
3. Ligera movilidad residual transitoria en piezas con soporte óseo mermado.
4. Requerimiento ineludible de asistir a las citas de re-evaluación periodontal y mantenciones periódicas indicadas.`,

    'Consentimiento Endodoncia': `INFORMACIÓN DE PROCEDIMIENTO DE ENDODONCIA (Tratamiento de Conductos):

Por el presente documento, apruebo la realización de la terapia endodóntica (tratamiento e irrigación de conductos radiculares). Comprendo que el fin prioritario es aliviar el dolor agudo o crónico e intentar salvar y conservar la pieza dental afectada por un proceso de necrosis o pulpitis irreversible.
Acepto y entiendo los siguientes riesgos clínicos y advertencias fundamentales:
1. Posibilidad de molestias temporales tras la cita clínica al cerrarse o irrigarse la pieza.
2. Riesgo inherente de fracturas de instrumentos finos en conductos estrechos, curvos o calcificados.
3. Posibilidad de decoloración pasiva de la corona con el transcurso de los años.
4. Necesidad ineludible de restaurar permanentemente el diente (con perno y corona o incrustación) inmediatamente después de culminar la endodoncia para evitar fracturas catastróficas.`
  };

  const handleAddConsentimiento = () => {
    const newConsent: Consentimiento = {
      id: `cons-${Date.now()}`,
      date: new Date().toISOString(),
      documentType: newConsentType,
      signature: null,
    };
    onUpdatePatient({
      ...patient,
      consentimientos: [...consentimientos, newConsent]
    });

    recordHipaaAudit("CREATE_CONSENT_FORM", `Generación de formulario: "${newConsentType}" para paciente ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Consentimientos Informados Legales",
      severity: "info"
    });
  };

  const handleSignConsentimiento = (id: string) => {
    setSigningId(id);
  };

  const handleDeleteConsentimiento = (id: string) => {
    const consentToDelete = consentimientos.find(c => c.id === id);
    const updated = consentimientos.filter(c => c.id !== id);
    onUpdatePatient({ ...patient, consentimientos: updated });

    recordHipaaAudit("DELETE_CONSENT_FORM", `Eliminación de consentimiento informado (${consentToDelete?.documentType || id}) de ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Consentimientos Informados Legales",
      severity: "warning"
    });
  };

  // Canvas Drawing logic for mobile & desktop
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = '#0d9488'; // teal-600
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const coords = getEventCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !signingId) return;
    
    const signatureDataUrl = canvas.toDataURL('image/png');
    const signedDoc = consentimientos.find(c => c.id === signingId);
    const updated = consentimientos.map(c => 
      c.id === signingId ? { ...c, signature: signatureDataUrl } : c
    );
    
    onUpdatePatient({ ...patient, consentimientos: updated });
    setSigningId(null);

    recordHipaaAudit("SIGN_CONSENT_FORM", `Firma biométrica estampada en consentimiento "${signedDoc?.documentType || 'Documento Legal'}" por ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Consentimientos Informados Legales",
      severity: "info"
    });
  };

  const getEventCoords = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };
  
  // Anamnesis State
  const [anamnesis, setAnamnesis] = useState<Anamnesis>(patient.anamnesis || {
    motivoConsulta: "",
    historiaMotivoConsulta: "",
    hta: false,
    diabetes: false,
    tabaquismo: 0,
    alergias: "",
    dolorActual: "ninguno",
    notasSistemicas: "",
  });

  const [activeSpecialty, setActiveSpecialty] = useState<string>(patient.activeSpecialty || "periodoncia");
  const [specialtyData, setSpecialtyData] = useState<Record<string, any>>(patient.specialtyData || {});

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if patient changes & record HIPAA access audit
  useEffect(() => {
    if (patient) {
      setAnamnesis(patient.anamnesis || {
        motivoConsulta: "",
        historiaMotivoConsulta: "",
        hta: false,
        diabetes: false,
        tabaquismo: 0,
        alergias: "",
        dolorActual: "ninguno",
        notasSistemicas: "",
      });
      setActiveSpecialty(patient.activeSpecialty || "periodoncia");
      setSpecialtyData(patient.specialtyData || {});
      setEvolutions(patient.evolutions || []);

      recordHipaaAudit("VIEW_PATIENT_RECORD", `Acceso a expediente clínico de ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: "Ficha & Anamnesis ePHI",
        severity: "info"
      });
    }
  }, [patient?.id]);

  // Record audit when switching sensitive subtabs in PatientFile
  useEffect(() => {
    if (patient?.id) {
      const tabLabels: Record<string, string> = {
        anamnesis: "Anamnesis & Historial Médico",
        evoluciones: "Evoluciones & Bitácora Clínica",
        consentimientos: "Consentimientos & Firmas Legales",
        fotografia: "Registro Fotográfico Clínico",
        comunicaciones: "Historial de Comunicaciones"
      };
      recordHipaaAudit("VIEW_PATIENT_SECTION", `Visualización de sección "${tabLabels[activeTab] || activeTab}" de ${patient.name}.`, {
        patientId: patient.id,
        patientName: patient.name,
        resource: `Expediente: ${tabLabels[activeTab] || activeTab}`,
        severity: "info"
      });
    }
  }, [activeTab, patient?.id]);

  // Evolutions State
  const [evolutions, setEvolutions] = useState<Evolution[]>(patient.evolutions || []);
  const [newEvolutionText, setNewEvolutionText] = useState("");
  const [deletingEvolutionId, setDeletingEvolutionId] = useState<string | null>(null);

  const handleSaveAnamnesis = () => {
    onUpdatePatient({ 
      ...patient, 
      anamnesis,
      activeSpecialty,
      specialtyData
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    recordHipaaAudit("UPDATE_PATIENT_RECORD", "Actualización de antecedentes sistémicos, factores de riesgo y anamnesis.", {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Anamnesis Clínica"
    });
  };

  const handleAddEvolution = () => {
    if (!newEvolutionText.trim()) return;
    const newEvol: Evolution = {
      id: `evo-${Date.now()}`,
      date: new Date().toISOString(),
      description: newEvolutionText,
      professional: "Dr. Principal" // Mock for now
    };
    const updatedEvolutions = [newEvol, ...evolutions];
    setEvolutions(updatedEvolutions);
    onUpdatePatient({ ...patient, evolutions: updatedEvolutions });
    setNewEvolutionText("");

    recordHipaaAudit("UPDATE_PATIENT_RECORD", `Nueva nota de evolución clínica: "${newEvolutionText.slice(0, 40)}..."`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Evolución y Bitácora ePHI"
    });
  };

  const handleDeleteEvolution = (id: string) => {
    setDeletingEvolutionId(id);
  };

  const executeDeleteEvolution = (id: string) => {
    const updatedEvolutions = evolutions.filter((e) => e.id !== id);
    setEvolutions(updatedEvolutions);
    onUpdatePatient({ ...patient, evolutions: updatedEvolutions });
    setDeletingEvolutionId(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="w-full text-slate-800 dark:text-slate-200 overflow-hidden rounded-2xl"
    >
      {/* Real-time Clinical Flow & Chair Tracker Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
              title="Cerrar ficha y volver al directorio de pacientes"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Directorio</span>
            </button>
          )}
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-300">Trazabilidad Clínica en Tiempo Real:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border ${
                patient.flowStatus === 'en_sillon' 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 animate-pulse'
                  : patient.flowStatus === 'espera'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : patient.flowStatus === 'atendido'
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : patient.flowStatus === 'completado'
                  ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                  : patient.flowStatus === 'ausente'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-700/50 border-slate-600 text-slate-300'
              }`}>
                {patient.flowStatus === 'en_sillon' ? `🟢 En Sillón (${patient.chairAssigned || 'Sillón 1'})`
                 : patient.flowStatus === 'espera' ? `🟡 En Sala de Espera (${patient.checkInTime ? `Llegó ${patient.checkInTime}` : 'En Recepción'})`
                 : patient.flowStatus === 'atendido' ? '🔵 Atendido / En Salida'
                 : patient.flowStatus === 'completado' ? '✅ Consulta Finalizada'
                 : patient.flowStatus === 'ausente' ? '🔴 Ausente'
                 : '⚪ Programado en Agenda'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Actualizar ubicación física del paciente para informar a recepción y equipo clínico
            </p>
          </div>
        </div>

        {/* Quick Flow Transition Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              onUpdatePatient({
                ...patient,
                flowStatus: 'espera',
                checkInTime: patient.checkInTime || now,
                statusUpdatedAt: now
              });
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              patient.flowStatus === 'espera' 
                ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-amber-500/30'
            }`}
          >
            🟡 LLegó / En Espera
          </button>

          <button
            type="button"
            onClick={() => {
              const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              onUpdatePatient({
                ...patient,
                flowStatus: 'en_sillon',
                chairAssigned: patient.chairAssigned || 'Sillón 1',
                statusUpdatedAt: now
              });
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              patient.flowStatus === 'en_sillon' 
                ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-sm' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border-emerald-500/30'
            }`}
          >
            🟢 Pasar a Sillón
          </button>

          {patient.flowStatus === 'en_sillon' && (
            <select
              value={patient.chairAssigned || 'Sillón 1'}
              onChange={(e) => {
                onUpdatePatient({
                  ...patient,
                  chairAssigned: e.target.value
                });
              }}
              className="text-xs bg-slate-800 border border-teal-500/40 text-teal-200 rounded-xl px-2 py-1 font-bold outline-none cursor-pointer"
            >
              <option value="Sillón 1">Sillón 1</option>
              <option value="Sillón 2">Sillón 2</option>
              <option value="Sillón 3">Sillón 3</option>
              <option value="Gabinete Quirúrgico">Gabinete Quirúrgico</option>
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              onUpdatePatient({
                ...patient,
                flowStatus: 'atendido',
                statusUpdatedAt: now
              });
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              patient.flowStatus === 'atendido' 
                ? 'bg-sky-500 text-slate-950 font-black border-sky-400 shadow-sm' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-sky-300 border-sky-500/30'
            }`}
          >
            🔵 Atendido / Salida
          </button>

          <button
            type="button"
            onClick={() => {
              const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              onUpdatePatient({
                ...patient,
                flowStatus: 'completado',
                statusUpdatedAt: now
              });
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              patient.flowStatus === 'completado' 
                ? 'bg-teal-500 text-slate-950 font-black border-teal-400 shadow-sm' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-teal-300 border-teal-500/30'
            }`}
          >
            ✅ Concluido
          </button>
        </div>
      </div>

      {/* Patient Demographic & Identification Ribbon */}
      <div className="bg-slate-900/90 text-white px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center font-display font-black text-teal-300 text-sm">
            {patient.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">{patient.name}</h2>
              {patient.rut ? (
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-mono font-bold">
                  RUT: {patient.rut}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-mono">
                  Sin RUT
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5 flex-wrap font-medium">
              <span className="font-mono">Expediente: #{patient.id.split('-')[1] || patient.id}</span>
              {patient.birthdate && <span>🎂 {patient.birthdate}</span>}
              {patient.phone && <span>📞 {patient.phone}</span>}
              {patient.email && <span>✉️ {patient.email}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Lifecycle Status & Staging Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 rounded-t-none flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Estado Clínico:</span>
          
          {[
            { id: 'evaluacion', label: 'Evaluación', color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300' },
            { id: 'en_tratamiento', label: 'En Tratamiento', color: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300' },
            { id: 'mantenimiento', label: 'Mantenimiento', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' },
            { id: 'alta', label: 'Alta Clínica', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300' },
            { id: 'inactivo', label: 'Inactivo', color: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400' },
          ].map(st => {
            const isSelected = (patient.status || 'en_tratamiento') === st.id;
            return (
              <button
                key={st.id}
                onClick={() => {
                  onUpdatePatient({
                    ...patient,
                    status: st.id as any
                  });
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected ? `${st.color} ring-2 ring-teal-500/50 scale-105 shadow-xs` : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* AAP 2018 Staging Selector */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400">AAP 2018:</span>
          <select
            value={patient.periodontalRisk?.stage || 'II'}
            onChange={(e) => {
              const currentRisk = patient.periodontalRisk || { stage: 'II', grade: 'B', riskLevel: 'medio' };
              onUpdatePatient({
                ...patient,
                periodontalRisk: { ...currentRisk, stage: e.target.value as any }
              });
            }}
            className="text-xs font-bold bg-transparent border-0 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="I">Estadio I (Incipiente)</option>
            <option value="II">Estadio II (Moderado)</option>
            <option value="III">Estadio III (Severo)</option>
            <option value="IV">Estadio IV (Avanzado)</option>
          </select>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <select
            value={patient.periodontalRisk?.grade || 'B'}
            onChange={(e) => {
              const currentRisk = patient.periodontalRisk || { stage: 'II', grade: 'B', riskLevel: 'medio' };
              onUpdatePatient({
                ...patient,
                periodontalRisk: { ...currentRisk, grade: e.target.value as any }
              });
            }}
            className="text-xs font-bold bg-transparent border-0 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="A">Grado A (Progresión Lenta)</option>
            <option value="B">Grado B (Moderada)</option>
            <option value="C">Grado C (Rápida / Fuma/Diab.)</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl px-4 sm:px-6 pt-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('anamnesis')}
          className={`px-4 sm:px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'anamnesis' 
              ? 'border-teal-500 text-teal-600 dark:text-teal-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          Anamnesis & Historial Medico
        </button>
        <button
          onClick={() => setActiveTab('evoluciones')}
          className={`px-4 sm:px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'evoluciones' 
              ? 'border-teal-500 text-teal-600 dark:text-teal-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Activity className="w-4 h-4" />
          Evoluciones Clínicas
        </button>
        <button
          onClick={() => setActiveTab('consentimientos')}
          className={`px-4 sm:px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'consentimientos' 
              ? 'border-teal-500 text-teal-600 dark:text-teal-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <PenTool className="w-4 h-4" />
          Consentimientos & Firma
        </button>
        <button
          onClick={() => setActiveTab('fotografia')}
          className={`px-4 sm:px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'fotografia' 
              ? 'border-teal-500 text-teal-600 dark:text-teal-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Camera className="w-4 h-4" />
          Fotografía Clínica (Antes/Después)
        </button>
        <button
          onClick={() => setActiveTab('comunicaciones')}
          className={`px-4 sm:px-6 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'comunicaciones' 
              ? 'border-teal-500 text-teal-600 dark:text-teal-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Recordatorios & WhatsApp
        </button>
      </div>

      {/* Content */}
      <div className="p-6 bg-slate-50/30 dark:bg-slate-900/50 w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'anamnesis' && (
            <motion.div
              key="anamnesis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto"
            >
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1 flex flex-col gap-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 h-fit sticky top-4 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2 block font-mono">
                  Secciones de Anamnesis
                </span>
                {[
                  { id: 'motivo', label: 'Motivo de Consulta', icon: FileText, desc: 'Dolor y motivo principal' },
                  { id: 'sistemico', label: 'Historial Sistémico', icon: HeartPulse, desc: 'Alergias, diabetes, HTA' },
                  { id: 'bioseguridad', label: 'Bioseguridad y Alertas', icon: ShieldAlert, desc: 'Anticoagulación, INR, MRONJ, PA' },
                  { id: 'especializacion', label: 'Cuestionario Clínico', icon: Activity, desc: 'Especialidades dentales' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = expandedSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setExpandedSection(item.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 border cursor-pointer ${
                        isActive
                          ? 'bg-teal-500/10 border-teal-500/20 text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 font-black'
                          : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-teal-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate">{item.label}</span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-500 truncate">{item.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Content Panels Area */}
              <div className="lg:col-span-3 space-y-6">

                {/* MATRIZ DE BIOSEGURIDAD Y ALERTAS ACTIVAS EN TIEMPO REAL */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-5 border border-slate-700/80 shadow-md relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
                        <ShieldAlert className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                          Matriz de Bioseguridad & Protocolo de Tratamiento Seguro
                          <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                            Multidisciplinar
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-300">Verificación biológica automática de riesgos quirúrgicos y de sedación</p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Alert Chips */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {/* Alerta MRONJ / Bifosfonatos */}
                    {anamnesis.bifosfonatos ? (
                      <div className="bg-rose-950/80 border border-rose-500/40 p-3 rounded-xl flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-rose-200">🔴 RIESGO MRONJ (OSTEONECROSIS MAXILAR)</div>
                          <div className="text-[10px] text-rose-300/90 leading-tight mt-0.5">
                            Paciente en terapia con Bifosfonatos/Denosumab ({anamnesis.viaBifosfonatos === 'intravenoso' ? 'VÍA INTRAVENOSA - ALTO RIESGO' : 'Vía Oral'}). Evitar exodoncias e implantes sin protocolo de suspensión médica previa.
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Alerta Anticoagulación / INR */}
                    {anamnesis.anticoagulantes ? (
                      <div className="bg-amber-950/80 border border-amber-500/40 p-3 rounded-xl flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-amber-200">🟠 ALERTA HEMORRÁGICA (INR: {anamnesis.valorINR || 'Sin registrar'})</div>
                          <div className="text-[10px] text-amber-300/90 leading-tight mt-0.5">
                            Tratamiento activo con {anamnesis.tipoAnticoagulante || 'Anticoagulante'}. Verificar INR &lt; 3.0 antes de exodoncias o raspado profundo. Preparar hemostáticos locales.
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Alerta Presión Arterial / Vasoconstrictor */}
                    {(anamnesis.presionSistolica && anamnesis.presionSistolica >= 140) || (anamnesis.presionDiastolica && anamnesis.presionDiastolica >= 90) || anamnesis.hta ? (
                      <div className="bg-amber-900/60 border border-amber-500/30 p-3 rounded-xl flex items-start gap-2.5">
                        <HeartPulse className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-amber-200">
                            🟡 HIPERTENSIÓN Y ANESTESIA ({anamnesis.presionSistolica || 120}/{anamnesis.presionDiastolica || 80} mmHg)
                          </div>
                          <div className="text-[10px] text-amber-300/90 leading-tight mt-0.5">
                            Limitar vasoconstrictor (máx. 2 carpules con Epinefrina 1:100.000) o utilizar Mepivacaína al 3% sin vasoconstrictor si PA &gt; 160/100.
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Alerta Profilaxis Antibiótica */}
                    {anamnesis.profilaxisAntibiotica ? (
                      <div className="bg-sky-950/80 border border-sky-500/40 p-3 rounded-xl flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-sky-200">🔵 PROFILAXIS ANTIBIÓTICA REQUERIDA</div>
                          <div className="text-[10px] text-sky-300/90 leading-tight mt-0.5">
                            {anamnesis.razonProfilaxis || 'Prevención de Endocarditis Infecciosa'}. Indicar Amoxicilina 2g V.O. 1 hora antes (o Clindamicina 600mg).
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Alerta Embarazo */}
                    {anamnesis.embarazo ? (
                      <div className="bg-purple-950/80 border border-purple-500/40 p-3 rounded-xl flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-purple-200">🤰 EMBARAZO (Trimestre: {anamnesis.trimestreEmbarazo || '2do óptimo'})</div>
                          <div className="text-[10px] text-purple-300/90 leading-tight mt-0.5">
                            Usar chaleco plomado con collarín tiroideo si se requieren Rx. Fármacos seguros: Paracetamol y Penicilinas. Posición semi-reclinada.
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Alerta Alergias Anestesia / Látex */}
                    {(anamnesis.alergiaAnestesia && anamnesis.alergiaAnestesia !== 'Ninguna') || anamnesis.alergiaLatex || anamnesis.alergias ? (
                      <div className="bg-red-950/80 border border-red-500/40 p-3 rounded-xl flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-red-200">🚫 ALERGIAS Y BIOSEGURIDAD EN SILLÓN</div>
                          <div className="text-[10px] text-red-300/90 leading-tight mt-0.5">
                            {anamnesis.alergiaAnestesia && anamnesis.alergiaAnestesia !== 'Ninguna' ? `Anestésicos: ${anamnesis.alergiaAnestesia}. ` : ''}
                            {anamnesis.alergiaLatex ? 'LÁTEX: Usar exclusivamente guantes de Nitrilo. ' : ''}
                            {anamnesis.alergias}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Biotipo Periodontal Fino */}
                    {anamnesis.biotipoPeriodontal === 'fino' ? (
                      <div className="bg-teal-950/80 border border-teal-500/40 p-3 rounded-xl flex items-start gap-2.5">
                        <ShieldAlert className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-teal-200">📐 BIOTIPO PERIODONTAL FINO (RIESGO TISULAR)</div>
                          <div className="text-[10px] text-teal-300/90 leading-tight mt-0.5">
                            Alta vulnerabilidad a recesión gingival y reabsorción del hueso del margen vestibular. Evaluar injerto de tejido conectivo en cirugías/implantes.
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {!anamnesis.bifosfonatos && !anamnesis.anticoagulantes && !anamnesis.profilaxisAntibiotica && !anamnesis.embarazo && (!anamnesis.alergiaAnestesia || anamnesis.alergiaAnestesia === 'Ninguna') && !anamnesis.alergiaLatex && (!anamnesis.presionSistolica || anamnesis.presionSistolica < 140) && (
                      <div className="col-span-1 md:col-span-2 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-300">Paciente Apto para Procedimientos Estándar (Sin alertas críticas sistémicas)</span>
                        </div>
                        <span className="text-[10px] text-emerald-400/80 font-mono">Signos Vitales Estables</span>
                      </div>
                    )}
                  </div>
                </div>

              {/* SECCION 1: MOTIVO DE CONSULTA Y DOLOR */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <ToggleHeader id="motivo" icon={FileText} title="Motivo de Consulta" description="Razón principal de la visita y evaluación del dolor actual" expandedSection={expandedSection} setExpandedSection={setExpandedSection} />
                <AnimatePresence initial={false}>
                  {expandedSection === 'motivo' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo Principal</label>
                              <input 
                                type="text" 
                                placeholder="Ej. Dolor al morder, sangrado de encías, chequeo general" 
                                value={anamnesis.motivoConsulta || ""} 
                                onChange={(e) => setAnamnesis({...anamnesis, motivoConsulta: e.target.value})} 
                                className="w-full text-sm p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20" 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Historia del Motivo de Consulta</label>
                              <textarea 
                                rows={3} 
                                placeholder="Evolución del problema, cuándo inició, cómo se ha tratado antes..." 
                                value={anamnesis.historiaMotivoConsulta || ""} 
                                onChange={(e) => setAnamnesis({...anamnesis, historiaMotivoConsulta: e.target.value})} 
                                className="w-full text-sm p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 resize-y" 
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nivel de Dolor Actual</label>
                              <select 
                                value={anamnesis.dolorActual} 
                                onChange={(e) => setAnamnesis({...anamnesis, dolorActual: e.target.value as any})} 
                                className="w-full text-sm p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20"
                              >
                                <option value="ninguno">Ninguno (Control/Rutina)</option>
                                <option value="leve">Leve / Ocasional</option>
                                <option value="pulsatil">Pulsátil / Constante</option>
                                <option value="agudo">Agudo / Insoportable</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SECCION 2: SISTEMICO */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <ToggleHeader id="sistemico" icon={HeartPulse} title="Antecedentes Sistémicos y Alergias" description="Hipertensión, diabetes, tabaquismo y alergias conocidas" expandedSection={expandedSection} setExpandedSection={setExpandedSection} />
                <AnimatePresence initial={false}>
                  {expandedSection === 'sistemico' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input type="checkbox" checked={anamnesis.hta} onChange={(e) => setAnamnesis({...anamnesis, hta: e.target.checked})} className="w-4 h-4 text-teal-600 rounded dark:bg-slate-700 dark:border-slate-600 focus:ring-teal-500 focus:ring-2" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition-colors">Hipertensión Arterial (HTA)</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input type="checkbox" checked={anamnesis.diabetes} onChange={(e) => {
                                const checked = e.target.checked;
                                setAnamnesis({
                                  ...anamnesis,
                                  diabetes: checked,
                                  diabetesStatus: checked ? (anamnesis.diabetesStatus === 'none' ? 'controlled' : anamnesis.diabetesStatus) : 'none'
                                });
                              }} className="w-4 h-4 text-teal-600 rounded dark:bg-slate-700 dark:border-slate-600 focus:ring-teal-500 focus:ring-2" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition-colors">Diabetes Mellitus</span>
                            </label>

                            {anamnesis.diabetes && (
                              <div className="pl-7 pt-1 space-y-1 bg-white dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Estado y Control Glicémico (HbA1c):</label>
                                <select 
                                  value={anamnesis.diabetesStatus || "controlled"} 
                                  onChange={(e) => setAnamnesis({...anamnesis, diabetesStatus: e.target.value as any})}
                                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20"
                                >
                                  <option value="controlled">Diabetes Controlada (HbA1c &lt; 7.0%)</option>
                                  <option value="severe">Diabetes Descompensada (HbA1c &ge; 7.0%)</option>
                                </select>
                                <span className="text-[9px] text-teal-600/70 dark:text-teal-400/70 block mt-0.5">Esto influye directamente en el grado de riesgo óseo del Periodontograma.</span>
                              </div>
                            )}
                            
                            <div className="pt-2">
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tabaquismo (Cigarrillos / día)</label>
                              <input type="number" min="0" value={anamnesis.tabaquismo} onChange={(e) => setAnamnesis({...anamnesis, tabaquismo: parseInt(e.target.value) || 0})} className="w-full text-sm p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20" />
                            </div>

                            <div className="pt-2">
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Edad Simulada para Análisis PRA (Años)</label>
                              <input type="number" min="18" max="95" placeholder="P. ej., 45" value={anamnesis.edadSimulada || ""} onChange={(e) => setAnamnesis({...anamnesis, edadSimulada: parseInt(e.target.value) || undefined})} className="w-full text-sm p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20" />
                              <span className="text-[9px] text-slate-400 block mt-1">Si se deja vacío, se calculará automáticamente según su fecha de nacimiento registrada.</span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alergias Conocidas</label>
                              <textarea 
                                value={anamnesis.alergias} 
                                onChange={(e) => setAnamnesis({...anamnesis, alergias: e.target.value})} 
                                placeholder="Ej. Penicilina, AINES, Látex..."
                                rows={3}
                                className="w-full text-sm p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20" 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas Médicas y Otros Antecedentes Fisiológicos</label>
                              <textarea 
                                value={anamnesis.notasSistemicas} 
                                onChange={(e) => setAnamnesis({...anamnesis, notasSistemicas: e.target.value})} 
                                placeholder="Otros detalles sistémicos, embarazo, uso de anticoagulantes, bisfofonatos..."
                                rows={4}
                                className="w-full text-sm p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 resize-y" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SECCION 3: BIOSEGURIDAD Y PROTOCOLOS DE SEGURIDAD CLÍNICA */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <ToggleHeader 
                  id="bioseguridad" 
                  icon={ShieldAlert} 
                  title="Bioseguridad y Alertas Clínicas de Seguridad" 
                  description="Anticoagulación, INR, MRONJ/Bifosfonatos, Signos Vitales, Anestesia y Profilaxis" 
                  expandedSection={expandedSection} 
                  setExpandedSection={setExpandedSection} 
                />
                <AnimatePresence initial={false}>
                  {expandedSection === 'bioseguridad' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 space-y-6">
                        
                        {/* BLOQUE 1: SIGNOS VITALES Y ANESTESIA SEGURA */}
                        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-700/60">
                            <HeartPulse className="w-4 h-4" /> Signos Vitales en Sillón & Elección de Anestésico
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Presión Arterial Sistólica (mmHg)</label>
                              <input 
                                type="number" 
                                placeholder="120" 
                                value={anamnesis.presionSistolica || 120} 
                                onChange={(e) => setAnamnesis({...anamnesis, presionSistolica: parseInt(e.target.value) || 0})}
                                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Presión Arterial Diastólica (mmHg)</label>
                              <input 
                                type="number" 
                                placeholder="80" 
                                value={anamnesis.presionDiastolica || 80} 
                                onChange={(e) => setAnamnesis({...anamnesis, presionDiastolica: parseInt(e.target.value) || 0})}
                                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alergia a Anestésicos Locales</label>
                              <select 
                                value={anamnesis.alergiaAnestesia || "Ninguna"} 
                                onChange={(e) => setAnamnesis({...anamnesis, alergiaAnestesia: e.target.value})}
                                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                              >
                                <option value="Ninguna">Sin alergias anestésicas conocidas</option>
                                <option value="Lidocaína">Alergia declarada a Lidocaína</option>
                                <option value="Articaína">Alergia declarada a Articaína</option>
                                <option value="Mepivacaína">Alergia declarada a Mepivacaína</option>
                                <option value="Bisulfito de Sodio">Alergia a Bisulfito / Sulfito (Conservante Epinefrina)</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* Recomendación Anestésica en Tiempo Real */}
                          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                            (anamnesis.presionSistolica && anamnesis.presionSistolica >= 140) || (anamnesis.presionDiastolica && anamnesis.presionDiastolica >= 90)
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                          }`}>
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">
                                {(anamnesis.presionSistolica && anamnesis.presionSistolica >= 140) || (anamnesis.presionDiastolica && anamnesis.presionDiastolica >= 90)
                                  ? '⚠️ Alerta de Vasoconstrictor Anestésico:'
                                  : '✓ Protocolo Anestésico Estándar Seguro:'}
                              </span>
                              {(anamnesis.presionSistolica && anamnesis.presionSistolica >= 140) || (anamnesis.presionDiastolica && anamnesis.presionDiastolica >= 90)
                                ? 'Presión arterial en estadio elevado. Se aconseja utilizar Mepivacaína al 3% sin vasoconstrictor o limitar la anestesia con Epinefrina 1:100.000 a un máximo estricto de 2 carpules.'
                                : 'Presión arterial dentro de parámetros normales. Se permite el uso de Lidocaína o Articaína con Epinefrina 1:100.000 bajo aspiración previa rutinaria.'}
                            </div>
                          </div>
                        </div>

                        {/* BLOQUE 2: COAGULACIÓN, ANTICOAGULANTES E INR */}
                        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-700/60">
                            <Activity className="w-4 h-4" /> Control de Hemostasia y Terapia Anticoagulante
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={anamnesis.anticoagulantes || false} 
                                onChange={(e) => setAnamnesis({...anamnesis, anticoagulantes: e.target.checked})} 
                                className="w-4 h-4 text-rose-600 rounded dark:bg-slate-700 dark:border-slate-600 focus:ring-rose-500 focus:ring-2" 
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">¿Tratamiento Anticoagulante Activo?</span>
                                <span className="text-[10px] text-slate-400">Aspirina, Warfarina, Rivaroxabán, Apixabán, etc.</span>
                              </div>
                            </label>

                            {anamnesis.anticoagulantes && (
                              <>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Anticoagulante</label>
                                  <input 
                                    type="text" 
                                    placeholder="Ej. Warfarina / Rivaroxabán 20mg / Aspirina 100mg" 
                                    value={anamnesis.tipoAnticoagulante || ""} 
                                    onChange={(e) => setAnamnesis({...anamnesis, tipoAnticoagulante: e.target.value})}
                                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor INR Reciente (Laboratorio)</label>
                                  <input 
                                    type="text" 
                                    placeholder="Ej. 2.1 (Aceptable si < 3.0)" 
                                    value={anamnesis.valorINR || ""} 
                                    onChange={(e) => setAnamnesis({...anamnesis, valorINR: e.target.value})}
                                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 font-mono font-bold"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* BLOQUE 3: OSTEONECROSIS Y BIFOSFONATOS (MRONJ) */}
                        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-700/60">
                            <ShieldAlert className="w-4 h-4" /> Prevención de Osteonecrosis Maxilar (MRONJ)
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={anamnesis.bifosfonatos || false} 
                                onChange={(e) => setAnamnesis({...anamnesis, bifosfonatos: e.target.checked})} 
                                className="w-4 h-4 text-purple-600 rounded dark:bg-slate-700 dark:border-slate-600 focus:ring-purple-500 focus:ring-2" 
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">¿Uso de Bifosfonatos o Denosumab?</span>
                                <span className="text-[10px] text-slate-400">Tratamiento para Osteoporosis o Metástasis Ósea</span>
                              </div>
                            </label>

                            {anamnesis.bifosfonatos && (
                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vía de Administración</label>
                                <select 
                                  value={anamnesis.viaBifosfonatos || "oral"} 
                                  onChange={(e) => setAnamnesis({...anamnesis, viaBifosfonatos: e.target.value as any})}
                                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 font-bold text-purple-700 dark:text-purple-300"
                                >
                                  <option value="oral">Vía Oral (Alendronato, Ibandronato - Riesgo Moderado)</option>
                                  <option value="intravenoso">Vía Intravenosa (Ácido Zoledrónico, Denosumab - RIESGO ALTO MRONJ)</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* BLOQUE 4: PROFILAXIS ANTIBIÓTICA Y EMBARAZO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Profilaxis */}
                          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-700/60">
                              <Info className="w-4 h-4" /> Profilaxis Antibiótica Pre-Procedimiento
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={anamnesis.profilaxisAntibiotica || false} 
                                onChange={(e) => setAnamnesis({...anamnesis, profilaxisAntibiotica: e.target.checked})} 
                                className="w-4 h-4 text-sky-600 rounded dark:bg-slate-700 dark:border-slate-600 focus:ring-sky-500 focus:ring-2" 
                              />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Requiere Profilaxis Antibiótica Previa</span>
                            </label>
                            {anamnesis.profilaxisAntibiotica && (
                              <input 
                                type="text" 
                                placeholder="Causa: Ej. Prótesis valvular, soplo, prótesis de cadera" 
                                value={anamnesis.razonProfilaxis || ""} 
                                onChange={(e) => setAnamnesis({...anamnesis, razonProfilaxis: e.target.value})}
                                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"
                              />
                            )}
                          </div>

                          {/* Embarazo & Biotipo */}
                          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-700/60">
                              <ShieldAlert className="w-4 h-4" /> Embarazo & Biotipo Periodontal
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Embarazo Activo</label>
                                <select 
                                  value={anamnesis.embarazo ? (anamnesis.trimestreEmbarazo || "2do") : "no"} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "no") {
                                      setAnamnesis({...anamnesis, embarazo: false, trimestreEmbarazo: undefined});
                                    } else {
                                      setAnamnesis({...anamnesis, embarazo: true, trimestreEmbarazo: val as any});
                                    }
                                  }}
                                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                                >
                                  <option value="no">No embarazada</option>
                                  <option value="1er">1er Trimestre</option>
                                  <option value="2do">2do Trimestre (Óptimo)</option>
                                  <option value="3er">3er Trimestre</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Biotipo Periodontal</label>
                                <select 
                                  value={anamnesis.biotipoPeriodontal || "medio"} 
                                  onChange={(e) => setAnamnesis({...anamnesis, biotipoPeriodontal: e.target.value as any})}
                                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold"
                                >
                                  <option value="fino">Fino (Alto riesgo recesión)</option>
                                  <option value="medio">Medio (Resistencia media)</option>
                                  <option value="grueso">Grueso (Poco proclive recesión)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cuestionario Clínico Especializado de Dental */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <ToggleHeader 
                  id="especializacion" 
                  icon={ShieldAlert} 
                  title="Historial Clínico Especializado" 
                  description="Cuestionario específico según la especialidad dental" 
                  expandedSection={expandedSection} 
                  setExpandedSection={setExpandedSection} 
                  rightElement={
                    <select
                      value={activeSpecialty}
                      onChange={(e) => setActiveSpecialty(e.target.value)}
                      className="text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-teal-600 dark:text-teal-400 outline-none cursor-pointer focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="periodoncia">📊 Periodoncia</option>
                      <option value="endodoncia">⚡ Endodoncia</option>
                      <option value="ortodoncia">📐 Ortodoncia</option>
                      <option value="cirugia">✂️ Cirugía</option>
                      <option value="rehabilitacion">✨ Rehabilitación</option>
                      <option value="odontopediatria">👶 Odontopediatría</option>
                    </select>
                  }
                />
                
                <AnimatePresence initial={false}>
                  {expandedSection === 'especializacion' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40">
                  {/* Render Periodoncia Specific History */}
                  {activeSpecialty === "periodoncia" && (
                    <div className="space-y-6 animate-fade-in animate-duration-205">
                      <div className="flex items-center gap-2 text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Activity className="w-4 h-4" /> Periodoncia, Soporte Óseo & Salud Gingival Avanzada
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                        {/* CUESTIONARIO SUB-SECCIÓN 1: SÍNTOMAS DEL PACIENTE */}
                        <div className="col-span-1 md:col-span-2">
                          <h4 className="text-[10px] font-black uppercase text-teal-500 dark:text-teal-500 tracking-widest mb-1">1. Sintomatología Subjetiva</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">¿Sangrado gingival espontáneo o al cepillado?</label>
                          <select
                            value={specialtyData.perioBleeding || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, perioBleeding: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">No reporta sangrado</option>
                            <option value="leve">Leve (Ocasionalmente al cepillar)</option>
                            <option value="moderado">Moderado (Frecuente tras el cepillado)</option>
                            <option value="severo">Severo (Sangrado espontáneo o nocturno)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">¿Ha notado movilidad u holgura en sus dientes?</label>
                          <select
                            value={specialtyData.perioMobilitySelf || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, perioMobilitySelf: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">No, dientes firmes</option>
                            <option value="ligera">Ligera en ciertas piezas</option>
                            <option value="moderada">Movilidad moderada de soporte</option>
                            <option value="severa">Movilidad severa pronunciada</option>
                          </select>
                        </div>

                        {/* CUESTIONARIO SUB-SECCIÓN 2: EXAMEN CLÍNICO PERIODONTAL */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-teal-500 dark:text-teal-500 tracking-widest mb-1">2. Examen Físico e Historial Clínico</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Color y Aspecto Gingival Predominante:</label>
                          <select
                            value={specialtyData.perioGingivalColor || "rosa"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, perioGingivalColor: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="rosa">Rosa pálido / Textura puntillada (Sano)</option>
                            <option value="rojo">Rojo eritematoso / Edematoso (Inflamación activa)</option>
                            <option value="azul">Azul cianótico / Isquémico (Enfermedad crónica avanzada)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Presencia de Supuración / Exudado Purulento:</label>
                          <select
                            value={specialtyData.perioSuppuration || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, perioSuppuration: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">Ausente (Sin exudado)</option>
                            <option value="si">Presente al sondado o presión digital ligera</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Pérdida Ósea Radiográfica Observada:</label>
                          <select
                            value={specialtyData.perioBoneLoss || "ninguna"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, perioBoneLoss: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="ninguna">Ninguna pérdida visible (Cresta intacta)</option>
                            <option value="horizontal_leve">Horizontal Leve (&lt;15% o Tercio Apical intacto)</option>
                            <option value="horizontal_mod">Horizontal Moderada (15% a 33%)</option>
                            <option value="horizontal_sev">Horizontal Severa / Crítica (&gt;33%)</option>
                            <option value="vertical">Defectos Angulares / Pérdida ósea vertical compleja</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Involucramiento de Furca (Dientes Multirradiculares):</label>
                          <select
                            value={specialtyData.perioFurca || "grado_0"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, perioFurca: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="grado_0">Sin lesión de furca (Grado 0)</option>
                            <option value="grado_1">Grado I (Pérdida horizontal &le; 3mm debajo de la corona)</option>
                            <option value="grado_2">Grado II (Pérdida horizontal &gt; 3mm sin atravesar)</option>
                            <option value="grado_3">Grado III (Pérdida total túnel de lado a lado)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Presencia de Cálculo / Sarro Acumulado:</label>
                          <select
                            value={specialtyData.perioCalculus || "leve"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, perioCalculus: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="ninguno">Ninguno visible o detectable</option>
                            <option value="leve">Leve (Supragingival lingual/vestibular anterior)</option>
                            <option value="moderado">Moderado (Puentes de cálculo o subgingival incipiente)</option>
                            <option value="abundante">Subgingival Abundante y Generalizado</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Última profilaxis / limpieza profesional:</label>
                          <select
                            value={specialtyData.perioCleanTime || "6_a_12_meses"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, perioCleanTime: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="menos_6_meses">Hace menos de 6 meses</option>
                            <option value="6_a_12_meses">6 a 12 meses atrás</option>
                            <option value="mas_12_meses">Más de 12 meses atrás / Nunca</option>
                          </select>
                        </div>

                        {/* CUESTIONARIO SUB-SECCIÓN 3: FACTORES HIGIENE */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-teal-500 dark:text-teal-500 tracking-widest mb-1">3. Protocolos de Higiene & Factores de Riesgo</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Halitosis clínicamente detectable:</label>
                          <select
                            value={specialtyData.perioHalitosis || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, perioHalitosis: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">No reportado / Ausente</option>
                            <option value="ocasional">Ocasional declarada por el paciente</option>
                            <option value="persistente">Persistente con origen respiratorio u oral detectable</option>
                          </select>
                        </div>
                        <div className="space-y-3 flex flex-col justify-center">
                          <label className="flex items-center gap-2 text-xs text-slate-705 dark:text-slate-300 font-bold cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={specialtyData.perioFamilyLoss || false}
                              onChange={(e) => setSpecialtyData({ ...specialtyData, perioFamilyLoss: e.target.checked })}
                              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                            />
                            Antecedente familiar directo de pérdida dental por Periodontitis
                          </label>
                        </div>
                        
                        <div className="col-span-1 md:col-span-2 space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Implementos de higiene adicionales (Hilo dental, cepillo interproximal, irrigador):</label>
                          <textarea
                            value={specialtyData.perioHygieneTools || ""}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, perioHygieneTools: e.target.value })}
                            placeholder="Ej: Cepillo interproximal marca TePe de 0.6mm tres veces al día, pasta GUM..."
                            rows={2}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/15"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Endodoncia Specific History */}
                  {activeSpecialty === "endodoncia" && (
                    <div className="space-y-6 animate-fade-in animate-duration-205">
                      <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Zap className="w-4 h-4" /> Endodoncia, Diagnóstico Pulpar & Pruebas Fisiológicas
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                        {/* SECCIÓN 1: EXAMEN SINTOMÁTICO */}
                        <div className="col-span-1 md:col-span-2">
                          <h4 className="text-[10px] font-black uppercase text-amber-500 dark:text-amber-500 tracking-widest mb-1">1. Sintomatología y Estímulos Térmicos</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">¿Dolor provocado por cambios térmicos (Frío / Calor)?</label>
                          <select
                            value={specialtyData.endoThermalPain || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, endoThermalPain: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">Sin dolor al frío/calor</option>
                            <option value="transitorio">Leve (Desaparece de inmediato)</option>
                            <option value="persistente">Persistente (Dolor severo prolongado por minutos)</option>
                            <option value="espontaneo">Espontáneo (Comienza sin estímulo alguno)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Localización del Dolor reportado:</label>
                          <select
                            value={specialtyData.endoPainType || "localizado"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, endoPainType: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="localizado">Localizado (El paciente señala la pieza exacta)</option>
                            <option value="radiado">Irradiado o Difuso (Se esparce a la mandíbula o maxilar)</option>
                            <option value="referido">Referido (Dolor de origen neurológico / muscular o sinusitis)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">¿Dolor o molestia al masticar / percusión?</label>
                          <select
                            value={specialtyData.endoBitePain || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, endoBitePain: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">Sin dolor al morder</option>
                            <option value="leve">Sensibilidad o molestia ocasional</option>
                            <option value="severo">Dolor severo opresivo al tacto/masticar</option>
                          </select>
                        </div>
                        
                        {/* SECCIÓN 2: EXAMEN FÍSICO PULPAR */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-amber-500 dark:text-amber-500 tracking-widest mb-1">2. Pruebas Diagnósticas Pulpares y Periapicales</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Prueba de Percusión Clínica Directa:</label>
                          <select
                            value={specialtyData.endoPercussion || "negativo"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, endoPercussion: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="negativo">Negativo (Respuesta sana estándar)</option>
                            <option value="v_positivo">Percusión Vertical Altamente Positiva (Compromiso periodontal apical apical)</option>
                            <option value="h_positivo">Percusión Horizontal Positiva (Compromiso periodontal lateral)</option>
                            <option value="ambos_positivo">Altamente positivo en vertical y horizontal</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Prueba de Vitalidad al Frío (Endo-Ice / Tetracloroetano):</label>
                          <select
                            value={specialtyData.endoPulparTest || "sana"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, endoPulparTest: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="sana">Respuesta Normal (Desaparece en 2-4 seg, Pulpa Sana)</option>
                            <option value="hiperalgesia_rev">Dolor rápido transitorio (Pulpitis Reversible)</option>
                            <option value="hiperalgesia_irrev">Dolor persistente por minutos (Pulpitis Irreversible)</option>
                            <option value="necrosis">Muerte Pulpar / Sin Respuesta (Necrosis absoluta)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Palpación Apical de la zona vestibular:</label>
                          <select
                            value={specialtyData.endoPalpation || "indolora"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, endoPalpation: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="indolora">Indolora y plana (Tejidos normales)</option>
                            <option value="sensible">Sensible (Inflamación ósea periapical inminente)</option>
                            <option value="fluctuante">Zona fluctuante indurada o con inflamación (Absceso)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Hallazgo Radiográfico Periapical:</label>
                          <select
                            value={specialtyData.endoRadiography || "normal"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, endoRadiography: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="normal">Espacio del ligamento periodontal normal</option>
                            <option value="ensanchado">Ensanchamiento evidente del ligamento periodontal (Apical)</option>
                            <option value="radiolucidez">Radiolucidez circumscripta apical (Quiste / Periodontitis apical)</option>
                            <option value="osteitis">Osteítis Condensante (Hueso esclerosado reactivo)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Restauraciones Previas en la Pieza:</label>
                          <select
                            value={specialtyData.endoPrevRestorations || "ninguna"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, endoPrevRestorations: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="ninguna">Ninguna (Estructura intacta o caries virgen)</option>
                            <option value="resina_profunda">Resina o Amalgama profunda cercana a cámara pulpar</option>
                            <option value="corona">Corona protésica completa</option>
                            <option value="poste">Perno o Poste intrarradicular de metal/fibra</option>
                          </select>
                        </div>

                        {/* SECCIÓN 3: COMPROMISO FISIOLÓGICO */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-amber-500 dark:text-amber-500 tracking-widest mb-1">3. Estado Clínico y Traumatismos</h4>
                        </div>
                        <div className="space-y-2 flex flex-col justify-center">
                          <label className="flex items-center gap-2 text-xs text-slate-705 dark:text-slate-300 font-bold cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={specialtyData.endoNightPain || false}
                              onChange={(e) => setSpecialtyData({ ...specialtyData, endoNightPain: e.target.checked })}
                              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                            />
                            ¿Presenta dolor punzante espontáneo nocturno (Pulpitis Aguda)?
                          </label>
                        </div>
                        <div className="space-y-2 flex flex-col justify-center">
                          <label className="flex items-center gap-2 text-xs text-slate-705 dark:text-slate-300 font-bold cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={specialtyData.endoSwelling || false}
                              onChange={(e) => setSpecialtyData({ ...specialtyData, endoSwelling: e.target.checked })}
                              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                            />
                            ¿Ha presentado inflamación extraoral, absceso o fístula recurrente?
                          </label>
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Antecedentes de traumatismos, golpes o fisuras dentales reportadas:</label>
                          <input
                            type="text"
                            value={specialtyData.endoTraumaTime || ""}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, endoTraumaTime: e.target.value })}
                            placeholder="Ej. Caída hace 2 años con fractura coronaria de diente 11..."
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-805 border border-slate-201 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Ortodoncia Specific History */}
                  {activeSpecialty === "ortodoncia" && (
                    <div className="space-y-6 animate-fade-in animate-duration-205">
                      <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Layers className="w-4 h-4" /> Ortodoncia, Crecimiento, Relación Oclusión & Hábitos
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                        {/* SECCIÓN 1: PRINCIPAL ANGLE DENTAL */}
                        <div className="col-span-1 md:col-span-2">
                          <h4 className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-500 tracking-widest mb-1">1. Diagnóstico Morfológico Dental y Esqueletal</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Clase de Relación Molar (Angle):</label>
                          <select
                            value={specialtyData.orthoDentalClass || "clase_1"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, orthoDentalClass: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="clase_1">Clase I (Molar normal y oclusión balanceada)</option>
                            <option value="clase_2_1">Clase II División 1 (Molar distalizado, incisivos salidos/proclina)</option>
                            <option value="clase_2_2">Clase II División 2 (Molar distalizado, incisivos retroclinados)</option>
                            <option value="clase_3">Clase III (Relación molar mesializada, mentón prominente)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Relación Esqueletal Sagital Estimada:</label>
                          <select
                            value={specialtyData.orthoSkeletalClass || "clase_1"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, orthoSkeletalClass: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="clase_1">Clase I Esquelética (Armonía entre maxilar y mandíbula)</option>
                            <option value="clase_2">Clase II Esquelética (Maxilar anterior o Mandíbula pequeña)</option>
                            <option value="clase_3">Clase III Esquelética (Prognatismo mandibular o Retrognatismo maxilar)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Sobremordida Vertical (Overbite):</label>
                          <select
                            value={specialtyData.orthoOverbite || "normal"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, orthoOverbite: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="normal">Normal (Incisivo superior cubre 20%-33% del inferior)</option>
                            <option value="borde_a_borde">Borde a Borde (0% Cobertura)</option>
                            <option value="abierta_anterior">Mordida Abierta Anterior (Ausencia de contacto/cobertura vertical)</option>
                            <option value="profunda">Sobremordida Profunda / Cerrada (&gt;50% a 100% Cobertura)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Resalte Horizontal (Overjet):</label>
                          <select
                            value={specialtyData.orthoOverjet || "normal"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, orthoOverjet: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="normal">Normal (1-2 mm de espacio horizontal)</option>
                            <option value="aumentado">Excesivo / Resalte Aumentado (&gt;3mm a severo)</option>
                            <option value="nulo">Mordida Cruzada Anterior (Incisivos superiores por detrás)</option>
                          </select>
                        </div>

                        {/* SECCIÓN 2: LÍNEA MEDIA Y AGENESIAS */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-500 tracking-widest mb-1">2. Simetría de Líneas Medias y Anomalías</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Línea Media Dental Coincidente:</label>
                          <select
                            value={specialtyData.orthoMidline || "coincidente"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, orthoMidline: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="coincidente">Sí, líneas media superior e inferior coinciden</option>
                            <option value="der_sup">Desviación superior a la derecha</option>
                            <option value="izq_sup">Desviación superior a la izquierda</option>
                            <option value="der_inf">Desviación inferior a la derecha</option>
                            <option value="izq_inf">Desviación inferior a la izquierda</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Diagnóstico Radiográfico de Agenesias/Dientes Retenidos:</label>
                          <select
                            value={specialtyData.orthoAgenesias || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, orthoAgenesias: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">Sin agenesias o dientes supernumerarios retenidos</option>
                            <option value="si_agenesia">Agenesia Dental detectada (Falta de gérmenes)</option>
                            <option value="si_supernum">Diente Supernumerario (P.ej. Mesiodens en línea media)</option>
                            <option value="retenido">Caninos o premolares retenidos en hueso</option>
                          </select>
                        </div>

                        {/* SECCIÓN 3: COMPROMISO Y HÁBITOS */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-500 tracking-widest mb-1">3. Motivo, Patrón Respiratorio y Hábitos Orales</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Motivo estético de consulta principal:</label>
                          <select
                            value={specialtyData.orthoComplaint || "apiñamiento"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, orthoComplaint: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="apiñamiento">Dientes apiñados/amontonados</option>
                            <option value="diastemas">Espacios excesivos (Diastemas)</option>
                            <option value="asimetria">Asimetría facial o dientes muy salidos</option>
                            <option value="dolor">Problemas al cerrar la boca / ATM</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Tipo de patrón respiratorio:</label>
                          <select
                            value={specialtyData.orthoBreathing || "nasal"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, orthoBreathing: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="nasal">Respiración Nasal pura (Fisiológica)</option>
                            <option value="oral">Respiración Bucal (Hábito respirador bucal)</option>
                            <option value="mixta">Respiración Mixta</option>
                          </select>
                        </div>
                        <div className="space-y-2 flex flex-col justify-center">
                          <label className="flex items-center gap-2 text-xs text-slate-755 dark:text-slate-300 font-bold cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={specialtyData.orthoPrevTreat || false}
                              onChange={(e) => setSpecialtyData({ ...specialtyData, orthoPrevTreat: e.target.checked })}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            ¿Ha tenido tratamientos de ortodoncia o frenillos previos?
                          </label>
                        </div>
                        <div className="space-y-2 flex flex-col justify-center">
                          <label className="flex items-center gap-2 text-xs text-slate-755 dark:text-slate-300 font-bold cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={specialtyData.orthoAtmNoise || false}
                              onChange={(e) => setSpecialtyData({ ...specialtyData, orthoAtmNoise: e.target.checked })}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            ¿Presenta chasquidos, trabas o ruidos articulares (ATM)?
                          </label>
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Hábitos nocivos (Succión digital, deglución atípica, onicofagia, empuje lingual):</label>
                          <input
                            type="text"
                            value={specialtyData.orthoHabits || ""}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, orthoHabits: e.target.value })}
                            placeholder="Describa el hábito detectado o declarado por el paciente..."
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-805 border border-slate-201 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Cirugía Specific History */}
                  {activeSpecialty === "cirugia" && (
                    <div className="space-y-6 animate-fade-in animate-duration-205">
                      <div className="flex items-center gap-2 text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Scissors className="w-4 h-4" /> Cirugía Bucal-Maxilofacial, Coagulación, Apertura y Vías
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                        {/* SECCIÓN 1: HEMORRAGIA Y AGENTES BIOQUÍMICOS */}
                        <div className="col-span-1 md:col-span-2">
                          <h4 className="text-[10px] font-black uppercase text-rose-500 dark:text-rose-500 tracking-widest mb-1">1. Coagulación y Fármacos Parenterales</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Antecedentes personales de hemorragia anormal:</label>
                          <select
                            value={specialtyData.surgBleedingHistory || "ninguno"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, surgBleedingHistory: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="ninguno">Ninguno, coagulación normal</option>
                            <option value="leve">Leve, curación un poco lenta</option>
                            <option value="severo">Hemorragia prolongada tras cortes mínimos</option>
                            <option value="coagulopatia">Coagulopatía declarada sistemáticamente</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Terapia anticoagulante / Bifosfonatos:</label>
                          <select
                            value={specialtyData.surgMedsAnticoag || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, surgMedsAnticoag: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">No toma</option>
                            <option value="aspirina">Aspirina diaria preventiva</option>
                            <option value="anticoagulante_oral">Anticoagulantes orales permanentes</option>
                            <option value="bifosfonatos">Bifosfonatos / Alendronato (Riesgo osteonecrosis)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Infección Odontogénica Activa:</label>
                          <select
                            value={specialtyData.surgInfectionScope || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, surgInfectionScope: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">Sin infección activa aguda</option>
                            <option value="celulitis">Celulitis facial circunscrita/limitada</option>
                            <option value="absceso">Infección fluctuante / Absceso alveolar purulento</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Tipo de Procedimiento Sugerido:</label>
                          <select
                            value={specialtyData.surgInterventionType || "exodoncia_simple"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, surgInterventionType: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="exodoncia_simple">Exodoncia Simple (Extracción regular)</option>
                            <option value="tercer_molar">Exodoncia Quirúrgica de Terceros Molares Retenidos</option>
                            <option value="implante">Colocación de Implante Dentario Intraóseo</option>
                            <option value="frenectomia">Frenectomía (Labial u lingual bajo anestesia)</option>
                            <option value="patologia_quiste">Eliminación de Quiste o Biopsia de tejido blando</option>
                          </select>
                        </div>

                        {/* SECCIÓN 2: EXAMEN DE VÍAS Y APERTURA */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-rose-500 dark:text-rose-500 tracking-widest mb-1">2. Examen de Vía Aérea, Tolerancia & Anestesia</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Apertura Bucal Máxima (Clínica):</label>
                          <select
                            value={specialtyData.surgMouthOpening || "normal"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, surgMouthOpening: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="normal">Normal (&ge; 40mm, fácil acceso)</option>
                            <option value="restringido">Moderadamente Restringida (25-39mm)</option>
                            <option value="severo_trismus">Trismus Severo o Espasmo (&lt; 25mm de apertura)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Valoración de Vía Aérea (Mallampati):</label>
                          <select
                            value={specialtyData.surgSystemicAirway || "clase_1"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, surgSystemicAirway: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="clase_1">Mallampati Clase I (Visibilidad total de úvula y fauces)</option>
                            <option value="clase_2">Mallampati Clase II (Visibilidad de úvula parcial)</option>
                            <option value="clase_3">Mallampati Clase III (Solo base de úvula visible)</option>
                            <option value="clase_4">Mallampati Clase IV (Vía Aérea Dificultosa - Solo paladar blando)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Interconsulta Cardiológica Necesaria:</label>
                          <select
                            value={specialtyData.surgCardioConsent || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, surgCardioConsent: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">No se requiere interconsulta</option>
                            <option value="pendiente">Pendiente de emitir / enviar para HTA severa</option>
                            <option value="autorizado_epi">Autorizado: Permite uso de Epinefrina regular (1:100,000)</option>
                            <option value="autorizado_sin_epi">Autorizado: CON RESTRICCIÓN (Utilizar anestesia pura sin epinefrina)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Disponibilidad de Altura y Espesor Óseo (Implantes):</label>
                          <select
                            value={specialtyData.surgBoneAvailability || "buena"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, surgBoneAvailability: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="buena">Excelente ósea (&ge;10mm altura y &ge;6mm espesor)</option>
                            <option value="marginal">Marginal (Requiere regeneración ósea guiada concurrente)</option>
                            <option value="severa_atrofia">Atrofia Severa (Requiere injerto de seno maxilar o bloque óseo previo)</option>
                          </select>
                        </div>

                        {/* SECCIÓN 3: ALERGIAS Y HERIDAS */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-rose-500 dark:text-rose-500 tracking-widest mb-1">3. Protocolos de Ansiedad & Historial Cicatriz</h4>
                        </div>
                        <div className="space-y-2 flex flex-col justify-center">
                          <label className="flex items-center gap-2 text-xs text-slate-705 dark:text-slate-300 font-bold cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={specialtyData.surgKeloid || false}
                              onChange={(e) => setSpecialtyData({ ...specialtyData, surgKeloid: e.target.checked })}
                              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                            />
                            ¿Presenta tendencia a cicatrices Queloides?
                          </label>
                        </div>
                        <div className="space-y-2 flex flex-col justify-center">
                          <label className="flex items-center gap-2 text-xs text-slate-705 dark:text-slate-300 font-bold cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={specialtyData.surgSedationNeed || false}
                              onChange={(e) => setSpecialtyData({ ...specialtyData, surgSedationNeed: e.target.checked })}
                              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                            />
                            ¿Requiere protocolo de Sedación / ansiolisis por fobia?
                          </label>
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Alertas o problemas previos con anestesia local:</label>
                          <input
                            type="text"
                            value={specialtyData.surgAnesthesiaWarning || ""}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, surgAnesthesiaWarning: e.target.value })}
                            placeholder="Ej. Taquicardia severa con uso de epinefrina, alergias dudosas..."
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-805 border border-slate-210 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Rehabilitación Specific History */}
                  {activeSpecialty === "rehabilitacion" && (
                    <div className="space-y-6 animate-fade-in animate-duration-205">
                      <div className="flex items-center gap-2 text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Sparkles className="w-4 h-4" /> Rehabilitación Oral, Oclusión Funcional & Estética Dentaria
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                        {/* SECCIÓN 1: OCLUSIÓN Y DESGASTE */}
                        <div className="col-span-1 md:col-span-2">
                          <h4 className="text-[10px] font-black uppercase text-purple-550 dark:text-purple-550 tracking-widest mb-1">1. Análisis Oclusal y Salud del Esmalte</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Esquema / Guía de Desoclusión:</label>
                          <select
                            value={specialtyData.rehabGuidance || "guia_canina"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, rehabGuidance: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="guia_canina">Guía Canina bilateral balanceada (Fisiológica)</option>
                            <option value="funcion_grupo">Función de Grupo (Completa / Parcial)</option>
                            <option value="interferencia">Presencia de Interferencia en lado de balance</option>
                            <option value="inestable">Oclusión céntrica inestable / Pérdida de dimensión</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Severidad de Desgaste (Atrisión / Bruxo-esmalte):</label>
                          <select
                            value={specialtyData.rehabEnamelWear || "grado_0"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, rehabEnamelWear: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="grado_0">Sin desgaste evidente (Grado 0)</option>
                            <option value="grado_1">Leve (Cúspides romas o facetas solo en esmalte superficial, Grado I)</option>
                            <option value="grado_2">Moderado (Identaciones de dentina expuesta visibles, Grado II)</option>
                            <option value="grado_3">Severo (Corona clínica muy disminuida / destructiva, Grado III)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Dimensión Vertical Oclusal (Proporción tercio inferior):</label>
                          <select
                            value={specialtyData.rehabFacialVibe || "conservado"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, rehabFacialVibe: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="conservado">Conservado (Fisiología y estética proporcional)</option>
                            <option value="disminuida">Disminuido (Colapso dental molar posterior bilateral)</option>
                            <option value="aumentada">Aumentado por sobre-rehabilitación previa</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Hábitos de apretamiento (Bruxismo):</label>
                          <select
                            value={specialtyData.rehabBruxismType || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, rehabBruxismType: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">No reportado</option>
                            <option value="nocturno">Apretamiento o rechinado nocturno</option>
                            <option value="diurno">Bruxismo diurno / de tensión</option>
                            <option value="severo">Bruxismo severo con desgaste facetario extenso</option>
                          </select>
                        </div>

                        {/* SECCIÓN 2: LÍNEAS DE SONRISA Y BIOTIPOS */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-purple-550 dark:text-purple-550 tracking-widest mb-1">2. Estética Dental y Parametría de Tejido Blando</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Línea de la Sonrisa del Paciente:</label>
                          <select
                            value={specialtyData.rehabSmileLine || "media"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, rehabSmileLine: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="baja">Línea Baja (Incisivos totalmente cubiertos por labios al reír)</option>
                            <option value="media">Línea Media (Muestra 75%-100% de corona y papila, Estética ideal)</option>
                            <option value="alta">Línea Alta / Gingival (Muestra &ge;3mm de encía marginal continua)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Biotipo Periodontal Gingival:</label>
                          <select
                            value={specialtyData.rehabGingivalBiotype || "grueso"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, rehabGingivalBiotype: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="grueso">Grueso y Festoneado (Alta resistencia, bajo riesgo regresivo)</option>
                            <option value="fino">Fino y Delicado (Alto riesgo estético y de recesión al rehabilitar)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Sustrato / Material de Reconstitución Preferente:</label>
                          <select
                            value={specialtyData.rehabSubstructures || "disilicato"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, rehabSubstructures: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="disilicato">E-Max / Disilicato de Litio (Máxima estética traslúcida)</option>
                            <option value="circonio">Circonio Monolítico Multicapa (Alta dureza, para posteriores)</option>
                            <option value="metal_porcelana">Metal-Porcelana Clásica (Económica estructural)</option>
                            <option value="composite_ind">Inlays / Onlays de resina indirecta</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Tiempo transcurrido desde la pérdida del o los dientes:</label>
                          <select
                            value={specialtyData.rehabMissingDuration || "no_perdid"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, rehabMissingDuration: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no_perdid">Cero pérdida de dientes</option>
                            <option value="reciente">Pérdida reciente (Menos de un año)</option>
                            <option value="prolongado">Pérdida prolongada con migración y atrofia ósea</option>
                          </select>
                        </div>

                        {/* SECCIÓN 3: PRÓTESIS ACTUAL Y ELEMENTOS */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-purple-550 dark:text-purple-555 tracking-widest mb-1">3. Prótesis Pasada y Expectativa General</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-555 dark:text-slate-400">Sistemas de prótesis dental activos hoy:</label>
                          <select
                            value={specialtyData.rehabProsthesisCurrent || "ninguna"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, rehabProsthesisCurrent: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="ninguna">Ninguna prótesis dental</option>
                            <option value="removible">Prótesis Removible (Acrílico / Cromocobalto)</option>
                            <option value="puente_antiguo">Prótesis Fija antigua para re-tratamiento</option>
                            <option value="protesis_total">Prótesis Total superior o inferior</option>
                          </select>
                        </div>
                        <div className="space-y-2 flex flex-col justify-center">
                          <label className="flex items-center gap-2 text-xs text-slate-705 dark:text-slate-300 font-bold cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={specialtyData.rehabAtmPain || false}
                              onChange={(e) => setSpecialtyData({ ...specialtyData, rehabAtmPain: e.target.checked })}
                              className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                            />
                            ¿Dolor o cansancio muscular craneofacial en mañanas?
                          </label>
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Expectativas estéticas (color, carillas, re-habilitación):</label>
                          <input
                            type="text"
                            value={specialtyData.rehabShadeExp || ""}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, rehabShadeExp: e.target.value })}
                            placeholder="Ej. Desea carillas ultra blancas o prefiere coronas de aspecto natural..."
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-805 border border-slate-201 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/10"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Odontopediatría Specific History */}
                  {activeSpecialty === "odontopediatria" && (
                    <div className="space-y-6 animate-fade-in animate-duration-205">
                      <div className="flex items-center gap-2 text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Baby className="w-4 h-4" /> Odontopediatría Integral Infantil, Motivación de Padres e Inmunización de Flúor
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                        {/* SECCIÓN 1: COMPORTAMIENTO FRANKL */}
                        <div className="col-span-1 md:col-span-2">
                          <h4 className="text-[10px] font-black uppercase text-sky-550 dark:text-sky-500 tracking-widest mb-1">1. Conducta del Menor y Etapa de Dentición</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-555 dark:text-slate-400">Comportamiento del menor (Escala Frankl):</label>
                          <select
                            value={specialtyData.pedFranklClass || "cooperador"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, pedFranklClass: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="cooperador">Definitivamente Positiva (Frankl 4) - Excelente</option>
                            <option value="aceptante">Positiva (Frankl 3) - Colabora levemente tímido</option>
                            <option value="temeroso">Negativo (Frankl 2) - Cooperación tímida / llanto</option>
                            <option value="negativo_severo">Definitivamente Negativa (Frankl 1) - Llanto fuerte / rechazo</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-555 dark:text-slate-400">Fase de Dentición Clínica Activa:</label>
                          <select
                            value={specialtyData.pedDentitionPhase || "temporal"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, pedDentitionPhase: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="temporal">Dentición Temporal Pura (Dientes de leche deciduos completos)</option>
                            <option value="mixta_temprana">Dentición Mixta Temprana (Erupción de primeros molares e incisivos)</option>
                            <option value="mixta_tardia">Dentición Mixta Tardía (Recambio de caninos y premolares)</option>
                            <option value="permanente_joven">Dentición Permanente Joven (12 a 18 años)</option>
                          </select>
                        </div>

                        {/* SECCIÓN 2: PREVENCIÓN Y FLÚOR */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-sky-550 dark:text-sky-500 tracking-widest mb-1">2. Terapias Preventivas y Barnices de Flúor</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-555 dark:text-slate-400">Última Aplicación de Barniz de Flúor (Prof):</label>
                          <select
                            value={specialtyData.pedFluorideApp || "menos_6"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, pedFluorideApp: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="menos_6">Hace menos de 6 meses (Protocolo activo para alto riesgo)</option>
                            <option value="mas_6">Hace más de 6 meses</option>
                            <option value="nunca">Nunca ha recibido fluoración profesional en consultorio</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-555 dark:text-slate-400">Estado de Sellantes en Fosas y Fisuras:</label>
                          <select
                            value={specialtyData.pedSealers || "ninguno"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, pedSealers: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="ninguno">No presenta sellantes / Requiere su colocación</option>
                            <option value="buen_estado">Sí presenta (Todos adaptados y en buen estado)</option>
                            <option value="filtrado">Presenta sellantes desastillados / filtrados con caries debajo</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-555 dark:text-slate-400">Régimen de cepillado asistido:</label>
                          <select
                            value={specialtyData.pedBrushAssisted || "supervisado"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, pedBrushAssisted: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="hecho_padres">Cepillado hecho 100% por los padres</option>
                            <option value="supervisado">El niño cepilla solo pero con repaso de padres</option>
                            <option value="solitario">El menor cepilla solo sin supervisión</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-555 dark:text-slate-400">Grado estimado de Motivación de Padres/Tutores:</label>
                          <select
                            value={specialtyData.pedParentMotiv || "alta"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, pedParentMotiv: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="alta">Muy Alta (Cumple citas, dieta adecuada y excelente cepillado)</option>
                            <option value="moderada">Moderada (Problemas de agenda / técnica regular de higiene)</option>
                            <option value="baja">Baja / Negligencia involuntaria (Solo trae al menor por dolor agudo)</option>
                          </select>
                        </div>

                        {/* SECCIÓN 3: ALIMENTOS Y HISTORIAL DE GOLPES */}
                        <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <h4 className="text-[10px] font-black uppercase text-sky-550 dark:text-sky-500 tracking-widest mb-1">3. Dieta, Hábitos Nocturnos y Traumatismo</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-555 dark:text-slate-400">Es su primera visita odontológica general:</label>
                          <select
                            value={specialtyData.pedFirstVisit || "no_exito"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, pedFirstVisit: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="primera">Sí, es la primera consulta odontológica del niño</option>
                            <option value="no_exito">No, tiene visitas anteriores totalmente exitosas</option>
                            <option value="traumatica">No, ha tenido visitas anteriores conflictivas / dolorosas</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-555 dark:text-slate-400">Consumo diario de alimentos azucarados:</label>
                          <select
                            value={specialtyData.pedSweets || "moderado"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, pedSweets: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="bajo">Muy bajo, restringido por tutores</option>
                            <option value="moderado">Moderado entre comidas regulado</option>
                            <option value="alto">Alto diario (Golosinas, jugos artificiales)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-555 dark:text-slate-400">Antecedentes de traumatismos por caída infantil con compromiso dental:</label>
                          <select
                            value={specialtyData.pedTraumaHistory || "no"}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, pedTraumaHistory: e.target.value })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-201 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="no">No reporta golpes o caídas maxilares</option>
                            <option value="luxacion">Sí, golpe frontal con luxación o fractura en diente deciduo</option>
                            <option value="avulsion">Sí, intrusión o avulsión decidua (En vigilancia ósea)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-555 dark:text-slate-400">Frecuencia Cepillado Diario:</label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={specialtyData.pedFluoride || 2}
                            onChange={(e) => setSpecialtyData({ ...specialtyData, pedFluoride: parseInt(e.target.value) || 0 })}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10[disabled:opacity-80]"
                          />
                        </div>
                        <div className="space-y-2 flex flex-col justify-center">
                          <label className="flex items-center gap-2 text-xs text-slate-705 dark:text-slate-300 font-bold cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={specialtyData.pedBottleNight || false}
                              onChange={(e) => setSpecialtyData({ ...specialtyData, pedBottleNight: e.target.checked })}
                              className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                            />
                            ¿Toma biberón nocturno con endulzantes o leche (Riesgo Caries de Biberón)?
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="pt-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/10 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-400">
                  Reflejo bidireccional activo con el Periodontograma de Lang & Tonetti.
                </div>
                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {savedSuccess && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-md border border-emerald-100 dark:border-emerald-800/45 inline-flex items-center gap-1"
                      >
                        ✓ ¡Guardado con éxito!
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={handleSaveAnamnesis}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-5 h-5" />
                    Guardar Anamnesis
                  </button>
                </div>
              </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'evoluciones' && (
            <motion.div
              key="evoluciones"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Registrar Nueva Evolución Clínica</h3>
                <textarea
                  value={newEvolutionText}
                  onChange={(e) => setNewEvolutionText(e.target.value)}
                  placeholder="Detalle los procedimientos realizados hoy, recetas emitidas y progreso..."
                  rows={3}
                  className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  onClick={handleAddEvolution}
                  disabled={!newEvolutionText.trim()}
                  className="self-end bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Registrar
                </button>
              </div>

              <div className="space-y-3">
                {evolutions.map((evo) => (
                  <div key={evo.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in group relative overflow-hidden">
                    <AnimatePresence>
                      {deletingEvolutionId === evo.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-sm z-50 flex items-center justify-between px-4 py-2"
                        >
                          <div className="flex flex-col">
                            <span className="text-white text-xs font-bold font-display leading-tight">¿Eliminar esta evolución clínica?</span>
                            <span className="text-[10px] text-slate-400 font-normal mt-0.5">Esta acción no se puede deshacer.</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => executeDeleteEvolution(evo.id)}
                              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[11px] rounded-lg cursor-pointer transition-all active:scale-95"
                            >
                              Sí, eliminar
                            </button>
                            <button
                              onClick={() => setDeletingEvolutionId(null)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-[11px] rounded-lg cursor-pointer transition-all active:scale-95 border border-slate-700/50"
                            >
                              No
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 px-2.5 py-1 rounded-md">
                            {new Date(evo.date).toLocaleString()}
                          </span>
                          <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                             {evo.professional}
                          </span>
                       </div>
                       <button onClick={() => handleDeleteEvolution(evo.id)} className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{evo.description}</p>
                  </div>
                ))}
                
                {evolutions.length === 0 && (
                   <div className="text-center py-12 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-500">No hay evoluciones clínicas registradas</p>
                      <p className="text-xs text-slate-400">Las notas clínicas agregadas aparecerán aquí chronológicamente.</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'consentimientos' && (
            <motion.div
              key="consentimientos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Form panel optimized for small viewports */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                 <div className="space-y-2">
                   <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                     <ShieldAlert className="w-4 h-4 text-amber-500" />
                     Emitir Consentimiento Informado
                   </h3>
                   <p className="text-xs text-slate-500 dark:text-slate-400">
                     Seleccione la categoría médica regulada del procedimiento dental. Los pacientes podrán firmar directamente en pantalla táctil de celular o tablet.
                   </p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                   <select 
                     value={newConsentType}
                     onChange={(e) => setNewConsentType(e.target.value)}
                     className="w-full sm:max-w-xs text-sm p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700 dark:text-slate-200 font-medium"
                   >
                      <option value="Consentimiento General Quirúrgico">Consentimiento Quirúrgico (Implantes/Extracciones)</option>
                      <option value="Consentimiento Periodontal">Tratamiento Periodontal Básico y Avanzado</option>
                      <option value="Consentimiento Endodoncia">Riesgos y pronóstico de Endodoncia</option>
                   </select>

                   <button
                     onClick={handleAddConsentimiento}
                     className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-sm active:scale-98"
                   >
                     <Plus className="w-4 h-4" /> Generar Documento
                   </button>
                 </div>
              </div>

              {/* List block */}
              <div className="space-y-3">
                 {consentimientos.map(cons => (
                   <div key={cons.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 transition-all">
                     <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-2 flex-wrap">
                         <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md">
                           {new Date(cons.date).toLocaleDateString()}
                         </span>
                         {cons.signature ? (
                           <span className="text-[10px] items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md inline-flex border border-emerald-100 dark:border-emerald-900/30">
                             <Check className="w-3 h-3" /> Firmado y Aceptado
                           </span>
                         ) : (
                           <span className="text-[10px] items-center gap-1 font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 px-2.5 py-1 rounded-md inline-flex border border-amber-100 dark:border-amber-900/20">
                             Pendiente de Firma
                           </span>
                         )}
                       </div>
                       
                       <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                         {cons.documentType}
                       </h4>

                       {/* Interactive Render of drawn base64 Signature inside the document card! */}
                       {cons.signature && (
                         <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-xl inline-block">
                           <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Firma Digital del Paciente</p>
                           <img 
                             src={cons.signature} 
                             alt="Firma del Paciente" 
                             className="h-10 md:h-12 w-auto object-contain dark:brightness-125 select-none"
                             referrerPolicy="no-referrer"
                           />
                         </div>
                       )}
                     </div>
                     
                     <div className="flex items-center gap-2.5 justify-end md:self-center">
                       {!cons.signature && (
                         <button 
                           onClick={() => handleSignConsentimiento(cons.id)}
                           className="flex-1 md:flex-initial bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 md:py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                         >
                            <PenTool className="w-3.5 h-3.5" /> Firmar en Pantalla
                         </button>
                       )}
                       <button 
                         onClick={() => handleDeleteConsentimiento(cons.id)}
                         className="bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-3 md:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                         title="Eliminar documento"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                 ))}
                 
                 {consentimientos.length === 0 && (
                   <div className="text-center py-12 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-20" />
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-455">Sin Consentimientos Informados</p>
                      <p className="text-xs text-slate-400 mt-0.5">Genere y capture las firmas asistidas de los tratamientos desde este panel.</p>
                   </div>
                 )}
              </div>

              {/* FULL-SCREEN / TOUCH-FRIENDLY SIGNATURE DRAWER MODAL */}
              <AnimatePresence>
                {signingId && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSigningId(null)}
                    className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 md:p-4"
                  >
                    <motion.div 
                      initial={{ y: 50, scale: 0.95 }}
                      animate={{ y: 0, scale: 1 }}
                      exit={{ y: 50, scale: 0.95 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden"
                    >
                      {/* Modal Header */}
                      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/10">
                        <div className="flex items-center gap-2">
                          <PenTool className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                            Firma de Consentimiento
                          </h4>
                        </div>
                        <button 
                          onClick={() => setSigningId(null)}
                          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Body / Scrollable medical terms */}
                      <div className="p-5 overflow-y-auto space-y-4 flex-1">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider">Documento</p>
                          <h5 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                            {consentimientos.find(c => c.id === signingId)?.documentType}
                          </h5>
                        </div>

                        {/* Text template block */}
                        <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 max-h-48 md:max-h-60 overflow-y-auto text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap select-none scrollbar-thin">
                          {signingId && CONSENT_TEXTS[consentimientos.find(c => c.id === signingId)?.documentType || ''] || 'No hay texto predefinido.'}
                        </div>

                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-500 tracking-wider">
                              Dibuje su Firma en el Recuadro:
                            </label>
                            <button 
                              onClick={clearCanvas}
                              className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 cursor-pointer bg-transparent border-0"
                            >
                              <RotateCcw className="w-3 h-3" /> Limpiar
                            </button>
                          </div>
                          
                          {/* DRAWING CANVAS */}
                          <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 cursor-pointer">
                            <canvas 
                              ref={canvasRef}
                              width={500}
                              height={250}
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                              className="w-full h-40 md:h-44 bg-slate-50 dark:bg-slate-950 block touch-none"
                            />
                            <div className="absolute bottom-2 right-2 pointer-events-none text-[9px] text-slate-400 font-medium bg-white/70 dark:bg-slate-900/70 px-2 py-0.5 rounded-lg border border-slate-200/40">
                              Táctil / Ratón
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/10 flex gap-2.5 font-sans">
                        <button 
                          onClick={() => setSigningId(null)}
                          className="flex-1 py-3 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold rounded-xl text-xs transition-all active:scale-98 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={saveSignature}
                          className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs transition-all active:scale-98 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Confirmar Firma
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'fotografia' && (
            <motion.div
              key="fotografia"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <ClinicalPhotography
                patient={patient}
                onUpdatePatient={onUpdatePatient}
              />
            </motion.div>
          )}

          {activeTab === 'comunicaciones' && (
            <motion.div
              key="comunicaciones"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <PatientCommunications
                patient={patient}
                appointments={[]}
                clinicName="PerioClinic Pro"
                doctorName="Dr. Titular"
                onUpdatePatient={onUpdatePatient}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </motion.div>
  );
}
