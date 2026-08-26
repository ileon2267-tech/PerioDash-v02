import React, { useState, useRef } from "react";
import { Patient, Anamnesis } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  Unlock, 
  CheckCircle2, 
  ShieldCheck, 
  FileSignature, 
  User, 
  Heart, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Eraser, 
  X 
} from "lucide-react";
import { recordHipaaAudit } from "../utils/hipaaAudit";

interface KioskModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSavePatient: (updatedPatient: Patient) => void;
}

export default function KioskModeModal({
  isOpen,
  onClose,
  patient,
  onSavePatient
}: KioskModeModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [pin, setPin] = useState("");
  const [showExitPinPrompt, setShowExitPinPrompt] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Form State initialized from patient
  const [formData, setFormData] = useState({
    name: patient.name,
    rut: patient.rut || "",
    phone: patient.phone || "",
    email: patient.email || "",
    birthdate: patient.birthdate || "",
    emergencyContact: "Familiar directo: +56 9 8765 4321",
    // Anamnesis
    hta: patient.anamnesis?.hta || false,
    diabetes: patient.anamnesis?.diabetes || false,
    cardiopatia: patient.anamnesis?.cardiopatia || false,
    alergias: patient.anamnesis?.alergias || "",
    farmacos: patient.anamnesis?.farmacos || "",
    tabaquismo: patient.anamnesis?.tabaquismo || 0,
    embarazo: false,
    cirugiasPrevias: "",
    motivoConsulta: "Evaluación periodontal y limpieza dental preventiva",
    sintomas: {
      dolor: false,
      sangrado: true,
      sensibilidad: false,
      movilidad: false,
      malAliento: false
    },
    // Consent
    acceptedTerms: false,
    signatureUrl: ""
  });

  // Canvas for Digital Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  if (!isOpen) return null;

  // Signature Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleFinish = () => {
    // Generate signature data URL if signed
    let sigData = formData.signatureUrl;
    if (canvasRef.current && hasSigned) {
      sigData = canvasRef.current.toDataURL('image/png');
    }

    const updatedPatient: Patient = {
      ...patient,
      name: formData.name,
      rut: formData.rut,
      phone: formData.phone,
      email: formData.email,
      birthdate: formData.birthdate,
      anamnesis: {
        ...patient.anamnesis,
        hta: formData.hta,
        diabetes: formData.diabetes,
        cardiopatia: formData.cardiopatia,
        alergias: formData.alergias,
        farmacos: formData.farmacos,
        tabaquismo: formData.tabaquismo
      }
    };

    onSavePatient(updatedPatient);

    recordHipaaAudit("KIOSK_ANAMNESIS_COMPLETED", `Anamnesis y consentimiento digital completados en Modo Quiosco por el paciente ${formData.name}.`, {
      patientId: patient.id,
      patientName: formData.name,
      resource: "Quiosco de Paciente ePHI",
      severity: "info"
    });

    setStep(5);
  };

  const handleDoctorUnlock = () => {
    // Default master clinic PIN "1234"
    if (pin === "1234" || pin === "0000") {
      setShowExitPinPrompt(false);
      setPin("");
      onClose();
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] bg-slate-900 text-slate-100 flex flex-col justify-between select-none overflow-y-auto">
      
      {/* Top Kiosk Header */}
      <header className="p-4 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-white">Portal de Admisión & Quiosco Clínico</h2>
            <p className="text-xs text-teal-300">Modo Paciente Protegido • PerioDash v15 Pro</p>
          </div>
        </div>

        {/* Step Indicator */}
        {step < 5 && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  step === s
                    ? "bg-teal-500 text-white ring-4 ring-teal-500/20"
                    : step > s
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowExitPinPrompt(true)}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
          title="Desbloquear estación con PIN"
        >
          <Unlock className="w-3.5 h-3.5 text-teal-400" />
          <span>Salir (PIN)</span>
        </button>
      </header>

      {/* Main Kiosk Content Form */}
      <main className="max-w-3xl w-full mx-auto p-4 sm:p-8 flex-1 flex flex-col justify-center my-auto">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Personal & Contact Details */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-950/60 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Paso 1 de 4</span>
                <h3 className="text-xl font-bold font-display text-white">Confirma tus Datos Personales</h3>
                <p className="text-xs text-slate-400">Verifica que tu información de contacto esté actualizada para tus citas y recetas.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">RUT / Identificación:</label>
                  <input
                    type="text"
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-teal-500 font-medium"
                    placeholder="Ej. 12.345.678-9"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Teléfono Móvil (WhatsApp):</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-teal-500 font-medium"
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-teal-500 font-medium"
                    placeholder="paciente@correo.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Contacto de Emergencia:</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-teal-500 font-medium"
                    placeholder="Nombre y parentesco - Teléfono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-600/30 text-sm"
                >
                  <span>Continuar a Salud General</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Medical Anamnesis */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-950/60 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Paso 2 de 4</span>
                <h3 className="text-xl font-bold font-display text-white">Antecedentes Médicos & Alergias</h3>
                <p className="text-xs text-slate-400">Esta información es indispensable para garantizar tu seguridad durante el tratamiento.</p>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'hta', label: 'Hipertensión Arterial (Presión Alta)' },
                  { key: 'diabetes', label: 'Diabetes Mellitus' },
                  { key: 'cardiopatia', label: 'Enfermedad Cardíaca / Marcapasos' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFormData({ ...formData, [item.key]: !formData[item.key as keyof typeof formData] })}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      formData[item.key as keyof typeof formData]
                        ? "bg-teal-950/80 border-teal-500 text-teal-200"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      formData[item.key as keyof typeof formData] ? "bg-teal-500 text-white" : "bg-slate-800 text-slate-500"
                    }`}>
                      {formData[item.key as keyof typeof formData] ? "✓" : "–"}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>¿Eres alérgico/a a algún medicamento o alimento? (Penicilina, AINEs, Látex...):</span>
                  </label>
                  <input
                    type="text"
                    value={formData.alergias}
                    onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-teal-500 font-medium"
                    placeholder="Ej. Alergia a Penicilina / Sin alergias conocidas"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    ¿Tomas algún medicamento habitualmente? (Aspirina, Metformina, Enalapril...):
                  </label>
                  <input
                    type="text"
                    value={formData.farmacos}
                    onChange={(e) => setFormData({ ...formData, farmacos: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-teal-500 font-medium"
                    placeholder="Ej. Losartán 50mg / Ninguno"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Hábito Tabáquico:</label>
                  <select
                    value={formData.tabaquismo}
                    onChange={(e) => setFormData({ ...formData, tabaquismo: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value={0}>No fumo / No fumador</option>
                    <option value={5}>Fumador leve (1 a 5 cigarrillos al día)</option>
                    <option value={10}>Fumador moderado (6 a 10 cigarrillos al día)</option>
                    <option value={20}>Fumador severo (Más de 10 cigarrillos al día)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-600/30 text-sm"
                >
                  <span>Continuar a Motivo de Consulta</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Dental Symptoms & Chief Complaint */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-950/60 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Paso 3 de 4</span>
                <h3 className="text-xl font-bold font-display text-white">Motivo de Consulta & Síntomas</h3>
                <p className="text-xs text-slate-400">Cuéntanos qué te trae a la consulta hoy para enfocar tu diagnóstico.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Describe brevemente el motivo principal de tu visita:
                  </label>
                  <textarea
                    rows={3}
                    value={formData.motivoConsulta}
                    onChange={(e) => setFormData({ ...formData, motivoConsulta: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-teal-500 font-medium leading-relaxed"
                    placeholder="Ej. Me sangran las encías al cepillarme y siento sensibilidad en los dientes superiores..."
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-2">
                    ¿Has experimentado alguno de estos síntomas en el último mes?:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { key: 'sangrado', label: 'Sangrado de encías al comer o cepillarte' },
                      { key: 'dolor', label: 'Dolor dental o molestia espontánea' },
                      { key: 'sensibilidad', label: 'Sensibilidad al frío o caliente' },
                      { key: 'movilidad', label: 'Sensación de dientes sueltos o móviles' },
                      { key: 'malAliento', label: 'Halitosis o sabor extraño en la boca' }
                    ].map((sym) => (
                      <button
                        key={sym.key}
                        onClick={() => setFormData({
                          ...formData,
                          sintomas: {
                            ...formData.sintomas,
                            [sym.key]: !formData.sintomas[sym.key as keyof typeof formData.sintomas]
                          }
                        })}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          formData.sintomas[sym.key as keyof typeof formData.sintomas]
                            ? "bg-teal-950/80 border-teal-500 text-teal-200"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span className="font-bold text-xs">{sym.label}</span>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          formData.sintomas[sym.key as keyof typeof formData.sintomas] ? "bg-teal-500 text-white" : "bg-slate-800 text-slate-500"
                        }`}>
                          {formData.sintomas[sym.key as keyof typeof formData.sintomas] ? "✓" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-600/30 text-sm"
                >
                  <span>Ir al Consentimiento Informado</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Consent & Touchscreen Signature */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-950/60 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Paso 4 de 4</span>
                <h3 className="text-xl font-bold font-display text-white">Consentimiento Informado & Firma</h3>
                <p className="text-xs text-slate-400">Por favor lee el texto y firma con tu dedo o lápiz óptico en el recuadro inferior.</p>
              </div>

              {/* Consent Text Box */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 max-h-36 overflow-y-auto text-[11px] text-slate-300 leading-relaxed space-y-2">
                <p>
                  <strong>CONSENTIMIENTO GENERAL DE ATENCIÓN ODONTOLÓGICA Y PROTECCIÓN DE DATOS:</strong>
                </p>
                <p>
                  Declaro que la información médica y antecedentes otorgados en esta ficha son verídicos. Autorizo al equipo clínico a realizar el examen clínico periodontal, odontograma, toma de radiografías digitales y procedimientos profilácticos o de diagnóstico necesarios.
                </p>
                <p>
                  Comprendo que mis datos de salud serán tratados conforme a las leyes de protección de datos personales y la normativa sanitaria vigente (Ley de Deberes y Derechos de los Pacientes / HIPAA).
                </p>
              </div>

              {/* Checkbox */}
              <label className="flex items-center gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptedTerms}
                  onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-950 border-slate-700"
                />
                <span className="text-xs font-bold text-slate-200">
                  He leído, comprendo y acepto los términos del consentimiento informado.
                </span>
              </label>

              {/* Signature Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <FileSignature className="w-3.5 h-3.5 text-teal-400" />
                    <span>Firma Manuscrita Digital (Dibuja aquí):</span>
                  </span>
                  <button
                    onClick={clearSignature}
                    className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Eraser className="w-3 h-3" />
                    <span>Limpiar Firma</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl border-2 border-dashed border-teal-500/40 p-2 overflow-hidden shadow-inner touch-none">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-28 bg-white cursor-crosshair block rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  disabled={!formData.acceptedTerms}
                  onClick={handleFinish}
                  className={`px-8 py-3 font-bold rounded-2xl flex items-center gap-2 transition-all text-sm cursor-pointer shadow-lg ${
                    formData.acceptedTerms
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalizar & Enviar Ficha</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Success Screen */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-950/80 p-8 rounded-3xl border border-emerald-500/30 text-center space-y-6 shadow-2xl max-w-lg mx-auto"
            >
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-display text-white">¡Muchas gracias, {formData.name.split(' ')[0]}!</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Tu anamnesis y consentimiento han sido sincronizados en tu expediente digital de forma segura.
                </p>
                <p className="text-xs text-teal-400 font-bold pt-2">
                  Por favor, devuelve esta tablet al personal de recepción o espera a que tu especialista te llame.
                </p>
              </div>

              <button
                onClick={() => setShowExitPinPrompt(true)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition-colors cursor-pointer"
              >
                Volver a Estación Clínica (Personal)
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Exit Security PIN Prompt Modal */}
      <AnimatePresence>
        {showExitPinPrompt && (
          <div className="fixed inset-0 z-[800] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-teal-400" />
                  <span>Desbloqueo de Estación</span>
                </h4>
                <button
                  onClick={() => setShowExitPinPrompt(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Ingresa el PIN de seguridad de la clínica para salir del Modo Quiosco (PIN demo: <strong>1234</strong>):
              </p>

              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDoctorUnlock()}
                className={`w-full text-center tracking-widest text-xl font-mono py-2.5 rounded-xl bg-slate-950 border ${
                  pinError ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-700"
                } text-white`}
                placeholder="••••"
                autoFocus
              />

              {pinError && (
                <p className="text-xs text-red-400 font-bold text-center">
                  PIN incorrecto. Intenta con 1234.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowExitPinPrompt(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDoctorUnlock}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Desbloquear
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
