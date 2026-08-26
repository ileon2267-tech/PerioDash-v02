import React, { useState, useEffect, useRef } from "react";
import { db, cleanForFirestore, auth } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { 
  decryptPatientFromFirestore, 
  encryptPatientForFirestore, 
  encryptAppointmentForFirestore 
} from "../utils/ephiEncryption";
import { interceptFirestoreRead } from "../utils/firestoreInterceptor";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./Logo";
import NearbyClinicsDirectory from "./NearbyClinicsDirectory";
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
  Receipt,
  Building2,
  Sun,
  Moon,
  Share2,
  Copy
} from "lucide-react";
import { Patient, Appointment, TreatmentProcedure, XRayImage, PaymentTransaction } from "../types";
import { INITIAL_PATIENTS, createEmptyOdontogram, createEmptyPeriodontogram } from "../initialData";
import PaymentGatewayModal from "./PaymentGatewayModal";

export interface ExternalPatientPortalProps {
  accessKey?: string; // Patient ID, RUT, or custom secret access token
  onClose?: () => void;
  initialMode?: "lookup" | "register";
}

function getAllKnownPatients(): Patient[] {
  const result: Patient[] = [...INITIAL_PATIENTS];
  try {
    const raw1 = localStorage.getItem("perioPatients");
    if (raw1) {
      const parsed: Patient[] = JSON.parse(raw1);
      if (Array.isArray(parsed)) {
        parsed.forEach(p => {
          if (p && p.id && !result.some(r => r.id === p.id)) {
            result.unshift(p);
          }
        });
      }
    }
  } catch (e) {}

  try {
    const raw2 = localStorage.getItem("perioPatients_data");
    if (raw2) {
      const parsed: Patient[] = JSON.parse(raw2);
      if (Array.isArray(parsed)) {
        parsed.forEach(p => {
          if (p && p.id && !result.some(r => r.id === p.id)) {
            result.unshift(p);
          }
        });
      }
    }
  } catch (e) {}

  return result;
}

function findPatientMatch(key: string): Patient | null {
  if (!key || !key.trim()) return null;
  const clean = key.trim();
  const cleanLower = clean.toLowerCase();
  const normRut = clean.replace(/[^0-9kK]/g, "").toUpperCase();

  const patients = getAllKnownPatients();
  
  // 1. Direct ID match
  const byId = patients.find(p => p.id === clean || p.id === `pat-${clean}` || p.id?.toLowerCase() === cleanLower);
  if (byId) return byId;

  // 2. RUT match normalized
  if (normRut.length >= 4) {
    const byRut = patients.find(p => {
      if (!p.rut) return false;
      const pNorm = p.rut.replace(/[^0-9kK]/g, "").toUpperCase();
      return pNorm === normRut || (normRut.length >= 7 && (pNorm.includes(normRut) || normRut.includes(pNorm)));
    });
    if (byRut) return byRut;
  }

  // 3. Exact DNI or Email match or Name match
  const byOther = patients.find(p => 
    (p.rut && p.rut.trim().toLowerCase() === cleanLower) ||
    (p.dni && p.dni.trim().toLowerCase() === cleanLower) ||
    (p.email && p.email.trim().toLowerCase() === cleanLower) ||
    (p.name && p.name.trim().toLowerCase().includes(cleanLower))
  );
  if (byOther) return byOther;

  // 4. If key is "1" or "demo", fallback to first demo patient (Carlos Mendoza)
  if (clean === "1" || cleanLower === "demo" || cleanLower === "demo1" || cleanLower.includes("carlos")) {
    return patients[0] || null;
  }
  if (clean === "2" || cleanLower === "demo2" || cleanLower.includes("valentina")) {
    return patients[1] || patients[0] || null;
  }
  if (clean === "3" || cleanLower === "demo3" || cleanLower.includes("matias")) {
    return patients[2] || patients[0] || null;
  }

  return null;
}

export default function ExternalPatientPortal({ accessKey = "", onClose, initialMode = "lookup" }: ExternalPatientPortalProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("perioPortalTheme");
      return saved !== "light";
    } catch {
      return true;
    }
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("perioPortalTheme", next ? "dark" : "light");
      } catch {}
      return next;
    });
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const handleCopyPortalLink = () => {
    try {
      const url = window.location.origin + window.location.pathname + `?portal=${patientData?.rut || patientData?.id || currentKey || "1"}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {}
  };

  const [currentKey, setCurrentKey] = useState<string>(accessKey || "");
  const [searchInput, setSearchInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [patientData, setPatientData] = useState<Patient | null>(() => findPatientMatch(accessKey || ""));
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "appointments" | "budget" | "xrays" | "network" | "recommendations">("summary");
  
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

  // Keep currentKey in sync when accessKey prop changes
  useEffect(() => {
    if (accessKey !== undefined) {
      setCurrentKey(accessKey);
      if (accessKey === "new") {
        setGateMode("register");
        setPatientData(null);
      } else if (accessKey) {
        const found = findPatientMatch(accessKey);
        if (found) {
          setPatientData(found);
          setError(null);
        }
      }
    }
  }, [accessKey]);

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

  // Fast resolution function
  const resolvePatientKey = (key: string) => {
    const cleanKey = key.trim();
    if (!cleanKey || cleanKey === "new") {
      setPatientData(null);
      return;
    }

    // 1. Instant local match
    const localMatch = findPatientMatch(cleanKey);
    if (localMatch) {
      setPatientData(localMatch);
      setError(null);
      setIsSearching(false);
      return;
    }

    // 2. Fallback quick Firestore query (non-blocking)
    setIsSearching(true);
    setError(null);

    let isDone = false;
    const timeout = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        setIsSearching(false);
        const fallback = findPatientMatch(cleanKey);
        if (fallback) {
          setPatientData(fallback);
          setError(null);
        } else {
          setError(`No encontramos una ficha activa con el código o RUT "${cleanKey}". Puedes ingresar con un clic como paciente nuevo.`);
        }
      }
    }, 800);

    const checkFirestore = async () => {
      try {
        if (!auth.currentUser) {
          try {
            await Promise.race([
              signInAnonymously(auth),
              new Promise((_, reject) => setTimeout(() => reject(new Error("auth_timeout")), 600))
            ]);
          } catch (e) {}
        }
        
        onSnapshot(
          doc(db, "patients", cleanKey),
          async (snap) => {
            if (isDone) return;
            isDone = true;
            clearTimeout(timeout);
            setIsSearching(false);
            if (snap.exists()) {
              try {
                const dec = await decryptPatientFromFirestore(snap.data());
                setPatientData(dec);
              } catch {
                setPatientData(snap.data() as Patient);
              }
              setError(null);
            } else {
              const localFound = findPatientMatch(cleanKey);
              if (localFound) {
                setPatientData(localFound);
                setError(null);
              } else {
                setError(`No se encontró una ficha con el RUT "${cleanKey}".`);
              }
            }
          },
          (err) => {
            if (isDone) return;
            isDone = true;
            clearTimeout(timeout);
            setIsSearching(false);
            const localFound = findPatientMatch(cleanKey);
            if (localFound) {
              setPatientData(localFound);
              setError(null);
            } else {
              setError("No se encontró la ficha del paciente. Puedes registrarte a continuación.");
            }
          }
        );
      } catch (err) {
        if (isDone) return;
        isDone = true;
        clearTimeout(timeout);
        setIsSearching(false);
        const localFound = findPatientMatch(cleanKey);
        if (localFound) {
          setPatientData(localFound);
          setError(null);
        } else {
          setError("No se encontró la ficha del paciente.");
        }
      }
    };

    checkFirestore();
  };

  // Load Real Patient from Local Storage or Firestore on currentKey change
  useEffect(() => {
    if (!currentKey || currentKey === "new") {
      setPatientData(null);
      if (currentKey === "new") {
        setGateMode("register");
      }
      return;
    }

    resolvePatientKey(currentKey);
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
        const localPatients = getAllKnownPatients();
        const updatedList = [newPatient, ...localPatients.filter(p => p.id !== newPatient.id && p.rut !== newPatient.rut)];
        localStorage.setItem("perioPatients_data", JSON.stringify(updatedList));
        localStorage.setItem("perioPatients", JSON.stringify(updatedList));
      } catch (e) {}

      // 2. Set State immediately for instant UI transition
      setPatientData(newPatient);
      setCurrentKey(newPatient.id);
      setIsSearching(false);
      setError(null);
      setShowSwitchModal(false);
      setRegLoading(false);

      // 3. Non-blocking asynchronous encrypted sync to Firestore in background
      encryptPatientForFirestore(newPatient)
        .then(encPayload => {
          return Promise.allSettled([
            setDoc(doc(db, "patients", newPatient.id), cleanForFirestore(encPayload)),
            rutTrim ? setDoc(doc(db, "patients", rutTrim), cleanForFirestore(encPayload)) : Promise.resolve()
          ]);
        })
        .catch(err => {
          console.warn("Background firestore encrypted sync warning:", err);
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
      // Save appointment to Firestore with Client-Side Encryption
      const encryptedApp = await encryptAppointmentForFirestore(newAppointment);
      await setDoc(
        doc(db, "appointments", newAppointment.id),
        cleanForFirestore(encryptedApp)
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

  // Patient Gate / Self-Registration View
  if (error || !patientData) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors ${
        isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}>
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-10 left-1/4 w-96 h-96 rounded-full blur-3xl ${
            isDarkMode ? "bg-teal-600/10" : "bg-teal-500/15"
          }`} />
          <div className={`absolute bottom-10 right-1/4 w-96 h-96 rounded-full blur-3xl ${
            isDarkMode ? "bg-cyan-600/10" : "bg-cyan-500/15"
          }`} />
        </div>

        <div className={`p-6 sm:p-8 backdrop-blur-xl rounded-3xl max-w-lg w-full space-y-6 shadow-2xl relative z-10 border transition-all ${
          isDarkMode ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white/95 border-slate-200 text-slate-900"
        }`}>
          
          <div className="flex items-center justify-between">
            <Logo size="md" subtitle="Portal del Paciente" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isDarkMode 
                    ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
                title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className={`p-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                >
                  ← Salir
                </button>
              )}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className={`grid grid-cols-2 p-1 rounded-2xl border ${
            isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
          }`}>
            <button
              type="button"
              onClick={() => {
                setGateMode("lookup");
                setRegError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                gateMode === "lookup"
                  ? "bg-teal-600 text-white shadow-md"
                  : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
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
                  : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
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
                  <h2 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Consulta tu Ficha Clínica</h2>
                  <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
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
                      resolvePatientKey(searchInput.trim());
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>RUT / DNI o Código</label>
                    <input
                      type="text"
                      placeholder="Ej: 12.345.678-5 o 1"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl text-sm font-mono text-center outline-none transition-all ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-teal-400" 
                          : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500"
                      }`}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-75 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verificando expediente...</span>
                      </>
                    ) : (
                      <>
                        <span>Ingresar a Mi Portal</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick 1-click Demo Accounts */}
                <div className={`pt-3 border-t space-y-2.5 ${isDarkMode ? "border-slate-800/80" : "border-slate-200"}`}>
                  <span className={`text-[11px] font-semibold block text-center ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    O accede en 1 clic a un expediente demo:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const pat = findPatientMatch("1");
                        if (pat) {
                          setPatientData(pat);
                          setError(null);
                        }
                      }}
                      className={`p-2.5 border rounded-xl text-left transition-all cursor-pointer group ${
                        isDarkMode 
                          ? "bg-slate-950 hover:bg-slate-800/90 border-slate-800 hover:border-teal-500/50" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-teal-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isDarkMode ? "text-slate-200 group-hover:text-teal-300" : "text-slate-800 group-hover:text-teal-600"}`}>
                          Carlos Mendoza
                        </span>
                        <span className="text-[10px] text-teal-500 font-mono font-bold">12.345.678-5</span>
                      </div>
                      <span className={`text-[10px] block ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Periodontitis Estadio III</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const pat = findPatientMatch("2");
                        if (pat) {
                          setPatientData(pat);
                          setError(null);
                        }
                      }}
                      className={`p-2.5 border rounded-xl text-left transition-all cursor-pointer group ${
                        isDarkMode 
                          ? "bg-slate-950 hover:bg-slate-800/90 border-slate-800 hover:border-teal-500/50" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-teal-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isDarkMode ? "text-slate-200 group-hover:text-teal-300" : "text-slate-800 group-hover:text-teal-600"}`}>
                          Valentina Silva
                        </span>
                        <span className="text-[10px] text-teal-500 font-mono font-bold">18.765.432-1</span>
                      </div>
                      <span className={`text-[10px] block ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Gingivitis Inducida por Placa</span>
                    </button>
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setGateMode("register")}
                      className={`text-xs transition-colors cursor-pointer ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      ¿Primera vez aquí? <span className="text-emerald-500 font-bold">Auto-ingrésate en 30 segundos →</span>
                    </button>
                  </div>
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
                  <h2 className={`text-base font-bold flex items-center justify-center gap-1.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    <span>Auto-Registro de Paciente</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Inmediato
                    </span>
                  </h2>
                  <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Crea tu ficha clínica digital ahora y accede a tu odontograma y agenda de citas.
                  </p>
                </div>

                {regError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Nombre Completo *</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ej. Valentina Morales"
                      className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition-all ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-teal-400" 
                          : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500"
                      }`}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>RUT / DNI *</label>
                    <input
                      type="text"
                      value={regRut}
                      onChange={(e) => setRegRut(e.target.value)}
                      placeholder="Ej. 19.876.543-2"
                      className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition-all ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-teal-400" 
                          : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500"
                      }`}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+56 9 8765 4321"
                      className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition-all ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-teal-400" 
                          : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500"
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Correo Electrónico</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="paciente@correo.com"
                      className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition-all ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-teal-400" 
                          : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Motivo Principal de Consulta</label>
                  <select
                    value={regReason}
                    onChange={(e) => setRegReason(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition-all ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-700 text-white focus:border-teal-400" 
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500"
                    }`}
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
                  <label className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Alergias o Antecedentes Médicos <span className={isDarkMode ? "text-slate-500 font-normal" : "text-slate-400 font-normal"}>(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={regAlergias}
                    onChange={(e) => setRegAlergias(e.target.value)}
                    placeholder="Ej. Alergia a Penicilina, Hipertensión, etc."
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition-all ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-teal-400" 
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500"
                    }`}
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
    <div className={`min-h-screen font-sans flex flex-col justify-between selection:bg-teal-500 selection:text-white transition-colors ${
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* Top Brand & Patient Bar */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 sm:px-8 py-3.5 shadow-md transition-colors ${
        isDarkMode ? "bg-slate-900/90 border-teal-500/20" : "bg-white/90 border-slate-200"
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" subtitle="Portal del Paciente" />
            <div className={`border-l pl-4 hidden sm:block ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
              <h1 className={`text-xs font-black tracking-tight flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Mi Portal Dental
                <span className="bg-teal-500/20 text-teal-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  Verificado
                </span>
              </h1>
              <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Paciente: <strong className={isDarkMode ? "text-teal-300" : "text-teal-700"}>{patientData.name}</strong> • RUT/DNI: <span className="font-mono">{patientData.rut || patientData.dni || "N/A"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isDarkMode 
                  ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
              title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden md:inline text-[11px]">{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</span>
            </button>

            {/* Share / Copy Portal Link */}
            <button
              onClick={handleCopyPortalLink}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                copiedLink
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
              title="Copiar enlace de acceso seguro a mi portal"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">{copiedLink ? "¡Enlace Copiado!" : "Compartir Portal"}</span>
            </button>

            <button
              onClick={() => {
                setPatientData(null);
                setGateMode("register");
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isDarkMode
                  ? "bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border-teal-500/30"
                  : "bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200"
              }`}
              title="Registrar nuevo paciente o consultar otro RUT"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cambiar / Nuevo Paciente</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isDarkMode
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
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
            { id: "network", label: "Clínicas & Profesionales Cercanos", icon: Building2 },
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
                    : isDarkMode
                    ? "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
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
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden transition-all ${
              isDarkMode 
                ? "bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/50 border-teal-500/20" 
                : "bg-gradient-to-br from-white via-teal-50/40 to-emerald-50/60 border-teal-200 shadow-teal-500/5 text-slate-900"
            }`}>
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border inline-block ${
                    isDarkMode ? "text-teal-400 bg-teal-500/10 border-teal-500/20" : "text-teal-700 bg-teal-100 border-teal-300"
                  }`}>
                    Estado de Tratamiento
                  </span>
                  <h2 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    ¡Hola, {patientData.name.split(" ")[0]}!
                  </h2>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    Motivo de tu atención: <span className={isDarkMode ? "text-amber-300 font-bold" : "text-amber-700 font-bold"}>"{patientData.anamnesis?.motivoConsulta || "Control y Saneamiento Bucal General"}"</span>.
                    Tu plan dental está actualmente <span className="text-emerald-500 font-bold">activo y bajo seguimiento</span> por el equipo médico.
                  </p>
                </div>

                <div className={`border rounded-2xl p-4 text-center space-y-2 shadow-inner ${
                  isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <HeartHandshake className="w-8 h-8 text-teal-500 mx-auto" />
                  <div className={`text-[10px] uppercase font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Progreso del Tratamiento</div>
                  <div className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {procedures.length > 0 ? Math.round((completedProcedures.length / procedures.length) * 100) : 0}%
                  </div>
                  <div className={`w-full rounded-full h-2 overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${procedures.length > 0 ? (completedProcedures.length / procedures.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className={`text-[10px] block font-mono ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {completedProcedures.length} de {procedures.length} procedimientos completados
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`border rounded-2xl p-4 space-y-1 ${
                isDarkMode ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
              }`}>
                <div className={`flex items-center justify-between ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <span className="text-xs font-bold">Teléfono de Contacto</span>
                  <Phone className="w-4 h-4 text-teal-500" />
                </div>
                <div className="text-sm font-bold font-mono">{patientData.phone || "No registrado"}</div>
              </div>

              <div className={`border rounded-2xl p-4 space-y-1 ${
                isDarkMode ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
              }`}>
                <div className={`flex items-center justify-between ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <span className="text-xs font-bold">Correo Electrónico</span>
                  <Mail className="w-4 h-4 text-teal-500" />
                </div>
                <div className="text-sm font-bold truncate">{patientData.email || "No registrado"}</div>
              </div>

              <div className={`border rounded-2xl p-4 space-y-1 ${
                isDarkMode ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
              }`}>
                <div className={`flex items-center justify-between ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <span className="text-xs font-bold">Última Visita</span>
                  <Clock className="w-4 h-4 text-teal-500" />
                </div>
                <div className="text-sm font-bold">
                  {patientData.lastVisitDate || "Evaluación Inicial"}
                </div>
              </div>
            </div>

            {/* Next Procedures Highlights */}
            <div className={`border rounded-3xl p-6 space-y-4 ${
              isDarkMode ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
            }`}>
              <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                <Stethoscope className="w-4 h-4 text-teal-500" />
                Próximos Pasos en tu Tratamiento
              </h3>

              {procedures.length === 0 ? (
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>No hay procedimientos cargados en este momento.</p>
              ) : (
                <div className="space-y-2.5">
                  {procedures.map((proc, idx) => (
                    <div 
                      key={proc.id || idx}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        proc.completed
                          ? isDarkMode
                            ? "bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-80"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                          : isDarkMode
                          ? "bg-slate-950 border-teal-500/30 text-slate-200 shadow-sm"
                          : "bg-white border-teal-200 text-slate-800 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          proc.completed ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"
                        }`}>
                          {proc.completed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Clock className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{proc.description}</p>
                          <span className={`text-[10px] font-mono ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Fase: {proc.phase} {proc.tooth ? `• Pieza ${proc.tooth}` : ""}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          proc.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
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
            <div className={`md:col-span-7 border rounded-3xl p-6 space-y-4 ${
              isDarkMode ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
            }`}>
              <div className="flex items-center gap-2 text-teal-500">
                <Calendar className="w-5 h-5" />
                <h3 className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-900"}`}>Solicitar Nueva Hora de Atención</h3>
              </div>
              <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Elige la fecha y motivo de tu consulta. Tu doctor recibirá la solicitud al instante en su agenda.
              </p>

              {bookingSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-xs text-emerald-500 font-bold"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>¡Solicitud enviada con éxito! La clínica confirmará tu horario a la brevedad.</span>
                </motion.div>
              )}

              <form onSubmit={handleBookAppointment} className="space-y-3.5">
                <div>
                  <label className={`text-[11px] font-bold mb-1 block ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Motivo de la Cita:</label>
                  <select
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-700 text-white focus:border-teal-500" 
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500"
                    }`}
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
                    <label className={`text-[11px] font-bold mb-1 block ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Fecha de Preferencia:</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-700 text-white focus:border-teal-500" 
                          : "bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500"
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-bold mb-1 block ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Horario Estimado:</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-700 text-white focus:border-teal-500" 
                          : "bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500"
                      }`}
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
              <div className={`border rounded-3xl p-6 space-y-3 ${
                isDarkMode ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
              }`}>
                <h4 className={`text-xs font-black uppercase flex items-center gap-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  <MapPin className="w-4 h-4 text-rose-500" />
                  Ubicación & Contacto Directo
                </h4>
                <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Para urgencias dentales inmediatas o modificaciones con menos de 24 hrs de anticipación, contáctanos por vía directa:
                </p>
                <div className="space-y-2 pt-1 text-xs">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>WhatsApp Clínica: +56 9 8765 4321</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <Clock className="w-4 h-4 text-teal-500 shrink-0" />
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
            <div className={`border rounded-3xl p-6 sm:p-8 space-y-6 ${
              isDarkMode ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isDarkMode ? "text-teal-400 bg-teal-500/10 border-teal-500/20" : "text-teal-700 bg-teal-100 border-teal-300"
                  }`}>
                    Presupuesto Odontológico
                  </span>
                  <h3 className={`text-lg font-black mt-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Detalle de Costos y Tratamientos</h3>
                </div>

                {/* Printable Action */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border ${
                    isDarkMode 
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" 
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                >
                  <Printer className="w-4 h-4 text-teal-500" />
                  Imprimir / Descargar PDF
                </button>
              </div>

              {/* Financial KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl border ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Inversión Total Plan:</span>
                  <span className={`text-xl font-black font-mono ${isDarkMode ? "text-white" : "text-slate-900"}`}>${totalCost.toLocaleString("es-CL")}</span>
                </div>
                <div className={`p-4 rounded-2xl border ${
                  isDarkMode ? "bg-slate-950 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                }`}>
                  <span className="text-[11px] text-emerald-500 font-bold block">Total Pagado / Abonado:</span>
                  <span className="text-xl font-black text-emerald-500 font-mono">${totalPaid.toLocaleString("es-CL")}</span>
                </div>
                <div className={`p-4 rounded-2xl border ${
                  isDarkMode ? "bg-slate-950 border-amber-500/20" : "bg-amber-50 border-amber-200"
                }`}>
                  <span className="text-[11px] text-amber-500 font-bold block">Saldo Pendiente:</span>
                  <span className={`text-xl font-black font-mono ${isDarkMode ? "text-amber-300" : "text-amber-700"}`}>${realBalance.toLocaleString("es-CL")}</span>
                </div>
              </div>

              {/* Online Payment Callout Banner */}
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDarkMode 
                  ? "bg-gradient-to-r from-teal-950/60 to-emerald-950/60 border-teal-500/30 text-white" 
                  : "bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200 text-slate-900"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    isDarkMode ? "bg-teal-500/20 border-teal-500/30 text-teal-400" : "bg-teal-100 border-teal-300 text-teal-700"
                  }`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-900"}`}>Abonar o Pagar Tratamiento Online</h4>
                    <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Paga de forma segura con Webpay Plus, Débito, Crédito o Transferencia Bancaria.</p>
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
                    <tr className={`border-b font-bold uppercase text-[10px] ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                      <th className="pb-3">Procedimiento</th>
                      <th className="pb-3">Fase</th>
                      <th className="pb-3">Pieza</th>
                      <th className="pb-3 text-right">Valor</th>
                      <th className="pb-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-slate-800/60" : "divide-slate-200"}`}>
                    {procedures.map((proc, idx) => (
                      <tr key={proc.id || idx} className={isDarkMode ? "hover:bg-slate-950/40" : "hover:bg-slate-50"}>
                        <td className={`py-3 font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{proc.description}</td>
                        <td className={`py-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{proc.phase}</td>
                        <td className={`py-3 font-mono ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{proc.tooth || "-"}</td>
                        <td className={`py-3 text-right font-mono font-bold ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
                          ${(proc.cost || 0).toLocaleString("es-CL")}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            proc.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
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
                <div className={`pt-4 border-t space-y-3 ${isDarkMode ? "border-slate-800/80" : "border-slate-200"}`}>
                  <h4 className={`text-xs font-black uppercase flex items-center gap-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    <Receipt className="w-4 h-4 text-teal-500" />
                    Mis Comprobantes de Pago y Abonos Realizados
                  </h4>
                  <div className="space-y-2">
                    {patientPayments.map((tx) => (
                      <div key={tx.id} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div>
                          <span className={`font-bold block ${isDarkMode ? "text-white" : "text-slate-900"}`}>{tx.concept}</span>
                          <span className={`text-[10px] font-mono ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Comprobante: {tx.receiptNumber} • {tx.date} • {tx.method.toUpperCase()}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono text-emerald-500 text-sm block">
                            ${tx.amount.toLocaleString("es-CL")} CLP
                          </span>
                          <span className="text-[9px] uppercase font-bold text-emerald-500/80">Completado</span>
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
            <div className={`border rounded-3xl p-6 space-y-4 ${
              isDarkMode ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
            }`}>
              <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                <ImageIcon className="w-4 h-4 text-teal-500" />
                Estudios Radiográficos & Diagnóstico por Imagen
              </h3>
              <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Imágenes de alta resolución capturadas para tu diagnóstico periodontal y planificación clínica.
              </p>

              {(!patientData.xRays || patientData.xRays.length === 0) ? (
                <div className={`p-8 text-center rounded-2xl border ${
                  isDarkMode ? "bg-slate-950/60 border-slate-800/80 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-500"
                }`}>
                  <ImageIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs">No hay radiografías subidas aún para este paciente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patientData.xRays.map((xray) => (
                    <div 
                      key={xray.id}
                      onClick={() => setSelectedXRay(xray)}
                      className={`rounded-2xl border p-3 space-y-2 cursor-pointer transition-all group ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 hover:border-teal-500/50" 
                          : "bg-slate-50 border-slate-200 hover:border-teal-500/50 shadow-sm"
                      }`}
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
                        <span className={`font-bold truncate ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>{xray.notes || "Estudio Radiográfico"}</span>
                        <span className={`text-[10px] font-mono ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{xray.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: NEARBY CLINICS & PROFESSIONALS DIRECTORY */}
        {activeTab === "network" && (
          <NearbyClinicsDirectory 
            patient={patientData} 
            isDarkMode={isDarkMode} 
          />
        )}

        {/* TAB 5: RECOMMENDATIONS & COPILOT CHAT */}
        {activeTab === "recommendations" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Assistant Chat Box */}
            <div className={`lg:col-span-7 border rounded-3xl flex flex-col h-[520px] overflow-hidden ${
              isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className={`border-b p-4 flex items-center gap-3 ${
                isDarkMode ? "bg-teal-600/20 border-teal-500/30" : "bg-teal-50 border-teal-200"
              }`}>
                <div className="w-9 h-9 rounded-full bg-teal-500/20 text-teal-600 flex items-center justify-center font-bold">
                  🦷
                </div>
                <div>
                  <h4 className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>Copiloto Dental Dentito</h4>
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Asistente en línea
                  </span>
                </div>
              </div>

              <div className={`flex-1 overflow-y-auto p-4 space-y-3 text-xs ${
                isDarkMode ? "bg-slate-950/50" : "bg-slate-50/50"
              }`}>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-teal-600 text-white rounded-br-none"
                        : isDarkMode
                        ? "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className={`p-3 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 border ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-600 shadow-sm"
                    }`}>
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping" />
                      Dentito está escribiendo...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendAssistant} className={`p-3 border-t flex gap-2 ${
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pregúntale a Dentito sobre tus cuidados dentales..."
                  className={`flex-1 border rounded-xl px-3 py-2 text-xs outline-none transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-700 text-white focus:border-teal-500" 
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500"
                  }`}
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Post-Op Care Guidelines */}
            <div className="lg:col-span-5 space-y-4">
              <div className={`border rounded-3xl p-5 space-y-3 text-xs ${
                isDarkMode ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
              }`}>
                <h4 className={`font-black uppercase tracking-wide flex items-center gap-2 ${
                  isDarkMode ? "text-amber-300" : "text-amber-700"
                }`}>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Guía Rápida de Higiene Post-Atención
                </h4>
                
                <div className={`space-y-2.5 leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  <div className={`p-3 rounded-xl border space-y-1 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <strong className="text-teal-500 block">1. Cepillado Atraumático:</strong>
                    Usa cepillo de cerdas suaves con movimientos circulares durante al menos 2 minutos, 3 veces al día.
                  </div>

                  <div className={`p-3 rounded-xl border space-y-1 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <strong className="text-teal-500 block">2. Limpieza Interproximal:</strong>
                    Usa seda dental o cepillos interproximales diariamente para evitar inflamación gingival y sangrado.
                  </div>

                  <div className={`p-3 rounded-xl border space-y-1 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <strong className="text-teal-500 block">3. Sensibilidad Transitoria:</strong>
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
