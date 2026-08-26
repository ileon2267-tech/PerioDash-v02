import React, { useState } from 'react';
import { Patient, Evolution } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Pill, 
  FileText, 
  Send, 
  Printer, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  QrCode, 
  Download, 
  Plus, 
  Trash2, 
  Building2, 
  UserCheck,
  Stethoscope,
  Share2
} from 'lucide-react';
import { recordHipaaAudit } from '../utils/hipaaAudit';

interface PrescriptionAndReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  doctorName: string;
  clinicName: string;
  onAddEvolution?: (evolution: Evolution) => void;
}

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  category: 'antibiotico' | 'analgesico' | 'antiseptico' | 'corticoide' | 'otro';
}

const COMMON_DRUGS: Omit<MedicationItem, 'id'>[] = [
  {
    name: "Amoxicilina 875mg + Ácido Clavulánico 125mg",
    dosage: "1 comprimido recubierto",
    frequency: "Cada 12 horas",
    duration: "Por 7 días",
    instructions: "Tomar con alimentos. Completar el ciclo indicado.",
    category: "antibiotico"
  },
  {
    name: "Amoxicilina 500mg",
    dosage: "1 cápsula",
    frequency: "Cada 8 horas",
    duration: "Por 7 días",
    instructions: "Ingerir con abundante agua. No suspender antes de tiempo.",
    category: "antibiotico"
  },
  {
    name: "Clindamicina 300mg (Alérgicos a Penicilina)",
    dosage: "1 cápsula",
    frequency: "Cada 8 horas",
    duration: "Por 7 días",
    instructions: "Tomar con un vaso lleno de agua, no acostarse de inmediato.",
    category: "antibiotico"
  },
  {
    name: "Ibuprofeno 600mg",
    dosage: "1 comprimido",
    frequency: "Cada 8 horas",
    duration: "Por 3 a 5 días",
    instructions: "Tomar tras las comidas principales en caso de inflamación o molestia.",
    category: "analgesico"
  },
  {
    name: "Ketorolaco 10mg Sublingual",
    dosage: "1 comprimido sublingual",
    frequency: "Cada 8 horas",
    duration: "Máximo 3 días",
    instructions: "Disolver bajo la lengua en caso de dolor agudo postquirúrgico.",
    category: "analgesico"
  },
  {
    name: "Paracetamol 1g + Tramadol 50mg",
    dosage: "1 comprimido",
    frequency: "Cada 8 horas",
    duration: "Por 3 días",
    instructions: "Solo en caso de dolor moderado a severo. Puede provocar somnolencia.",
    category: "analgesico"
  },
  {
    name: "Clorhexidina 0.12% Colutorio",
    dosage: "15 ml sin diluir",
    frequency: "Cada 12 horas (tras cepillado)",
    duration: "Por 10 a 14 días",
    instructions: "Enjuagar durante 30 segundos y escupir. No ingerir líquidos por 30 min.",
    category: "antiseptico"
  },
  {
    name: "Gel Bioadhesivo Clorhexidina 0.20% (PerioKin)",
    dosage: "Aplicación tópica local",
    frequency: "2 a 3 veces al día",
    duration: "Por 7 días",
    instructions: "Aplicar suavemente con hisopo o dedo limpio sobre la encía afectada.",
    category: "antiseptico"
  },
  {
    name: "Dexametasona 4mg",
    dosage: "1 comprimido",
    frequency: "Dosis única previa o postoperatoria",
    duration: "1 a 2 días",
    instructions: "Profilaxis antiedema para cirugía de terceros molares o implantes.",
    category: "corticoide"
  }
];

export default function PrescriptionAndReferralModal({
  isOpen,
  onClose,
  patient,
  doctorName,
  clinicName,
  onAddEvolution
}: PrescriptionAndReferralModalProps) {
  const [activeTab, setActiveTab] = useState<'receta' | 'derivacion'>('receta');

  // Prescription States
  const [diagnosis, setDiagnosis] = useState("K05.3 Periodontitis Crónica / Diagnóstico Odontológico");
  const [medications, setMedications] = useState<MedicationItem[]>([
    {
      id: 'med-1',
      name: "Amoxicilina 875mg + Ácido Clavulánico 125mg",
      dosage: "1 comprimido recubierto",
      frequency: "Cada 12 horas",
      duration: "Por 7 días",
      instructions: "Tomar con las comidas principales.",
      category: "antibiotico"
    },
    {
      id: 'med-2',
      name: "Ketorolaco 10mg Sublingual",
      dosage: "1 comprimido",
      frequency: "Cada 8 horas en caso de dolor",
      duration: "Por 3 días",
      instructions: "Disolver bajo la lengua según necesidad.",
      category: "analgesico"
    },
    {
      id: 'med-3',
      name: "Clorhexidina 0.12% Colutorio",
      dosage: "15 ml",
      frequency: "2 veces al día tras cepillado",
      duration: "Por 10 días",
      instructions: "Enjuagar 30 segundos, no enjuagar con agua después.",
      category: "antiseptico"
    }
  ]);
  const [doctorRUT, setDoctorRUT] = useState("16.892.415-K");
  const [medicalLicense, setMedicalLicense] = useState("Reg. Colegiado Nº 48192 - Superintendencia de Salud");
  const [prescriptionNotes, setPrescriptionNotes] = useState("Mantener reposo relativo las primeras 24 horas y régimen blando.");

  // Referral / Interconsulta States
  const [targetSpecialty, setTargetSpecialty] = useState("Cirugía Bucal & Maxilofacial");
  const [referralUrgency, setReferralUrgency] = useState<"electiva" | "preferente" | "urgente">("preferente");
  const [targetTeeth, setTargetTeeth] = useState("Pieza 1.8, 2.8, 3.8 y 4.8 (Terceros molares)");
  const [referralReason, setReferralReason] = useState(
    "Paciente con indicación de exodoncia quirúrgica de terceros molares por falta de espacio en arcada y episodios repetidos de pericoronaritis aguda en cuadrante inferior."
  );
  const [clinicalHistorySummary, setClinicalHistorySummary] = useState(
    `Paciente ${patient.name}, ${patient.birthdate ? 'nacido/a el ' + patient.birthdate : ''}. Antecedentes sistémicos: HTA: ${patient.anamnesis.hta ? 'SÍ' : 'NO'}, Diabetes: ${patient.anamnesis.diabetes ? 'SÍ' : 'NO'}, Alergias: ${patient.anamnesis.alergias || 'Sin alergias declaradas'}. Tabaquismo: ${patient.anamnesis.tabaquismo > 0 ? patient.anamnesis.tabaquismo + ' cig/día' : 'No fuma'}.`
  );
  const [requestedExams, setRequestedExams] = useState("Tomografía Cone Beam CBCT mandibular y radiografía panorámica digital actualizada.");

  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Cross-check allergies
  const patientAllergies = (patient.anamnesis.alergias || "").toLowerCase();
  const hasPenicillinAllergy = patientAllergies.includes("penicilina") || patientAllergies.includes("amoxicilina") || patientAllergies.includes("betalactámicos");
  const hasNsaidAllergy = patientAllergies.includes("antiinflamatorio") || patientAllergies.includes("ibuprofeno") || patientAllergies.includes("aspirina") || patientAllergies.includes("aine");

  const addMedication = (drug: Omit<MedicationItem, 'id'>) => {
    const newItem: MedicationItem = {
      ...drug,
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    setMedications([...medications, newItem]);
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const handlePrint = () => {
    recordHipaaAudit("PRINT_EXPORT_PATIENT", `Emisión de documento médico (${activeTab.toUpperCase()}) para ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "Módulo de Recetas y Derivaciones",
      severity: "info"
    });
    window.print();
  };

  const handleSendWhatsApp = () => {
    const phone = patient.phone.replace(/[^0-9]/g, "");
    if (!phone) {
      alert("El paciente no tiene un teléfono válido registrado.");
      return;
    }

    let text = "";
    if (activeTab === 'receta') {
      text = `*RECETA MÉDICA ODONTOLÓGICA OFICIAL*\n*Clínica:* ${clinicName}\n*Profesional:* ${doctorName} (${medicalLicense})\n*Paciente:* ${patient.name} (RUT: ${patient.rut || 'N/A'})\n*Fecha:* ${new Date().toLocaleDateString()}\n*Diagnóstico:* ${diagnosis}\n\n*MEDICACIÓN PRESCRITA:*\n`;
      medications.forEach((m, idx) => {
        text += `${idx + 1}. *${m.name}*\n   - Dosis: ${m.dosage}\n   - Frecuencia: ${m.frequency}\n   - Duración: ${m.duration}\n   - Indicación: ${m.instructions}\n\n`;
      });
      if (prescriptionNotes) {
        text += `*Indicaciones adicionales:*\n${prescriptionNotes}\n\n`;
      }
      text += `_Documento clínico generado y emitido mediante PerioDash Pro._`;
    } else {
      text = `*CARTA DE INTERCONSULTA Y DERIVACIÓN ODONTOLÓGICA*\n*De:* ${doctorName} (${clinicName})\n*Para:* Especialidad de ${targetSpecialty}\n*Paciente:* ${patient.name} (RUT: ${patient.rut || 'N/A'})\n*Prioridad:* ${referralUrgency.toUpperCase()}\n*Piezas Involucradas:* ${targetTeeth}\n\n*Motivo de Derivación:*\n${referralReason}\n\n*Resumen Clínico:*\n${clinicalHistorySummary}\n\n*Exámenes Complementarios Solicitados:*\n${requestedExams}\n\n_Emitido conforme a estándares clínicos oficiales._`;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    recordHipaaAudit("COMMUNICATION_SENT", `Envío de ${activeTab} por WhatsApp a ${patient.name}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: "WhatsApp Gateway",
      severity: "info"
    });
  };

  const handleCopyToClipboard = () => {
    let text = "";
    if (activeTab === 'receta') {
      text = `RECETA MÉDICA - ${clinicName}\nDr/a: ${doctorName} (${medicalLicense})\nPaciente: ${patient.name} | Fecha: ${new Date().toLocaleDateString()}\nDiagnóstico: ${diagnosis}\n\n`;
      medications.forEach((m, idx) => {
        text += `${idx + 1}. ${m.name} - ${m.dosage}, ${m.frequency}, ${m.duration}. ${m.instructions}\n`;
      });
    } else {
      text = `INTERCONSULTA - ${targetSpecialty}\nPaciente: ${patient.name}\nMotivo: ${referralReason}\nPiezas: ${targetTeeth}\nResumen: ${clinicalHistorySummary}`;
    }

    navigator.clipboard.writeText(text);
    setCopiedStatus("Copiado al portapapeles");
    setTimeout(() => setCopiedStatus(null), 3000);
  };

  const handleSaveAsEvolution = () => {
    if (!onAddEvolution) return;
    const newEvo: Evolution = {
      id: `evo-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      professional: doctorName,
      description: activeTab === 'receta' 
        ? `[RECETA EMITIDA]: ${medications.map(m => m.name).join(', ')}. Indicaciones: ${prescriptionNotes}`
        : `[DERIVACIÓN EMITIDA]: Interconsulta a ${targetSpecialty}. Motivo: ${referralReason}. Piezas: ${targetTeeth}`
    };
    onAddEvolution(newEvo);
    alert("¡Registrado exitosamente en las evoluciones clínicas del paciente!");
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto no-print"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] my-auto"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
                <Pill className="w-6 h-6 text-teal-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display">Recetario & Derivaciones Inteligentes</h3>
                <p className="text-xs text-teal-100">
                  Emisión estructurada, cruce de alergias bioseguras y cartas de interconsulta para {patient.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Sub Navigation Bar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <button
                onClick={() => setActiveTab('receta')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'receta'
                    ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Receta Médica Oficial</span>
              </button>

              <button
                onClick={() => setActiveTab('derivacion')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'derivacion'
                    ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Carta de Interconsulta / Derivación</span>
              </button>
            </div>

            {/* Cross-Check Safety Alert Pill */}
            {patient.anamnesis.alergias && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Alergias declaradas: {patient.anamnesis.alergias}</span>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {activeTab === 'receta' ? (
              <div className="space-y-6">
                
                {/* Allergy warning cross-check notification */}
                {hasPenicillinAllergy && medications.some(m => m.name.toLowerCase().includes("amoxicilina") || m.name.toLowerCase().includes("penicilina")) && (
                  <div className="p-4 bg-red-500/10 border-2 border-red-500 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400">
                    <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider">¡ALERTA CRÍTICA DE FARMACOVIGILANCIA!</h4>
                      <p className="text-xs font-medium mt-0.5 leading-relaxed">
                        El paciente presenta <strong>Alergia a la Penicilina / Betalactámicos</strong> en su ficha clínica. Se detectó Amoxicilina en la receta activa. Se recomienda sustituir inmediatamente por Clindamicina 300mg o Azitromicina 500mg.
                      </p>
                    </div>
                  </div>
                )}

                {/* Patient & Doctor Meta */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Paciente:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{patient.name}</span>
                    <span className="text-slate-400 block text-[11px]">RUT: {patient.rut || 'N/A'} • Edad: {patient.birthdate || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Clínica & Doctor:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{doctorName}</span>
                    <span className="text-slate-400 block text-[11px]">{clinicName}</span>
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold uppercase block text-[10px] mb-1">Diagnóstico Clínico (CIE-10):</label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Quick Add Preset Bar */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    Biblioteca Rápida de Fármacos Odontológicos:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_DRUGS.map((drug, index) => {
                      const isPenicillin = drug.name.toLowerCase().includes("amoxicilina");
                      const isRisky = hasPenicillinAllergy && isPenicillin;

                      return (
                        <button
                          key={index}
                          onClick={() => addMedication(drug)}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isRisky 
                              ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-300"
                              : drug.category === 'antibiotico'
                              ? "bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800"
                              : drug.category === 'analgesico'
                              ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>{drug.name.split(' ')[0]} {drug.name.split(' ')[1] || ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Prescription List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Fármacos en la Receta ({medications.length}):
                  </span>

                  {medications.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs">
                      No hay fármacos prescritos. Selecciona de los predefinidos arriba o añade uno manualmente.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {medications.map((med, index) => (
                        <div 
                          key={med.id}
                          className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <strong className="text-xs text-slate-800 dark:text-slate-100">{med.name}</strong>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                                {med.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 pl-7">
                              <strong>Posología:</strong> {med.dosage} • <strong>Frecuencia:</strong> {med.frequency} • <strong>Duración:</strong> {med.duration}
                            </p>
                            {med.instructions && (
                              <p className="text-[11px] text-teal-600 dark:text-teal-400 pl-7 italic">
                                * {med.instructions}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => removeMedication(med.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="Eliminar de la receta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Clinical Indications */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Instrucciones & Cuidados Postoperatorios Adicionales:
                  </label>
                  <textarea
                    rows={2}
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                    placeholder="Ej. Evitar esfuerzos físicos intensos, enjuagar suavemente tras 24 hrs..."
                  />
                </div>

              </div>
            ) : (
              /* Interconsulta / Referral Form */
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Especialidad de Destino:
                    </label>
                    <select
                      value={targetSpecialty}
                      onChange={(e) => setTargetSpecialty(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    >
                      <option value="Cirugía Bucal & Maxilofacial">Cirugía Bucal & Maxilofacial</option>
                      <option value="Ortodoncia & Ortopedia Dentomaxilar">Ortodoncia & Ortopedia Dentomaxilar</option>
                      <option value="Implantología & Rehabilitación Oral">Implantología & Rehabilitación Oral</option>
                      <option value="Endodoncia Avanzada">Endodoncia Avanzada</option>
                      <option value="Periodoncia & Regeneración Ósea">Periodoncia & Regeneración Ósea</option>
                      <option value="Odontopediatría">Odontopediatría</option>
                      <option value="Patología & Medicina Oral">Patología & Medicina Oral</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Nivel de Prioridad Clínica:
                    </label>
                    <select
                      value={referralUrgency}
                      onChange={(e) => setReferralUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    >
                      <option value="electiva">Electiva (Programada habitual)</option>
                      <option value="preferente">Preferente (Dentro de 15 días)</option>
                      <option value="urgente">Urgencia / Prioridad Inmediata</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Piezas Dentarias o Región Anatómica Involucrada:
                  </label>
                  <input
                    type="text"
                    value={targetTeeth}
                    onChange={(e) => setTargetTeeth(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    placeholder="Ej. Pieza 1.8 y 4.8 / Zona anterosuperior"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Motivo Detallado de la Interconsulta y Pregunta Clínica:
                  </label>
                  <textarea
                    rows={3}
                    value={referralReason}
                    onChange={(e) => setReferralReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Resumen Clínico y Antecedentes Médicos Relevantes:
                  </label>
                  <textarea
                    rows={2}
                    value={clinicalHistorySummary}
                    onChange={(e) => setClinicalHistorySummary(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Exámenes Radiológicos / Complementarios Adjuntos:
                  </label>
                  <input
                    type="text"
                    value={requestedExams}
                    onChange={(e) => setRequestedExams(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Footer Action Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {copiedStatus && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {copiedStatus}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyToClipboard}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Copiar texto estructurado"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </button>

              <button
                onClick={handleSaveAsEvolution}
                className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-teal-500/20"
                title="Guardar como evolución en la ficha"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Guardar en Ficha</span>
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                title="Enviar directamente al WhatsApp del paciente"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                title="Imprimir o Descargar en PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
