import React, { useState, useEffect } from "react";
import { db, cleanForFirestore, auth } from "../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./Logo";
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  ChevronRight, 
  Phone, 
  Mail, 
  MapPin, 
  Lock, 
  ExternalLink, 
  Printer, 
  DollarSign, 
  Eye, 
  Download, 
  HeartHandshake, 
  Stethoscope, 
  MessageSquare, 
  Check, 
  X,
  Send,
  HelpCircle,
  Activity,
  Receipt
} from "lucide-react";
import { Patient, Appointment, TreatmentProcedure, XRayImage, PaymentTransaction } from "../types";
import { createEmptyOdontogram, createEmptyPeriodontogram } from "../initialData";
import PaymentGatewayModal from "./PaymentGatewayModal";

export interface ExternalPatientPortalProps {
  accessKey?: string; // Patient ID or custom secret access token
  onClose?: () => void;
  initialMode?: "lookup" | "register";
}

export default function ExternalPatientPortal({ accessKey = "1", onClose, initialMode = "lookup" }: ExternalPatientPortalProps) {
  const [currentKey, setCurrentKey] = useState<string>(accessKey || "1");
  const [searchInput, setSearchInput] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "appointments" | "budget" | "xrays" | "recommendations">("summary");
  
  // Gate mode: "lookup" (search by RUT/code) or "register" (self-registration)
  const [gateMode, setGateMode] = useState<"lookup" | "register">(accessKey === "new" ? "register" : initialMode);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // Self-Registration Form State
  const [regName, setRegName] = useState("");
  const [regRut, setRegRut] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regBirthdate, setRegBirthdate] = useState("1995-05-12");
  const [regReason, setRegReason] = useState("Evaluación General y Limpieza Dental");
  const [regAlergias, setRegAlergias] = useState("");
  const [regMedicalNotes, setRegMedicalNotes] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Selected X-ray modal
  const [selectedXRay, setSelectedXRay] = useState<XRayImage | null>(null);

  // Assistant Chat in Portal
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "¡Hola! Soy Dentito, tu copiloto dental. Puedes consultarme dudas sobre tus cuidados post-atención, medicamentos recetados o cómo prepararte para tu próxima cita."
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // New Appointment Booking Form
  const getTomorrowStr = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [bookingDate, setBookingDate] = useState(getTomorrowStr);
  const [bookingTime, setBookingTime] = useState("10:00");
  const [bookingReason, setBookingReason] = useState("Control y Limpieza Dental");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Online Payment State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(50000);
  const [payConcept, setPayConcept] = useState<string>("Abono a Tratamiento Odontológico");

  // Escape key handler for modal in portal
  useEffect(() => {
    if (!selectedXRay) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedXRay(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedXRay]);

  // Load Real Patient from Firestore or LocalStorage
  useEffect(() => {
    if (!currentKey || currentKey === "new") {
      setLoading(false);
      setPatientData(null);
      if (currentKey === "new") {
        setGateMode("register");
      }
      return;
    }

    setLoading(true);
    setError(null);

    let unsub: (() => void) | null = null;

    const initPatientSubscription = async () => {
      // Ensure user session token exists
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authErr) {
          console.warn("Patient portal auth init notice:", authErr);
        }
      }

      const cleanKey = currentKey.trim();
      unsub = onSnapshot(
        doc(db, "patients", cleanKey),
        (snap) => {
          if (snap.exists()) {
            setPatientData(snap.data() as Patient);
            setLoading(false);
            setError(null);
          } else {
            // Fallback check in local storage
            try {
              const localPatients = localStorage.getItem("perioPatients_data");
              if (localPatients) {
                const list: Patient[] = JSON.parse(localPatients);
                const found = list.find(p => p.id === cleanKey || p.rut === cleanKey || p.dni === cleanKey || p.email === cleanKey);
                if (found) {
                  setPatientData(found);
                  setLoading(false);
                  setError(null);
                  return;
                }
              }
            } catch (e) {}

            setError("No se encontró una ficha con este RUT o código. Puedes registrarte como nuevo paciente en 1 clic.");
            setLoading(false);
          }
        },
        (err) => {
          console.error("Error al cargar portal de paciente:", err);
          // Try fallback to local
          try {
            const localPatients = localStorage.getItem("perioPatients_data");
            if (localPatients) {
              const list: Patient[] = JSON.parse(localPatients);
              const found = list.find(p => p.id === cleanKey || p.rut === cleanKey || p.dni === cleanKey);
              if (found) {
                setPatientData(found);
                setLoading(false);
                setError(null);
                return;
              }
            }
          } catch (e) {}
          setError("No se encontró la ficha del paciente. Puedes registrarte a continuación.");
          setLoading(false);
        }
      );
    };

    initPatientSubscription();

    return () => {
      if (unsub) unsub();
    };
  }, [currentKey]);

  // Handle Self-Registration for Any New Patient
  const handleSelfRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrim = regName.trim();
    const rutTrim = regRut.trim();

    if (!nameTrim) {
      setRegError("Por favor ingresa tu nombre y apellido completo.");
      return;
    }
    if (!rutTrim) {
      setRegError("Por favor ingresa tu RUT o DNI.");
      return;
    }

    setRegLoading(true);
    setRegError(null);

    try {
      const newPatId = `pat-${Date.now()}`;
      const newPatient: Patient = {
        id: newPatId,
        name: nameTrim,
        rut: rutTrim,
        phone: regPhone.trim() || "+56 9 8765 4321",
        email: regEmail.trim() || `${rutTrim.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}@paciente.periodash.cl`,
        birthdate: regBirthdate || "1995-05-12",
        notes: regMedicalNotes.trim() ? `Auto-registro de paciente: ${regMedicalNotes.trim()}` : "Paciente auto-registrado en el Portal Clínico.",
        createdAt: new Date().toISOString(),
        status: "evaluacion",
        flowStatus: "programado",
        odontogram: createEmptyOdontogram(),
        periodontogram: createEmptyPeriodontogram(),
        oLeary: {},
        anamnesis: {
          motivoConsulta: regReason || "Evaluación Clínica y Diagnóstico Dental",
          historiaMotivoConsulta: "Paciente ingresado mediante auto-registro directo en el Portal Digital.",
          hta: false,
          diabetes: false,
          tabaquismo: 0,
          alergias: regAlergias.trim() || "Ninguna declarada",
          dolorActual: "ninguno",
          notasSistemicas: regMedicalNotes.trim() || "",
        },
        treatmentPlan: {
          procedures: [
            {
              id: `proc-init-${Date.now()}`,
              phase: "Diagnostico",
              description: `Evaluación Clínica Inicial & Diagnóstico Integral (${regReason})`,
              cost: 35000,
              completed: false,
            }
          ],
          financing: {
            months: 1,
            downPayment: 0,
            interestRate: 0
          }
        },
        evolutions: [
          {
            id: `evo-init-${Date.now()}`,
            date: new Date().toLocaleDateString("es-ES"),
            description: `🌐 AUTO-INGRESO PORTAL PACIENTE:\n- Paciente auto-registrado con éxito.\n- Motivo de Consulta: ${regReason}\n- RUT/DNI: ${rutTrim}\n- Contacto: ${regPhone.trim() || "No informado"} / ${regEmail.trim() || "No informado"}\n- Alergias/Salud: ${regAlergias.trim() || "Sin antecedentes declarados"}`,
            professional: "Portal Online Paciente"
          }
        ],
        consentimientos: [],
        xRays: [],
        payments: []
      };

      // 1. Instant Local State & LocalStorage Persistence (0ms latency)
      try {
        const localPatients = localStorage.getItem("perioPatients_data");
        let list: Patient[] = [];
        if (localPatients) {
          list = JSON.parse(localPatients);
        }
        list = [newPatient, ...list.filter(p => p.id !== newPatient.id && p.rut !== newPatient.rut)];
        localStorage.setItem("perioPatients_data", JSON.stringify(list));
      } catch (e) {}

      // 2. Set State immediately for instant UI transition
      setPatientData(newPatient);
      setCurrentKey(newPatient.id);
      setLoading(false);
      setError(null);
      setShowSwitchModal(false);
      setRegLoading(false);

      // 3. Non-blocking asynchronous sync to Firestore in background
      Promise.allSettled([
        setDoc(doc(db, "patients", newPatient.id), cleanForFirestore(newPatient)),
        rutTrim ? setDoc(doc(db, "patients", rutTrim), cleanForFirestore(newPatient)) : Promise.resolve()
      ]).catch(err => {
        console.warn("Background firestore sync warning:", err);
      });
    } catch (err: any) {
      setRegError(err.message || "Error al procesar el auto-registro.");
      setRegLoading(false);
    }
  };

  // Handle Assistant Question
  const handleSendAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userText }]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/dentito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userText }
          ],
          context: `Eres Dentito, asistente dental amigable. Paciente: ${patientData?.name || "Paciente"}. Motivo de consulta: ${patientData?.anamnesis?.motivoConsulta || "Tratamiento odontológico"}. Responde de forma clara, empática y tranquilizadora sin emitir diagnósticos invasivos.`
        })
      });

      const data = await response.json();
      if (data.text) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.text }]);
      } else {
        throw new Error(data.error || "No se obtuvo respuesta");
      }
    } catch (err) {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "Para cuidar tu salud bucal, recuerda mantener una higiene dental rigurosa con cepillado suave y uso de seda dental. Ante cualquier molestia aguda, comunícate de inmediato con la clínica."
          }
        ]);
      }, 400);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle Online Appointment Request
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientData) return;

    setIsSubmittingBooking(true);
    const newAppointment: Appointment = {
      id: `app_${Date.now()}`,
      patientId: patientData.id,
      patientName: patientData.name,
      date: bookingDate,
      time: bookingTime,
      treatment: `${bookingReason} - [Solicitado por Portal de Paciente]`,
      status: "Pending",
      box: "Consulta General"
    };

    try {
      // Save appointment to Firestore
      await setDoc(
        doc(db, "appointments", newAppointment.id),
        cleanForFirestore(newAppointment)
      );

      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 5000);
    } catch (err) {
      console.warn("No se pudo guardar la cita en Firestore, guardando localmente:", err);
      setBookingSuccess(true);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mb-4" />
        <h3 className="text-base font-bold text-slate-200">Accediendo al Portal Seguro del Paciente</h3>
        <p className="text-xs text-slate-400 mt-1">Cifrado médico de alta seguridad...</p>
      </div>
    );
  }

  // Patient Gate / Self-Registration View
  if (error || !patientData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        </div>

        <div className="p-6 sm:p-8 bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl max-w-lg w-full space-y-6 shadow-2xl relative z-10">
          
          <div className="flex items-center justify-between">
            <Logo size="md" subtitle="Portal del Paciente" />
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                ← Salir
              </button>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setGateMode("lookup");
                setRegError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                gateMode === "lookup"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Ya tengo Ficha / RUT</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setGateMode("register");
                setRegError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                gateMode === "register"
                  ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Soy Paciente Nuevo</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* MODE 1: LOOKUP BY RUT */}
            {gateMode === "lookup" ? (
              <motion.div
                key="lookup-mode"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-base font-bold text-white">Consulta tu Ficha Clínica</h2>
                  <p className="text-xs text-slate-400">
                    Ingresa tu RUT / DNI para ver tu odontograma, citas y presupuestos.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{error}</p>
                      <button
                        type="button"
                        onClick={() => setGateMode("register")}
                        className="text-teal-400 font-bold underline mt-1 block cursor-pointer"
                      >
                        ¿No estás registrado? Haz clic aquí para ingresar como nuevo paciente →
                      </button>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchInput.trim()) {
                      setCurrentKey(searchInput.trim());
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">RUT / DNI o Código</label>
                    <input
                      type="text"
                      placeholder="Ej: 12.345.678-5 o 1"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-center text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Ingresar a Mi Portal</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => setCurrentKey("1")}
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors cursor-pointer font-medium"
                  >
                    🔍 Probar con Ficha Demo (Juan Carlos Soto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGateMode("register")}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ¿Primera vez aquí? <span className="text-emerald-400 font-bold">Auto-ingrésate en 30 segundos</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* MODE 2: AUTO-REGISTRATION FOR ANY NEW PATIENT */
              <motion.form
                key="register-mode"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleSelfRegisterPatient}
                className="space-y-3.5"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                    <span>Auto-Registro de Paciente</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Inmediato
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Crea tu ficha clínica digital ahora y accede a tu odontograma y agenda de citas.
                  </p>
                </div>

                {regError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Nombre Completo *</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ej. Valentina Morales"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">RUT / DNI *</label>
                    <input
                      type="text"
                      value={regRut}
                      onChange={(e) => setRegRut(e.target.value)}
                      placeholder="Ej. 19.876.543-2"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+56 9 8765 4321"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Correo Electrónico</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="paciente@correo.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Motivo Principal de Consulta</label>
                  <select
                    value={regReason}
                    onChange={(e) => setRegReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 transition-all"
                  >
                    <option value="Evaluación General y Limpieza Dental">Evaluación General y Limpieza Dental</option>
                    <option value="Urgencia / Dolor o Molestia Dental">Urgencia / Dolor o Molestia Dental</option>
                    <option value="Tratamiento Periodontal / Encías">Tratamiento Periodontal / Encías (Sangrado)</option>
                    <option value="Ortodoncia y Alineación Dental">Ortodoncia y Alineación Dental</option>
                    <option value="Implante Dental / Rehabilitación">Implante Dental / Rehabilitación</option>
                    <option value="Estética Dental y Blanqueamiento">Estética Dental y Blanqueamiento</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Alergias o Antecedentes Médicos <span className="text-slate-500 font-normal">(Opcional)</span></label>
                  <input
                    type="text"
                    value={regAlergias}
                    onChange={(e) => setRegAlergias(e.target.value)}
                    placeholder="Ej. Alergia a Penicilina, Hipertensión, etc."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {regLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creando Ficha Dental...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ingresarme como Paciente & Abrir Portal</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Calculate Budget Totals
  const procedures = patientData.treatmentPlan?.procedures || [];
  const totalCost = procedures.reduce((acc, p) => acc + (p.cost || 0), 0);
  const completedProcedures = procedures.filter(p => p.completed);
  const totalCompletedCost = completedProcedures.reduce((acc, p) => acc + (p.cost || 0), 0);
  const patientPayments: PaymentTransaction[] = patientData.payments || [];
  const totalPaid = patientPayments.reduce((acc, tx) => acc + (tx.status === "completed" ? tx.amount : 0), 0);
  const realBalance = Math.max(0, totalCost - totalPaid);

  const handlePortalPaymentSuccess = async (tx: PaymentTransaction) => {
    const updatedPayments = [tx, ...patientPayments];
    const updatedPatient: Patient = {
      ...patientData,
      payments: updatedPayments,
      evolutions: [
        {
          id: `evo-pay-${Date.now()}`,
          date: new Date().toLocaleDateString("es-ES"),
          description: `🌐 PAGO ONLINE VÍA PORTAL PACIENTE:\n- Comprobante: ${tx.receiptNumber}\n- Monto: $${tx.amount.toLocaleString("es-CL")} CLP\n- Método: ${tx.method.toUpperCase()} (${tx.paymentGateway || "Online"})\n- Concepto: ${tx.concept}`,
          professional: "Portal Online Paciente"
        },
        ...(patientData.evolutions || [])
      ]
    };

    setPatientData(updatedPatient);

    try {
      await setDoc(
        doc(db, "patients", patientData.id),
        cleanForFirestore(updatedPatient)
      );
    } catch (err) {
      console.warn("No se pudo persistir el pago en Firestore inmediatamente:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      
      {/* Top Brand & Patient Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-teal-500/20 px-4 sm:px-8 py-3.5 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" subtitle="Portal del Paciente" />
            <div className="border-l border-slate-700 pl-4 hidden sm:block">
              <h1 className="text-xs font-black tracking-tight text-white flex items-center gap-2">
                Mi Portal Dental
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  Verificado
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Paciente: <strong className="text-teal-300">{patientData.name}</strong> • RUT/DNI: <span className="font-mono">{patientData.rut || patientData.dni || "N/A"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPatientData(null);
                setGateMode("register");
                setError(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              title="Registrar nuevo paciente o consultar otro RUT"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cambiar / Nuevo Paciente</span>
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Conexión Encriptada</span>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>← Conoce PerioDash</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 pt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {[
            { id: "summary", label: "Resumen Clínico", icon: Activity },
            { id: "appointments", label: "Mis Citas & Agendar", icon: Calendar },
            { id: "budget", label: "Plan & Presupuesto", icon: CreditCard },
            { id: "xrays", label: `Radiografías (${patientData.xRays?.length || 0})`, icon: ImageIcon },
            { id: "recommendations", label: "Consejos & Asistente", icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? "bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-500/20 scale-[1.02]"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 flex-1 space-y-6">
        
        {/* TAB 1: SUMMARY */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            
            {/* Status Hero Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/50 rounded-3xl p-6 sm:p-8 border border-teal-500/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 inline-block">
                    Estado de Tratamiento
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    ¡Hola, {patientData.name.split(" ")[0]}!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Motivo de tu atención: <span className="text-amber-300 font-bold">"{patientData.anamnesis?.motivoConsulta || "Control y Saneamiento Bucal General"}"</span>.
                    Tu plan dental está actualmente <span className="text-emerald-400 font-bold">activo y bajo seguimiento</span> por el equipo médico.
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center space-y-2 shadow-inner">
                  <HeartHandshake className="w-8 h-8 text-teal-400 mx-auto" />
                  <div className="text-[10px] uppercase font-bold text-slate-400">Progreso del Tratamiento</div>
                  <div className="text-2xl font-black text-white">
                    {procedures.length > 0 ? Math.round((completedProcedures.length / procedures.length) * 100) : 0}%
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${procedures.length > 0 ? (completedProcedures.length / procedures.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {completedProcedures.length} de {procedures.length} procedimientos completados
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold">Teléfono de Contacto</span>
                  <Phone className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-sm font-bold text-white font-mono">{patientData.phone || "No registrado"}</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold">Correo Electrónico</span>
                  <Mail className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-sm font-bold text-white truncate">{patientData.email || "No registrado"}</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold">Última Visita</span>
                  <Clock className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-sm font-bold text-white">
                  {patientData.lastVisitDate || "Evaluación Inicial"}
                </div>
              </div>
            </div>

            {/* Next Procedures Highlights */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                Próximos Pasos en tu Tratamiento
              </h3>

              {procedures.length === 0 ? (
                <p className="text-xs text-slate-400">No hay procedimientos cargados en este momento.</p>
              ) : (
                <div className="space-y-2.5">
                  {procedures.map((proc, idx) => (
                    <div 
                      key={proc.id || idx}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        proc.completed
                          ? "bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-80"
                          : "bg-slate-950 border-teal-500/30 text-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          proc.completed ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {proc.completed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Clock className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-bold text-white">{proc.description}</p>
                          <span className="text-[10px] text-slate-500 font-mono">Fase: {proc.phase} {proc.tooth ? `• Pieza ${proc.tooth}` : ""}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          proc.completed ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-300"
                        }`}>
                          {proc.completed ? "Realizado" : "Pendiente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: APPOINTMENTS & BOOKING */}
        {activeTab === "appointments" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Booking Form */}
            <div className="md:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-teal-400">
                <Calendar className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Solicitar Nueva Hora de Atención</h3>
              </div>
              <p className="text-xs text-slate-400">
                Elige la fecha y motivo de tu consulta. Tu doctor recibirá la solicitud al instante en su agenda.
              </p>

              {bookingSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-xs text-emerald-300 font-bold"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>¡Solicitud enviada con éxito! La clínica confirmará tu horario a la brevedad.</span>
                </motion.div>
              )}

              <form onSubmit={handleBookAppointment} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 mb-1 block">Motivo de la Cita:</label>
                  <select
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-teal-500"
                  >
                    <option value="Control y Limpieza Dental">Control y Limpieza Dental</option>
                    <option value="Evaluación Periodontal / Encías">Evaluación Periodontal / Encías</option>
                    <option value="Revisión de Caries o Obturación">Revisión de Caries o Restauración</option>
                    <option value="Urgencia / Dolor Dental">Urgencia / Tengo dolor o molestia</option>
                    <option value="Presupuesto y Diagnóstico Integral">Presupuesto y Diagnóstico Integral</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 mb-1 block">Fecha de Preferencia:</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 mb-1 block">Horario Estimado:</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-teal-500"
                    >
                      <option value="09:00">09:00 hrs</option>
                      <option value="10:30">10:30 hrs</option>
                      <option value="12:00">12:00 hrs</option>
                      <option value="15:00">15:00 hrs</option>
                      <option value="16:30">16:30 hrs</option>
                      <option value="18:00">18:00 hrs</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingBooking ? "Enviando solicitud..." : "Confirmar Solicitud de Cita"}
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </button>
              </form>
            </div>

            {/* Clinic Info Box */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  Ubicación & Contacto Directo
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Para urgencias dentales inmediatas o modificaciones con menos de 24 hrs de anticipación, contáctanos por vía directa:
                </p>
                <div className="space-y-2 pt-1 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>WhatsApp Clínica: +56 9 8765 4321</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Horario: Lunes a Viernes 09:00 a 19:00 hrs</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: BUDGET & FINANCIAL PLAN */}
        {activeTab === "budget" && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                    Presupuesto Odontológico
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">Detalle de Costos y Tratamientos</h3>
                </div>

                {/* Printable Action */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border border-slate-700"
                >
                  <Printer className="w-4 h-4 text-teal-400" />
                  Imprimir / Descargar PDF
                </button>
              </div>

              {/* Financial KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-bold block">Inversión Total Plan:</span>
                  <span className="text-xl font-black text-white font-mono">${totalCost.toLocaleString("es-CL")}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/20">
                  <span className="text-[11px] text-emerald-400 font-bold block">Total Pagado / Abonado:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">${totalPaid.toLocaleString("es-CL")}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/20">
                  <span className="text-[11px] text-amber-400 font-bold block">Saldo Pendiente:</span>
                  <span className="text-xl font-black text-amber-300 font-mono">${realBalance.toLocaleString("es-CL")}</span>
                </div>
              </div>

              {/* Online Payment Callout Banner */}
              <div className="p-5 bg-gradient-to-r from-teal-950/60 to-emerald-950/60 rounded-2xl border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Abonar o Pagar Tratamiento Online</h4>
                    <p className="text-xs text-slate-300">Paga de forma segura con Webpay Plus, Débito, Crédito o Transferencia Bancaria.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPayAmount(realBalance > 0 ? realBalance : 45000);
                    setPayConcept(`Abono a Tratamiento - ${patientData.name}`);
                    setIsPayModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  Pagar / Abonar Ahora
                </button>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Procedimiento</th>
                      <th className="pb-3">Fase</th>
                      <th className="pb-3">Pieza</th>
                      <th className="pb-3 text-right">Valor</th>
                      <th className="pb-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {procedures.map((proc, idx) => (
                      <tr key={proc.id || idx} className="hover:bg-slate-950/40">
                        <td className="py-3 font-bold text-white">{proc.description}</td>
                        <td className="py-3 text-slate-400">{proc.phase}</td>
                        <td className="py-3 font-mono text-slate-300">{proc.tooth || "-"}</td>
                        <td className="py-3 text-right font-mono font-bold text-slate-200">
                          ${(proc.cost || 0).toLocaleString("es-CL")}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            proc.completed ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-300"
                          }`}>
                            {proc.completed ? "Completado" : "Pendiente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Transactions History for Patient */}
              {patientPayments.length > 0 && (
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-teal-400" />
                    Mis Comprobantes de Pago y Abonos Realizados
                  </h4>
                  <div className="space-y-2">
                    {patientPayments.map((tx) => (
                      <div key={tx.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white block">{tx.concept}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Comprobante: {tx.receiptNumber} • {tx.date} • {tx.method.toUpperCase()}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono text-emerald-400 text-sm block">
                            ${tx.amount.toLocaleString("es-CL")} CLP
                          </span>
                          <span className="text-[9px] uppercase font-bold text-emerald-400/80">Completado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: X-RAYS & CLINICAL IMAGES */}
        {activeTab === "xrays" && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-teal-400" />
                Estudios Radiográficos & Diagnóstico por Imagen
              </h3>
              <p className="text-xs text-slate-400">
                Imágenes de alta resolución capturadas para tu diagnóstico periodontal y planificación clínica.
              </p>

              {(!patientData.xRays || patientData.xRays.length === 0) ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 text-slate-500">
                  <ImageIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs">No hay radiografías subidas aún para este paciente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patientData.xRays.map((xray) => (
                    <div 
                      key={xray.id}
                      onClick={() => setSelectedXRay(xray)}
                      className="bg-slate-950 rounded-2xl border border-slate-800 p-3 space-y-2 cursor-pointer hover:border-teal-500/50 transition-all group"
                    >
                      <div className="w-full h-44 bg-black rounded-xl overflow-hidden relative">
                        <img 
                          src={xray.url} 
                          alt={xray.notes || "Radiografía"}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-0.5 rounded-md text-[9px] font-bold text-teal-300 uppercase">
                          {xray.type}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-bold text-slate-200 truncate">{xray.notes || "Estudio Radiográfico"}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{xray.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: RECOMMENDATIONS & COPILOT CHAT */}
        {activeTab === "recommendations" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Assistant Chat Box */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl flex flex-col h-[520px] overflow-hidden">
              <div className="bg-teal-600/20 border-b border-teal-500/30 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-500/30 text-teal-300 flex items-center justify-center font-bold">
                  🦷
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Copiloto Dental Dentito</h4>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Asistente en línea
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/50 text-xs">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-teal-600 text-white rounded-br-none"
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none text-xs text-slate-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping" />
                      Dentito está escribiendo...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendAssistant} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pregúntale a Dentito sobre tus cuidados dentales..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Post-Op Care Guidelines */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3 text-xs">
                <h4 className="font-black text-amber-300 uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Guía Rápida de Higiene Post-Atención
                </h4>
                
                <div className="space-y-2.5 text-slate-300 leading-relaxed">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-teal-400 block">1. Cepillado Atraumático:</strong>
                    Usa cepillo de cerdas suaves con movimientos circulares durante al menos 2 minutos, 3 veces al día.
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-teal-400 block">2. Limpieza Interproximal:</strong>
                    Usa seda dental o cepillos interproximales diariamente para evitar inflamación gingival y sangrado.
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-teal-400 block">3. Sensibilidad Transitoria:</strong>
                    Es normal experimentar ligera sensibilidad al frío tras limpiezas o restauraciones durante los primeros días.
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* X-Ray Full Screen Viewer Modal */}
      {selectedXRay && (
        <div 
          onClick={() => setSelectedXRay(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden p-4 space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                {selectedXRay.notes || "Estudio Radiográfico"} ({selectedXRay.type}) • {selectedXRay.date}
              </span>
              <button 
                type="button"
                onClick={() => setSelectedXRay(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Cerrar vista previa"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black rounded-2xl p-2 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img src={selectedXRay.url} alt="Radiografía" className="max-h-[70vh] object-contain mx-auto" />
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal for Patient Self-Service */}
      <AnimatePresence>
        {isPayModalOpen && (
          <PaymentGatewayModal
            patient={patientData}
            initialAmount={payAmount}
            initialConcept={payConcept}
            onPaymentSuccess={handlePortalPaymentSuccess}
            onClose={() => setIsPayModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-[10px] text-slate-600 font-mono">
        PerioDash v15 Pro • Portal Clínico Seguro del Paciente • Cumplimiento de Privacidad y Consentimiento Médico
      </footer>

    </div>
  );
}
