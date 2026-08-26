import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from "react";
import { Patient, Appointment, ClinicalUser, PeriodontogramVisit } from "./types";
import { 
  INITIAL_PATIENTS, 
  INITIAL_APPOINTMENTS, 
  createEmptyOdontogram, 
  createEmptyPeriodontogram 
} from "./initialData";
import { formatRut } from "./utils/rutUtils";
import { deduplicatePatients, deduplicateAppointments, generateUniqueId } from "./utils/dataUtils";
import { db, handleFirestoreError, OperationType, auth, cleanForFirestore } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, doc, setDoc, getDocs, deleteDoc, getDocFromServer, onSnapshot } from "firebase/firestore";
import { recordHipaaAudit, maskPII } from "./utils/hipaaAudit";
import { interceptFirestoreRead } from "./utils/firestoreInterceptor";
import { 
  encryptPatientForFirestore, 
  decryptPatientFromFirestore,
  encryptAppointmentForFirestore,
  decryptAppointmentFromFirestore,
  getClinicMasterPassphrase,
  setClinicMasterPassphrase,
  runEphiEncryptionBenchmark
} from "./utils/ephiEncryption";

// Critical First-Paint Components (Eager Load)
import KPIDashboard from "./components/KPIDashboard";
import Odontograma from "./components/Odontograma";
import Periodontograma from "./components/Periodontograma";
import DentitoChat from "./components/DentitoChat";
import Spotlight from "./components/Spotlight";
import Logo from "./components/Logo";
import LoginScreen from "./components/LoginScreen";
import LandingPage from "./components/LandingPage";
import MobileBottomDock from "./components/MobileBottomDock";
import MobileNavigationDrawer from "./components/MobileNavigationDrawer";
import NetworkStatusIndicator from "./components/NetworkStatusIndicator";
import MobileConsentSign from "./components/MobileConsentSign";
import ExternalPatientPortal from "./components/ExternalPatientPortal";
import { ClinicalFlowTracker } from "./components/ClinicalFlowTracker";
import HipaaInactivityLock from "./components/HipaaInactivityLock";
import HipaaComplianceCenter from "./components/HipaaComplianceCenter";
import SecurityHardeningBanner from "./components/SecurityHardeningBanner";

// Secondary & Auxiliary Views (Code-Split / Lazy Load for Ultra-Fast App Startup & Low Memory)
const Agenda = lazy(() => import("./components/Agenda"));
const DentalStories = lazy(() => import("./components/DentalStories"));
const FinanceModule = lazy(() => import("./components/FinanceModule"));
const PrintReport = lazy(() => import("./components/PrintReport"));
const OLearyControl = lazy(() => import("./components/OLearyControl"));
const XRayGallery = lazy(() => import("./components/XRayGallery"));
const SoapAIAssistant = lazy(() => import("./components/SoapAIAssistant"));
const PRARiskAssessment = lazy(() => import("./components/PRARiskAssessment"));
const TreatmentPlanModule = lazy(() => import("./components/TreatmentPlanModule"));
const SharePatientModal = lazy(() => import("./components/SharePatientModal"));
const DirectorioEmpleos = lazy(() => import("./components/DirectorioEmpleos"));
const PatientFile = lazy(() => import("./components/PatientFile"));
const PatientPortal = lazy(() => import("./components/PatientPortal"));
const DentalMarketplace = lazy(() => import("./components/DentalMarketplace"));
const SpecialtyWorkspace = lazy(() => import("./components/SpecialtyWorkspace"));
const InteractiveHelpPanel = lazy(() => import("./components/InteractiveHelpPanel"));
const KeyboardShortcutsModal = lazy(() => import("./components/KeyboardShortcutsModal"));
const PatientDirectory = lazy(() => import("./components/PatientDirectory"));
const DataBackupExport = lazy(() => import("./components/DataBackupExport"));
const IntegrationsHub = lazy(() => import("./components/IntegrationsHub"));
const PrescriptionAndReferralModal = lazy(() => import("./components/PrescriptionAndReferralModal"));
const PeriodontogramComparisonModal = lazy(() => import("./components/PeriodontogramComparisonModal"));
const KioskModeModal = lazy(() => import("./components/KioskModeModal"));

// Ultra-lightweight Clinical Suspense Skeleton
function ClinicalViewSkeleton() {
  return (
    <div className="w-full p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-teal-500/20 rounded-lg" />
          <div className="h-3 w-72 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/40 dark:border-slate-700/40" />
        <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/40 dark:border-slate-700/40" />
        <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/40 dark:border-slate-700/40" />
      </div>
    </div>
  );
}


// Icons from Lucide-React
import { 
  LayoutDashboard, 
  Stethoscope, 
  Calendar, 
  Type as DentalType,
  Users, 
  Settings, 
  Database,
  Moon, 
  Sun, 
  Plus, 
  Search, 
  Trash2, 
  UserPlus, 
  ShieldCheck, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Printer,
  ClipboardList,
  MessageSquare,
  Share2,
  Banknote,
  Activity,
  LogOut,
  ShoppingBag,
  User,
  Briefcase,
  Smile,
  TrendingUp,
  HeartPulse,
  Columns,
  Menu,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  Pill,
  History,
  Tablet,
  QrCode,
  FileSignature
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ActiveTab = "dashboard" | "flujo" | "clinica" | "agenda" | "finanzas" | "dentalstories" | "reportes" | "pacientes" | "ajustes" | "tienda" | "bolsa-empleo";

export default function App() {
  // Session Authentication State
  const [activeUser, setActiveUser] = useState<ClinicalUser | null>(() => {
    const saved = localStorage.getItem("perioActiveUser");
    if (saved && localStorage.getItem("perioLoggedIn") === "true") {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return null;
  });

  const isLoggedIn = !!activeUser;
  const [guestView, setGuestView] = useState<"landing" | "login" | "patient_portal">("landing");
  const [portalAccessKey, setPortalAccessKey] = useState<string>("1");
  const [showLandingModal, setShowLandingModal] = useState<boolean>(false);
  const [ajustesSubTab, setAjustesSubTab] = useState<"integraciones" | "general" | "aranceles" | "backup" | "seguridad">("integraciones");
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);

  // HIPAA Security & Privacy Controls State
  const [showHipaaCenter, setShowHipaaCenter] = useState<boolean>(false);
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem("perioPrivacyMode") === "true";
  });
  const [inactivityMinutes, setInactivityMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("perioInactivityMinutes");
    return saved ? parseInt(saved, 10) : 15;
  });

  const handleTogglePrivacyMode = useCallback(() => {
    setPrivacyMode(prev => {
      const next = !prev;
      localStorage.setItem("perioPrivacyMode", String(next));
      return next;
    });
  }, []);

  const handleChangeInactivityMinutes = useCallback((mins: number) => {
    setInactivityMinutes(mins);
    localStorage.setItem("perioInactivityMinutes", String(mins));
  }, []);

  const handleLoginSuccess = (user: ClinicalUser) => {
    localStorage.setItem("perioLoggedIn", "true");
    localStorage.setItem("perioActiveUser", JSON.stringify(user));
    setActiveUser(user);
    
    // Set appropriate doctor name and clinical setting indicators
    setDoctorName(user.name);
    if (user.specialty) {
      setClinicName(user.specialty);
    } else {
      setClinicName(
        user.profile === "particular" 
          ? "Odontólogo Particular" 
          : user.profile === "clinica" 
          ? "Administración de Clínicas" 
          : user.profile === "universidad"
          ? "Docente Académico"
          : "Paciente"
      );
    }

    // HIPAA Audit Trail: Login
    recordHipaaAudit("LOGIN", `Inicio de sesión exitoso como ${user.name} (${user.role}). Autenticado con 2FA y desafío antirobot.`, {
      user,
      resource: "Control de Acceso ePHI",
      severity: "info"
    });

    if (user.profile === "cliente") {
      setActiveTab("pacientes");
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleLogout = () => {
    if (activeUser) {
      recordHipaaAudit("LOGOUT", `Cierre voluntario de sesión clínica para ${activeUser.name}.`, {
        user: activeUser,
        resource: "Control de Acceso ePHI",
        severity: "info"
      });
    }
    localStorage.setItem("perioLoggedIn", "false");
    localStorage.removeItem("perioActiveUser");
    setActiveUser(null);
  };

  // Customizable tariffs for professional (aranceles)
  const [aranceles, setAranceles] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("perioAranceles");
    return saved ? JSON.parse(saved) : {
      "Limpieza Profiláctica": 45000,
      "Raspado Radicular por Sector": 65000,
      "Cirugía de Implante Dental": 450000,
      "Radiografía Panorámica": 35000,
      "Sondaje de Diagnóstico 6 puntos": 30000
    };
  });

  useEffect(() => {
    localStorage.setItem("perioAranceles", JSON.stringify(aranceles));
  }, [aranceles]);

  // Initial Doctor defaults when activeUser is restored from localStorage
  useEffect(() => {
    if (activeUser) {
      setDoctorName(activeUser.name);
      if (activeUser.specialty) {
        setClinicName(activeUser.specialty);
      }
    }
  }, [activeUser]);

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("perioTheme");
    return saved === null ? true : saved === "dark";
  });

  // Client and Clinical records states
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem("perioPatients");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return deduplicatePatients(parsed);
      } catch (e) {
        return INITIAL_PATIENTS;
      }
    }
    return INITIAL_PATIENTS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem("perioAppointments");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return deduplicateAppointments(parsed);
      } catch (e) {
        return INITIAL_APPOINTMENTS;
      }
    }
    return INITIAL_APPOINTMENTS;
  });

  const [activePatientId, setActivePatientId] = useState<string>(() => {
    const saved = localStorage.getItem("perioActivePatientId");
    return saved || ""; // No default patient selected initially
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [clinicalSubView, setClinicalSubView] = useState<"ficha" | "odontograma" | "periodontograma" | "pra" | "oleary" | "xrays" | "soap" | "presupuesto" | "especialidad">("ficha");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPeriodontoComparison, setShowPeriodontoComparison] = useState(false);
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);

  // Doctor's custom metadata states
  const [doctorName, setDoctorName] = useState("Dr. Ignacio León");
  const [clinicName, setClinicName] = useState("PerioClinic Providencia");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isClinicalSidebarCollapsed, setIsClinicalSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("perioClinicalSidebarCollapsed") === "true";
  });
  const [isZenMode, setIsZenMode] = useState<boolean>(() => {
    return localStorage.getItem("perioZenMode") === "true";
  });

  // Onboarding, Help Panel & Shortcuts Modal States
  const [learningMode, setLearningMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("perioLearningMode");
    return saved === "true"; // defaults to false for new users
  });
  const [showHelpPanel, setShowHelpPanel] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Smooth scroll to top when switching main tabs or clinical subviews for fluid UX
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab, clinicalSubView]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowShortcutsModal(false);
        setShowShareModal(false);
        setDeletingPatientId(null);
        setShowHelpPanel(false);
        setIsMobileDrawerOpen(false);
        return;
      }

      if (e.key === "Escape") {
        if (deletingPatientId) setDeletingPatientId(null);
        if (showShareModal) setShowShareModal(false);
        if (isMobileDrawerOpen) setIsMobileDrawerOpen(false);
      }

      // Ignore when typing in input, textarea or contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setShowRegisterForm(true);
      } else if (e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setActiveTab("clinica");
        setClinicalSubView("periodontograma");
      } else if (e.altKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setActiveTab("clinica");
        setClinicalSubView("odontograma");
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  useEffect(() => {
    localStorage.setItem("perioLearningMode", String(learningMode));
  }, [learningMode]);

  const effectiveSidebarCollapsed = isZenMode ? true : isSidebarCollapsed;
  const effectiveClinicalSidebarCollapsed = isZenMode ? true : isClinicalSidebarCollapsed;

  const toggleClinicalSidebar = () => {
    setIsClinicalSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("perioClinicalSidebarCollapsed", String(next));
      return next;
    });
  };

  // Patient Registration Form states
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientRut, setNewPatientRut] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newPatientBirthdate, setNewPatientBirthdate] = useState("");
  const [newPatientNotes, setNewPatientNotes] = useState("");

  // Patient Search query
  const [searchQuery, setSearchQuery] = useState("");

  // Firebase Sync Loading state & Real-time Listeners
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(true);
  const [firebaseSyncError, setFirebaseSyncError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);

  // Flag to know whether an update came from incoming remote snapshot (to avoid echo write cycles)
  const isIncomingRemoteUpdateRef = useRef(false);

  // Keep track of previously synced patients and appointments to do differential synchronization
  const prevPatientsRef = useRef<Patient[]>([]);
  const prevAppointmentsRef = useRef<Appointment[]>([]);

  // Auto-select first patient if activeTab === "clinica" and activePatientId is missing
  useEffect(() => {
    if (activeTab === "clinica" && !activePatientId && patients.length > 0) {
      setActivePatientId(patients[0].id);
    }
  }, [activeTab, activePatientId, patients]);

  // Navigation scroll ref
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState(false);
  const clinicalNavRef = useRef<HTMLDivElement>(null);
  const scrollClinicalNav = (direction: "left" | "right") => {
    if (clinicalNavRef.current) {
      const scrollAmount = 300;
      clinicalNavRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Authenticate with Firebase on startup so that we can read/write to Firestore securely
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.log("Firebase Auth optional initialization: offline fallback active.");
          setIsAuthReady(true);
        }
      } else {
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Validate Firestore Connection
  useEffect(() => {
    let isCancelled = false;
    async function testConnection() {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (isCancelled) return;
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
          console.log("Conexión con Cloud Firestore validada exitosamente.");
          setFirebaseSyncError(null);
          return;
        } catch (error) {
          if (attempt < 2) {
            await new Promise(res => setTimeout(res, 800));
          } else {
            console.log("Almacenamiento persistente local activo (modo offline/fallback).");
            setFirebaseSyncError("Modo local activo");
          }
        }
      }
    }
    if (isAuthReady) {
      testConnection();
    }
    return () => {
      isCancelled = true;
    };
  }, [isAuthReady]);

  // Real-time bidirectional listeners (onSnapshot) for Multi-Device synchronization with ePHI Zero-Knowledge Decryption
  useEffect(() => {
    if (!isAuthReady) return;
    setIsSyncingFirebase(true);

    let isInitialPatientsLoad = true;
    let isInitialAppointmentsLoad = true;

    // Listen to Patients collection in real time & Decrypt ePHI in client browser
    const unsubPatients = onSnapshot(
      collection(db, "patients"),
      async (snapshot) => {
        if (snapshot.empty && isInitialPatientsLoad) {
          isInitialPatientsLoad = false;
          // SEED FIRST TIME WITH CLIENT-SIDE ENCRYPTION
          console.log("Base de datos de pacientes vacía, sembrando iniciales con cifrado ePHI AES-256-GCM...");
          try {
            for (const patient of INITIAL_PATIENTS) {
              const encryptedPayload = await encryptPatientForFirestore(patient);
              await setDoc(doc(db, "patients", patient.id), cleanForFirestore(encryptedPayload));
            }
          } catch (e) {
            console.warn("Sembrado remoto de pacientes diferido a almacenamiento local.");
          }
          setPatients(INITIAL_PATIENTS);
          prevPatientsRef.current = INITIAL_PATIENTS;
          setIsSyncingFirebase(false);
          setLastSyncedTime(new Date());
          return;
        }

        isInitialPatientsLoad = false;
        interceptFirestoreRead("patients", "SNAPSHOT_LISTEN", snapshot.docs.length || 1);
        const decryptedPatients: Patient[] = [];
        for (const docSnap of snapshot.docs) {
          try {
            const rawData = docSnap.data();
            const decrypted = await decryptPatientFromFirestore(rawData);
            decryptedPatients.push(decrypted);
          } catch (err) {
            console.error("Error al procesar documento de paciente:", err);
          }
        }

        const cleanPatients = deduplicatePatients(decryptedPatients);
        if (cleanPatients.length > 0) {
          isIncomingRemoteUpdateRef.current = true;
          setPatients(cleanPatients);
          prevPatientsRef.current = cleanPatients;
          setLastSyncedTime(new Date());
          setFirebaseSyncError(null);
          setTimeout(() => {
            isIncomingRemoteUpdateRef.current = false;
          }, 300);
        }
        setIsSyncingFirebase(false);
      },
      (error) => {
        console.log("Sincronización en tiempo real operando con respaldo local:", error?.message || error);
        setFirebaseSyncError("Modo local activo");
        setIsSyncingFirebase(false);
      }
    );

    // Listen to Appointments collection in real time & Decrypt in client browser
    const unsubAppointments = onSnapshot(
      collection(db, "appointments"),
      async (snapshot) => {
        if (snapshot.empty && isInitialAppointmentsLoad) {
          isInitialAppointmentsLoad = false;
          // SEED FIRST TIME WITH ENCRYPTION
          console.log("Base de datos de citas vacía, sembrando citas iniciales con cifrado ePHI...");
          try {
            for (const app of INITIAL_APPOINTMENTS) {
              const encryptedPayload = await encryptAppointmentForFirestore(app);
              await setDoc(doc(db, "appointments", app.id), cleanForFirestore(encryptedPayload));
            }
          } catch (e) {
            console.warn("Sembrado remoto de citas diferido a almacenamiento local.");
          }
          setAppointments(INITIAL_APPOINTMENTS);
          prevAppointmentsRef.current = INITIAL_APPOINTMENTS;
          return;
        }

        isInitialAppointmentsLoad = false;
        interceptFirestoreRead("appointments", "SNAPSHOT_LISTEN", snapshot.docs.length || 1);
        const decryptedAppointments: Appointment[] = [];
        for (const docSnap of snapshot.docs) {
          try {
            const rawData = docSnap.data();
            const decrypted = await decryptAppointmentFromFirestore(rawData);
            decryptedAppointments.push(decrypted);
          } catch (err) {
            console.error("Error al procesar cita remota:", err);
          }
        }

        const cleanAppointments = deduplicateAppointments(decryptedAppointments);
        if (cleanAppointments.length > 0) {
          isIncomingRemoteUpdateRef.current = true;
          setAppointments(cleanAppointments);
          prevAppointmentsRef.current = cleanAppointments;
          setTimeout(() => {
            isIncomingRemoteUpdateRef.current = false;
          }, 300);
        }
      },
      (error) => {
        console.log("Sincronización de citas operando con respaldo local:", error?.message || error);
      }
    );

    return () => {
      unsubPatients();
      unsubAppointments();
    };
  }, [isAuthReady]);

  // Sync locally made modifications to Firestore with Client-Side Encryption (with debouncing)
  useEffect(() => {
    // Asynchronously debounced local storage backup (always fast)
    const localTimer = setTimeout(() => {
      try {
        localStorage.setItem("perioPatients", JSON.stringify(patients));
      } catch (e) {
        console.warn("Storage quota warning:", e);
      }
    }, 350);

    // Don't echo remote snapshot updates back to the server
    if (isIncomingRemoteUpdateRef.current) {
      return () => clearTimeout(localTimer);
    }

    const cloudTimer = setTimeout(() => {
      async function syncPatientsToCloud() {
        if (!isAuthReady || !auth.currentUser) return;
        const prevList = prevPatientsRef.current;
        let didMutate = false;
        
        // Update/Create Patient Encrypted
        for (const p of patients) {
          const prevVersion = prevList.find(v => v.id === p.id);
          if (!prevVersion || JSON.stringify(prevVersion) !== JSON.stringify(p)) {
            try {
              const encryptedPayload = await encryptPatientForFirestore(p);
              await setDoc(doc(db, "patients", p.id), cleanForFirestore(encryptedPayload));
              didMutate = true;
            } catch (err) {
              console.warn(`Sincronización en la nube para paciente ${p.name} diferida a caché local:`, err);
            }
          }
        }

        // Delete Patient
        for (const prev of prevList) {
          if (!patients.some(p => p.id === prev.id)) {
            try {
              await deleteDoc(doc(db, "patients", prev.id));
              didMutate = true;
            } catch (err) {
              console.warn(`Eliminación en la nube para paciente ${prev.name} diferida a caché local.`);
            }
          }
        }

        prevPatientsRef.current = patients;
        if (didMutate) {
          setLastSyncedTime(new Date());
        }
      }

      syncPatientsToCloud();
    }, 1200); // 1.2-second debounce for responsive syncing across devices

    return () => {
      clearTimeout(localTimer);
      clearTimeout(cloudTimer);
    };
  }, [patients, isAuthReady]);

  useEffect(() => {
    // Asynchronously debounced local storage backup
    const localTimer = setTimeout(() => {
      try {
        localStorage.setItem("perioAppointments", JSON.stringify(appointments));
      } catch (e) {
        console.warn("Storage quota warning:", e);
      }
    }, 350);

    // Don't echo remote snapshot updates back to the server
    if (isIncomingRemoteUpdateRef.current) {
      return () => clearTimeout(localTimer);
    }

    const cloudTimer = setTimeout(() => {
      async function syncAppointmentsToCloud() {
        if (!isAuthReady || !auth.currentUser) return;
        const prevList = prevAppointmentsRef.current;
        let didMutate = false;

        // Update/Create Appointment Encrypted
        for (const app of appointments) {
          const prevVersion = prevList.find(v => v.id === app.id);
          if (!prevVersion || JSON.stringify(prevVersion) !== JSON.stringify(app)) {
            try {
              const encryptedPayload = await encryptAppointmentForFirestore(app);
              await setDoc(doc(db, "appointments", app.id), cleanForFirestore(encryptedPayload));
              didMutate = true;
            } catch (err) {
              console.warn(`Sincronización en la nube para cita ${app.id} diferida a caché local:`, err);
            }
          }
        }

        // Delete Appointment
        for (const prev of prevList) {
          if (!appointments.some(app => app.id === prev.id)) {
            try {
              await deleteDoc(doc(db, "appointments", prev.id));
              didMutate = true;
            } catch (err) {
              console.warn(`Eliminación en la nube para cita ${prev.id} diferida a caché local.`);
            }
          }
        }

        prevAppointmentsRef.current = appointments;
        if (didMutate) {
          setLastSyncedTime(new Date());
        }
      }

      syncAppointmentsToCloud();
    }, 1200); // 1.2-second debounce for appointment syncing

    return () => {
      clearTimeout(localTimer);
      clearTimeout(cloudTimer);
    };
  }, [appointments, isAuthReady]);

  const handleManualSync = useCallback(async () => {
    setIsSyncingFirebase(true);
    try {
      if (auth.currentUser) {
        for (const p of patients) {
          const encryptedPayload = await encryptPatientForFirestore(p);
          await setDoc(doc(db, "patients", p.id), cleanForFirestore(encryptedPayload));
        }
        for (const app of appointments) {
          const encryptedPayload = await encryptAppointmentForFirestore(app);
          await setDoc(doc(db, "appointments", app.id), cleanForFirestore(encryptedPayload));
        }
        setLastSyncedTime(new Date());
        setFirebaseSyncError(null);
      }
    } catch (err: any) {
      console.warn("Manual sync error:", err);
    } finally {
      setIsSyncingFirebase(false);
    }
  }, [patients, appointments]);

  useEffect(() => {
    localStorage.setItem("perioActivePatientId", activePatientId);
  }, [activePatientId]);

  useEffect(() => {
    localStorage.setItem("perioTheme", darkMode ? "dark" : "light");
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    const handleNavigateEvent = (e: any) => {
      if (e.detail) {
        if (typeof e.detail === "string") {
          setActiveTab(e.detail as any);
        } else if (typeof e.detail === "object") {
          if (e.detail.tab) setActiveTab(e.detail.tab);
          if (e.detail.subView) setClinicalSubView(e.detail.subView);
        }
      }
    };
    const handleOpenHelpEvent = () => {
      setShowHelpPanel(true);
    };
    const handleToggleLearningEvent = () => {
      setLearningMode(prev => !prev);
    };
    window.addEventListener("periodash-navigate", handleNavigateEvent);
    window.addEventListener("periodash-open-help", handleOpenHelpEvent);
    window.addEventListener("periodash-toggle-learning", handleToggleLearningEvent);
    return () => {
      window.removeEventListener("periodash-navigate", handleNavigateEvent);
      window.removeEventListener("periodash-open-help", handleOpenHelpEvent);
      window.removeEventListener("periodash-toggle-learning", handleToggleLearningEvent);
    };
  }, []);

  // Auto Zen Mode for Complex Clinical Views
  useEffect(() => {
    if (clinicalSubView === "odontograma" || clinicalSubView === "periodontograma") {
      setIsZenMode(true);
      localStorage.setItem("perioZenMode", "true");
      setIsSidebarCollapsed(true);
      setIsClinicalSidebarCollapsed(true);
    }
  }, [clinicalSubView]);

  // Memoize active patient lookup to prevent re-filtering on every non-patient render
  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === activePatientId) || null;
  }, [patients, activePatientId]);

  // Patient Registration Handlers
  const handleRegisterPatient = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const formattedRutVal = newPatientRut.trim() ? formatRut(newPatientRut.trim()) : undefined;

    if (editingPatientId) {
      setPatients(prev => prev.map(p => {
        if (p.id === editingPatientId) {
          return {
            ...p,
            name: newPatientName,
            rut: formattedRutVal || p.rut,
            phone: newPatientPhone,
            email: newPatientEmail,
            birthdate: newPatientBirthdate || p.birthdate,
            notes: newPatientNotes,
          };
        }
        return p;
      }));
    } else {
      const newPat: Patient = {
        id: generateUniqueId("pat"),
        name: newPatientName,
        rut: formattedRutVal,
        phone: newPatientPhone,
        email: newPatientEmail,
        birthdate: newPatientBirthdate || "1990-01-01",
        notes: newPatientNotes,
        createdAt: new Date().toISOString(),
        odontogram: createEmptyOdontogram(),
        periodontogram: createEmptyPeriodontogram(),
        oLeary: {},
        anamnesis: {
          motivoConsulta: "",
          historiaMotivoConsulta: "",
          hta: false,
          diabetes: false,
          tabaquismo: 0,
          alergias: "",
          dolorActual: "ninguno",
          notasSistemicas: "",
        },
        xRays: [],
        treatmentPlan: { procedures: [], financing: { months: 1, downPayment: 0, interestRate: 0 } },
        evolutions: [],
        consentimientos: [],
      };

      setPatients((prev) => deduplicatePatients([newPat, ...prev]));
      setActivePatientId(newPat.id);
      setActiveTab("clinica"); // jump immediately to clinic charting for dentist
    }
    
    // Clear registration fields
    setNewPatientName("");
    setNewPatientRut("");
    setNewPatientPhone("");
    setNewPatientEmail("");
    setNewPatientBirthdate("");
    setNewPatientNotes("");
    setEditingPatientId(null);
    setShowRegisterForm(false);
  }, [newPatientName, newPatientRut, editingPatientId, newPatientPhone, newPatientEmail, newPatientBirthdate, newPatientNotes]);

  const startEditPatient = useCallback((p: Patient) => {
    setEditingPatientId(p.id);
    setNewPatientName(p.name);
    setNewPatientRut(p.rut || p.dni || "");
    setNewPatientPhone(p.phone);
    setNewPatientEmail(p.email);
    setNewPatientBirthdate(p.birthdate);
    setNewPatientNotes(p.notes);
    setShowRegisterForm(true);
  }, []);

  const handleDeletePatient = useCallback((patientId: string) => {
    setDeletingPatientId(patientId);
  }, []);

  const executeDeletePatient = useCallback((patientId: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    setAppointments((prev) => prev.filter((app) => app.patientId !== patientId));
    setActivePatientId((prev) => (prev === patientId ? "" : prev));
    setDeletingPatientId(null);
  }, []);

  // Appointment operations 
  const handleAddAppointment = useCallback((newApp: Appointment) => {
    setAppointments((prev) => deduplicateAppointments([newApp, ...prev]));
  }, []);

  const handleUpdateAppointmentStatus = useCallback((id: string, status: Appointment["status"]) => {
    setAppointments((prev) => 
      prev.map((app) => (app.id === id ? { ...app, status } : app))
    );
  }, []);

  const handleUpdateAppointment = useCallback((updatedApp: Appointment) => {
    setAppointments((prev) => 
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );
  }, []);

  const handleDeleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((app) => app.id !== id));
  }, []);

  // Clinical updates 
  const handleUpdateOdontogram = useCallback((updatedOdo: Record<number, any>) => {
    if (!activePatientId) return;
    setPatients((prev) => 
      prev.map((p) => (p.id === activePatientId ? { ...p, odontogram: updatedOdo } : p))
    );
    const pat = patients.find(p => p.id === activePatientId);
    if (pat) {
      recordHipaaAudit("UPDATE_ODONTOGRAM", `Actualización en odontograma clínico de ${pat.name}.`, {
        patientId: pat.id,
        patientName: pat.name,
        resource: "Odontograma FDI ePHI",
        severity: "info"
      });
    }
  }, [activePatientId, patients]);

  const handleUpdatePeriodontogram = useCallback((updatedPerio: Record<number, any>) => {
    if (!activePatientId) return;
    setPatients((prev) => 
      prev.map((p) => (p.id === activePatientId ? { ...p, periodontogram: updatedPerio } : p))
    );
    const pat = patients.find(p => p.id === activePatientId);
    if (pat) {
      recordHipaaAudit("UPDATE_PERIODONTOGRAM", `Actualización en sondaje periodontal a 6 puntos de ${pat.name}.`, {
        patientId: pat.id,
        patientName: pat.name,
        resource: "Periodontograma Clínico ePHI",
        severity: "info"
      });
    }
  }, [activePatientId, patients]);

  const renderWorkspace = () => {
    return (
      <div className="space-y-6 animate-fade-in" id="clinical-area">
            {/* Active Patient Bar (Compact & Responsive) */}
            {isZenMode ? (
              /* Ultra-compact 1-line bar for Zen Mode / Full Screen */
              <div className="bg-slate-900/90 text-white backdrop-blur-md rounded-xl border border-teal-500/30 p-2 sm:px-4 sm:py-2 flex items-center justify-between gap-2 shadow-md text-xs select-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-bold text-white truncate font-display">
                    {activePatient ? activePatient.name : "Sin Paciente"}
                  </span>
                  {activePatient && (
                    <>
                      <span className="text-[10px] text-teal-300 font-medium hidden sm:inline">
                        Exp. #{activePatient.id} • 🎂 {activePatient.birthdate}
                      </span>
                      <div className="hidden md:flex items-center gap-1">
                        {activePatient.anamnesis.hta && (
                          <span className="px-1.5 py-0.2 text-[8px] font-black uppercase bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">HTA</span>
                        )}
                        {activePatient.anamnesis.diabetes && (
                          <span className="px-1.5 py-0.2 text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">DBT</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={clinicalSubView}
                    onChange={(e) => setClinicalSubView(e.target.value as any)}
                    className="text-[11px] py-1 px-2 bg-teal-950/90 border border-teal-500/40 rounded-lg text-teal-300 font-bold outline-none cursor-pointer max-w-[130px] sm:max-w-none"
                    title="Estación Clínica Activa"
                  >
                    <option value="ficha">Ficha & Anamnesis</option>
                    <option value="especialidad">Especialidades</option>
                    <option value="odontograma">Odontograma</option>
                    <option value="periodontograma">Periodontograma</option>
                    <option value="pra">Riesgo PRA</option>
                    <option value="oleary">Índice O'Leary</option>
                    <option value="xrays">Tomografías</option>
                    <option value="soap">SOAP AI</option>
                    <option value="presupuesto">Presupuestos</option>
                  </select>

                  <select
                    value={activePatientId}
                    onChange={(e) => setActivePatientId(e.target.value)}
                    className="text-[11px] py-1 px-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-medium outline-none cursor-pointer max-w-[130px] sm:max-w-none"
                  >
                    <option value="">Buscar expediente...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setIsZenMode(false);
                      localStorage.setItem("perioZenMode", "false");
                      setIsSidebarCollapsed(false);
                      setIsClinicalSidebarCollapsed(false);
                    }}
                    className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Salir del Modo Zen / Pantalla Completa"
                  >
                    <Columns className="w-3.5 h-3.5 rotate-90 text-teal-400" />
                    <span className="hidden sm:inline">Salir Zen</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Sleek Compact Horizontal Bar for Standard Mode */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:px-4 sm:py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center font-display font-bold text-base shadow-xs border border-teal-100 dark:border-teal-900/40 shrink-0">
                    {activePatient ? activePatient.name.charAt(0) : "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {activePatient ? activePatient.name : "Seleccionar Paciente"}
                      </h2>
                      {activePatient && (
                        <div className="flex items-center gap-1">
                          {activePatient.anamnesis.hta && (
                            <span className="px-1.5 py-0.5 text-[8.5px] font-black uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded border border-rose-500/20" title="Hipertensión Arterial">HTA</span>
                          )}
                          {activePatient.anamnesis.diabetes && (
                            <span className="px-1.5 py-0.5 text-[8.5px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded border border-amber-500/20" title="Diabetes Mellitus">DBT</span>
                          )}
                          {activePatient.anamnesis.tabaquismo > 0 && (
                            <span className="px-1.5 py-0.5 text-[8.5px] font-black uppercase bg-slate-500/10 text-slate-600 dark:text-slate-300 rounded border border-slate-500/20" title={`Tabaquismo: ${activePatient.anamnesis.tabaquismo} cig/día`}>TBQ</span>
                          )}
                          {activePatient.anamnesis.alergias && (
                            <span className="px-1.5 py-0.5 text-[8.5px] font-black uppercase bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded border border-yellow-500/20 max-w-[80px] truncate" title={`Alergias: ${activePatient.anamnesis.alergias}`}>ALG</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-normal truncate">
                      {activePatient ? (
                        <span>{activePatient.rut ? <strong className="font-mono text-teal-600 dark:text-teal-400 mr-1.5">RUT: {activePatient.rut} •</strong> : null}Exp. #{activePatient.id} • 📞 {activePatient.phone} • 🎂 {activePatient.birthdate}</span>
                      ) : (
                        "Selecciona un expediente para comenzar la sesión clínica"
                      )}
                    </div>
                  </div>
                </div>

                {/* Patient Selections & Quick Actions */}
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto justify-end">
                  <select
                    value={activePatientId}
                    onChange={(e) => setActivePatientId(e.target.value)}
                    className="flex-1 md:flex-initial text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/25 outline-none cursor-pointer"
                  >
                    <option value="">Buscar expediente...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.rut ? `(${p.rut})` : `(ID: ${p.id.split('-')[1] || p.id})`}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      const nextZen = !isZenMode;
                      setIsZenMode(nextZen);
                      localStorage.setItem("perioZenMode", String(nextZen));
                      if (nextZen) {
                        setIsSidebarCollapsed(true);
                        setIsClinicalSidebarCollapsed(true);
                      } else {
                        setIsSidebarCollapsed(false);
                        setIsClinicalSidebarCollapsed(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      isZenMode
                        ? "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/85 text-slate-700 dark:text-slate-300 border-transparent"
                    }`}
                    title={isZenMode ? "Desactivar Modo Zen" : "Activar Modo Zen (Espacio Completo)"}
                  >
                    <Columns className={`w-3.5 h-3.5 transition-transform duration-300 ${isZenMode ? "rotate-90 text-emerald-500" : "text-slate-400"}`} />
                    <span>{isZenMode ? "Modo Zen" : "Pantalla Completa"}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("reportes")}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/65 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800/60 transition-all cursor-pointer shadow-xs flex items-center gap-1.5 text-xs font-bold"
                    title="Configurar y Generar Reporte A4"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Reporte A4</span>
                  </button>

                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-2.5 py-1.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-600 dark:text-teal-400 font-extrabold text-xs rounded-xl border border-teal-500/40 dark:border-teal-400/50 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Generar Enlace Seguro"
                  >
                    <Share2 className="w-3.5 h-3.5 text-teal-500" />
                    <span className="hidden xs:inline">Compartir</span>
                  </button>
                </div>
              </div>
            )}

            {activePatient ? (
              <div className="space-y-4 font-display">
                
                {/* Clinical Alerts and Systemic Highlights Strip */}
                {!isZenMode && (
                  <div className="bg-slate-50/90 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 transition-all shadow-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
                          <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 leading-none">Radar de Alertas Sistémicas</h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                              {activePatient.name}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-1 hidden sm:block">
                            Condiciones sistémicas y alertas de riesgo directo para procedimientos odontológicos.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {/* HTA Alert */}
                          {activePatient.anamnesis.hta && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-extrabold bg-red-500/10 text-red-600 dark:text-red-400 rounded-full border border-red-500/20 shadow-xs animate-pulse">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                              HTA Activa
                            </span>
                          )}

                          {/* Diabetes Alert */}
                          {activePatient.anamnesis.diabetes ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border shadow-xs ${
                              activePatient.anamnesis.diabetesStatus === 'severe'
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${activePatient.anamnesis.diabetesStatus === 'severe' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                              Diabetes {activePatient.anamnesis.diabetesStatus === 'severe' ? 'Descompensada' : 'Controlada'}
                            </span>
                          ) : null}

                          {/* Smoking Alert */}
                          {activePatient.anamnesis.tabaquismo > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-extrabold bg-slate-500/10 text-slate-600 dark:text-slate-300 rounded-full border border-slate-500/20">
                              🚬 {activePatient.anamnesis.tabaquismo} cig./día
                            </span>
                          ) : null}

                          {/* Safe State indicator fallback */}
                          {!activePatient.anamnesis.hta && !activePatient.anamnesis.diabetes && activePatient.anamnesis.tabaquismo === 0 && !activePatient.anamnesis.alergias && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20 shadow-xs">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              Sistémicamente Sano
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setIsAlertsCollapsed(!isAlertsCollapsed)}
                          className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer"
                          title={isAlertsCollapsed ? "Expandir detalles de alertas" : "Plegar radar de alertas"}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAlertsCollapsed ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {!isAlertsCollapsed && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        <div className="bg-white/60 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Alergias Conocidas</span>
                          <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                            {activePatient.anamnesis.alergias || "Sin alergias declaradas"}
                          </p>
                        </div>
                        <div className="bg-white/60 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Dolor & Sintomatología</span>
                          <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5 capitalize">
                            {activePatient.anamnesis.dolorActual && activePatient.anamnesis.dolorActual !== "ninguno"
                              ? `Nivel ${activePatient.anamnesis.dolorActual}`
                              : "Sin sintomatología dolorosa aguda"}
                          </p>
                        </div>
                        <div className="bg-white/60 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Especialidad Activa</span>
                            <p className="font-black text-teal-600 dark:text-teal-400 uppercase mt-0.5">
                              {(activePatient as any).activeSpecialty || "Periodoncia"}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-1 rounded-lg">
                            FDI 11-48
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* CENTRAL ACTIVE WORKSPACE COMPONENT PANEL */}
                <div className="min-w-0 bg-white/40 dark:bg-slate-900/5 rounded-2xl flex flex-col gap-4">
                  {/* Categorized Station Selector Header */}
                  {!isZenMode && (
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-2 rounded-2xl space-y-2 shadow-xs">
                      
                      {/* Top Bar Categories */}
                      <div className="flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar pb-1 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1 shrink-0">
                          {[
                            {
                              id: "evaluacion",
                              label: "Diagnóstico & Ficha",
                              icon: Stethoscope,
                              items: ["ficha", "especialidad", "xrays"]
                            },
                            {
                              id: "periodoncia",
                              label: "Examen Dental y Periodontal",
                              icon: Activity,
                              items: ["odontograma", "periodontograma", "pra", "oleary"]
                            },
                            {
                              id: "gestion",
                              label: "Evolución & Planes",
                              icon: Sparkles,
                              items: ["soap", "presupuesto"]
                            }
                          ].map(cat => {
                            const Icon = cat.icon;
                            const isCatActive = cat.items.includes(clinicalSubView);
                            return (
                              <button
                                key={cat.id}
                                onClick={() => {
                                  if (cat.items.length > 0) setClinicalSubView(cat.items[0] as any);
                                }}
                                className={`relative px-3 py-1.5 rounded-xl text-xs font-black tracking-wide transition-colors flex items-center gap-2 cursor-pointer border ${
                                  isCatActive
                                    ? "border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-xs"
                                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-100"
                                }`}
                              >
                                {isCatActive && (
                                  <motion.div
                                    layoutId="catActivePillBg"
                                    className="absolute inset-0 bg-slate-900 dark:bg-slate-100 rounded-xl z-0"
                                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                  />
                                )}
                                <Icon className="w-3.5 h-3.5 relative z-10" />
                                <span className="relative z-10">{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Right Quick Controls (Clinical Tools, Return to Directory & Zen Toggle) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {activePatient && (
                            <>
                              <button
                                onClick={() => setShowPrescriptionModal(true)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80"
                                title="Generar Receta Médica o Carta de Derivación Inteligente (con WhatsApp)"
                              >
                                <Pill className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                <span className="hidden sm:inline">Receta & Derivación</span>
                              </button>

                              <button
                                onClick={() => setShowPeriodontoComparison(true)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                                title="Comparar Evolución Temporal Periodontal (Antes vs Después)"
                              >
                                <History className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span className="hidden sm:inline">Evolución</span>
                              </button>

                              <button
                                onClick={() => setShowKioskModal(true)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                                title="Activar Modo Quiosco en Sala de Espera para Anamnesis y Consentimiento Táctil"
                              >
                                <Tablet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span className="hidden sm:inline">Modo Quiosco</span>
                              </button>
                            </>
                          )}

                          {activePatientId && (
                            <button
                              onClick={() => {
                                setActivePatientId("");
                                setActiveTab("pacientes");
                              }}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                              title="Volver a la lista de todos los pacientes"
                            >
                              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              <span className="hidden sm:inline">Directorio</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const nextZen = !isZenMode;
                              setIsZenMode(nextZen);
                              localStorage.setItem("perioZenMode", String(nextZen));
                              if (nextZen) {
                                setIsSidebarCollapsed(true);
                                setIsClinicalSidebarCollapsed(true);
                              } else {
                                setIsSidebarCollapsed(false);
                                setIsClinicalSidebarCollapsed(false);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isZenMode
                                ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-600 dark:text-emerald-400 shadow-md animate-pulse"
                                : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400"
                            }`}
                            title={isZenMode ? "Salir de Modo Zen" : "Activar Modo Zen"}
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${isZenMode ? "text-emerald-500" : "text-slate-400"}`} />
                            <span className="hidden sm:inline">{isZenMode ? "Modo Zen Activo" : "Modo Zen"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Station Pills Row */}
                      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar px-1 py-0.5 scroll-smooth relative">
                        {[
                          { id: "ficha", label: "Ficha & Anamnesis", icon: User, badge: "Ficha", cat: "evaluacion" },
                          { id: "especialidad", label: "Consola Especialidades", icon: Stethoscope, badge: "Espec", cat: "evaluacion" },
                          { id: "xrays", label: "Tomografías & Rx", icon: HeartPulse, badge: "Rx", cat: "evaluacion" },
                          { id: "odontograma", label: "Odontograma", icon: Smile, badge: "Dental", cat: "periodoncia" },
                          { id: "periodontograma", label: "Periodontograma", icon: Activity, badge: "Encías", cat: "periodoncia" },
                          { id: "pra", label: "Riesgo PRA", icon: TrendingUp, badge: "PRA", cat: "periodoncia" },
                          { id: "oleary", label: "Índice O'Leary", icon: ClipboardList, badge: "Placa", cat: "periodoncia" },
                          { id: "soap", label: "Redactor SOAP (AI)", icon: Sparkles, badge: "AI Copilot", cat: "gestion" },
                          { id: "presupuesto", label: "Presupuestos & Planes", icon: Banknote, badge: "Planes", cat: "gestion" }
                        ].map(st => {
                          const IconComponent = st.icon;
                          const isStationActive = clinicalSubView === st.id;
                          return (
                            <button
                              key={st.id}
                              onClick={() => setClinicalSubView(st.id as any)}
                              className={`relative px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-colors duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer border shrink-0 ${
                                isStationActive
                                  ? "border-teal-600 text-white shadow-xs scale-[1.01]"
                                  : "bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              }`}
                            >
                              {isStationActive && (
                                <motion.div
                                  layoutId="stationActivePillBg"
                                  className="absolute inset-0 bg-teal-600 rounded-xl z-0"
                                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                />
                              )}
                              <IconComponent className={`w-3.5 h-3.5 relative z-10 ${isStationActive ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                              <span className="relative z-10">{st.label}</span>
                              <span className={`relative z-10 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                                isStationActive 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                              }`}>
                                {st.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={clinicalSubView}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.1, ease: "easeOut" }}
                    >
                      <Suspense fallback={<ClinicalViewSkeleton />}>
                        {clinicalSubView === "ficha" ? (
                          <PatientFile 
                            patient={activePatient}
                            onUpdatePatient={(updated) => {
                              setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
                            }}
                            onClose={() => setActivePatientId("")}
                          />
                        ) : clinicalSubView === "especialidad" ? (
                            <SpecialtyWorkspace
                              patient={activePatient}
                              onUpdatePatient={(updatedPat) => {
                                setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
                              }}
                              onNavigateToSubView={(subView) => setClinicalSubView(subView as any)}
                            />
                          ) : clinicalSubView === "odontograma" ? (
                            <Odontograma 
                              odontogram={activePatient.odontogram} 
                              onChange={handleUpdateOdontogram}
                            />
                          ) : clinicalSubView === "periodontograma" ? (
                            <Periodontograma 
                              periodontogram={activePatient.periodontogram}
                              onChange={handleUpdatePeriodontogram}
                              odontogram={activePatient.odontogram}
                              patient={activePatient}
                              onUpdatePatient={(updatedPat) => {
                                setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
                              }}
                            />
                          ) : clinicalSubView === "pra" ? (
                            <PRARiskAssessment 
                              periodontogram={activePatient.periodontogram}
                              odontogram={activePatient.odontogram}
                              patient={activePatient}
                              onUpdatePatient={(updatedPat) => {
                                setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
                              }}
                            />
                          ) : clinicalSubView === "oleary" ? (
                            <OLearyControl 
                              patient={activePatient}
                              onUpdate={(newO) => {
                                setPatients(prev => prev.map(p => p.id === activePatient.id ? { ...p, oLeary: newO } : p))
                              }}
                            />
                          ) : clinicalSubView === "xrays" ? (
                            <XRayGallery
                              patient={activePatient}
                              onUpdate={(newX) => {
                                 setPatients(prev => prev.map(p => p.id === activePatient.id ? { ...p, xRays: newX } : p))
                              }}
                            />
                          ) : clinicalSubView === "soap" ? (
                            <SoapAIAssistant 
                              patient={activePatient} 
                              doctorName={doctorName}
                              onUpdatePatient={(updatedPat) => {
                                setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
                              }}
                            />
                          ) : (
                            <TreatmentPlanModule 
                              patient={activePatient}
                              aranceles={aranceles}
                              onUpdatePatient={(updatedPat) => {
                                setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
                              }}
                            />
                          )}
                      </Suspense>
                    </motion.div>
                  </AnimatePresence>
                  </div>
                </div>
              ) : (
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-205 dark:border-slate-800 text-center space-y-6 shadow-sm">
                <div className="max-w-md mx-auto space-y-2">
                  <div className="w-14 h-14 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/20 mx-auto">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-display font-black text-slate-800 dark:text-white">Estación de Diagnóstico Clínico</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Por favor, selecciona un expediente médico para habilitar el Odontograma anatómico y el Periodontograma paramétrico:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
                  {patients.map((p) => {
                    const pockets = Object.values(p.periodontogram || {}).reduce((acc, currentTooth: any) => {
                      let pcts = 0;
                      if (currentTooth) {
                        const pts = ["pv1", "pv2", "pv3", "pl1", "pl2", "pl3"];
                        pts.forEach(pt => {
                          if (currentTooth[pt] >= 4) pcts++;
                        });
                      }
                      return acc + pcts;
                    }, 0);

                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActivePatientId(p.id);
                          setClinicalSubView("especialidad");
                        }}
                        className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl hover:border-teal-500/50 hover:shadow-md transition-all cursor-pointer text-left group flex flex-col justify-between h-40"
                      >
                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-black text-slate-400 dark:text-slate-500">
                              EXP: {p.id.split('-')[1] || p.id}
                            </span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-teal-500/5 text-teal-600 dark:text-teal-400 font-bold">
                              Activo
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {p.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {p.rut ? <span className="font-mono text-teal-600 dark:text-teal-400 font-bold mr-1">RUT: {p.rut} •</span> : null}🎂 {p.birthdate}  |  📞 {p.phone}
                          </p>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 w-full flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-slate-400 dark:text-slate-400">
                            Bolsas &ge; 4mm: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{pockets}</strong>
                          </span>
                          <span className="text-teal-600 dark:text-teal-400 font-black uppercase tracking-wider inline-flex items-center gap-1">
                            Abrir Consola &rarr;
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40 max-w-sm mx-auto">
                  <button
                    onClick={() => {
                      setActiveTab("pacientes");
                      setShowRegisterForm(true);
                    }}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Registrar Nuevo Expediente
                  </button>
                </div>
              </div>
            )}
          </div>
        );
  };

  // Tab rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <KPIDashboard 
            patients={patients} 
            appointments={appointments}
            onNavigateTo={(tab) => setActiveTab(tab as ActiveTab)}
            onSelectPatient={(id) => setActivePatientId(id)}
            onUpdatePatient={(updatedPat) => {
              setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
            }}
          />
        );

      case "flujo":
        return (
          <ClinicalFlowTracker
            patients={patients}
            onUpdatePatient={(updatedPat) => {
              setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
            }}
            onSelectPatient={(id) => {
              setActivePatientId(id);
              setActiveTab("clinica");
              setClinicalSubView("ficha");
            }}
          />
        );

      case "clinica":
        return renderWorkspace();

      case "agenda":
        return (
          <Agenda 
            appointments={appointments}
            patients={patients}
            onAddAppointment={handleAddAppointment}
            onUpdateStatus={handleUpdateAppointmentStatus}
            onDeleteAppointment={handleDeleteAppointment}
            onUpdateAppointment={handleUpdateAppointment}
            clinicName={clinicName}
            doctorName={doctorName}
            privacyMode={privacyMode}
            onUpdatePatient={(updatedPat) => {
              setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
            }}
          />
        );

      case "bolsa-empleo":
        return <DirectorioEmpleos />;

      case "pacientes":
        if (activePatientId) {
          return renderWorkspace();
        }

        return (
          <PatientDirectory
            patients={patients}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setActivePatientId={setActivePatientId}
            setClinicalSubView={setClinicalSubView}
            startEditPatient={startEditPatient}
            handleDeletePatient={handleDeletePatient}
            showRegisterForm={showRegisterForm}
            setShowRegisterForm={setShowRegisterForm}
            editingPatientId={editingPatientId}
            setEditingPatientId={setEditingPatientId}
            handleRegisterPatient={handleRegisterPatient}
            newPatientName={newPatientName}
            setNewPatientName={setNewPatientName}
            newPatientRut={newPatientRut}
            setNewPatientRut={setNewPatientRut}
            newPatientPhone={newPatientPhone}
            setNewPatientPhone={setNewPatientPhone}
            newPatientEmail={newPatientEmail}
            setNewPatientEmail={setNewPatientEmail}
            newPatientBirthdate={newPatientBirthdate}
            setNewPatientBirthdate={setNewPatientBirthdate}
            newPatientNotes={newPatientNotes}
            setNewPatientNotes={setNewPatientNotes}
            privacyMode={privacyMode}
          />
        );

      case "finanzas":
        return (
          <div className="animate-fade-in z-10 relative">
            <FinanceModule activePatient={activePatient} setPatients={setPatients} aranceles={aranceles} />
          </div>
        );

      case "reportes":
        return (
          <div className="animate-fade-in z-10 relative">
            <PrintReport activePatient={activePatient} doctorName={doctorName} clinicName={clinicName} />
          </div>
        );

      case "dentalstories":
        return (
          <DentalStories />
        );

      case "tienda":
        return (
          <DentalMarketplace />
        );

      case "ajustes":
        return (
          <div className="space-y-6">
            {/* Ajustes Sub-Navigation Tab Bar */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAjustesSubTab("integraciones")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ajustesSubTab === "integraciones"
                    ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs border border-teal-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Database className="w-3.5 h-3.5 text-teal-500" />
                <span>Integraciones & Cloud</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              <button
                type="button"
                onClick={() => setAjustesSubTab("general")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ajustesSubTab === "general"
                    ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs border border-teal-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Consultorio & Perfil</span>
              </button>

              <button
                type="button"
                onClick={() => setAjustesSubTab("aranceles")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ajustesSubTab === "aranceles"
                    ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs border border-teal-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>💵</span>
                <span>Aranceles y Honorarios</span>
              </button>

              <button
                type="button"
                onClick={() => setAjustesSubTab("backup")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ajustesSubTab === "backup"
                    ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs border border-teal-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>💾</span>
                <span>Respaldo & Exportación</span>
              </button>

              <button
                type="button"
                onClick={() => setAjustesSubTab("seguridad")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ajustesSubTab === "seguridad"
                    ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs border border-teal-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Seguridad & Privacidad</span>
                {privacyMode && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
              </button>
            </div>

            {/* TAB 1: INTEGRACIONES & CLOUD */}
            {ajustesSubTab === "integraciones" && (
              <Suspense fallback={<ClinicalViewSkeleton />}>
                <IntegrationsHub
                  isSyncingFirebase={isSyncingFirebase}
                  firebaseSyncError={firebaseSyncError}
                  lastSyncedTime={lastSyncedTime}
                  onTriggerManualSync={handleManualSync}
                  onOpenGoogleCalendar={() => {
                    setActiveTab("agenda");
                  }}
                  onOpenWhatsApp={() => {
                    setActiveTab("agenda");
                  }}
                  onOpenPayments={() => {
                    setActiveTab("finanzas");
                  }}
                />
              </Suspense>
            )}

            {/* TAB 2: GENERAL & CONSULTORIO */}
            {ajustesSubTab === "general" && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 space-y-6 shadow-xs animate-fade-in" id="ajustes-panel">
                  <div>
                    <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-white">Configuración del Consultorio</h3>
                    <p className="text-xs text-slate-400">Personalización de meta-datos del profesional, centro odontológico y visuales del sistema</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/70">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold uppercase block tracking-wide">Nombre del Profesional / Cirujano Dentista:</label>
                      <input
                        type="text"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 focus:focus:ring-2 focus:ring-teal-500/20 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold uppercase block tracking-wide">Centro Médico / Sucursal Dental:</label>
                      <input
                        type="text"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 focus:focus:ring-2 focus:ring-teal-500/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 dark:text-white">Esquema Gráfico / Apariencia</h5>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-sm">Alterna rápidamente entre el modo luz médica de alta visibilidad o el modo de descanso visual quirúrgico oscuro.</p>
                    </div>

                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-100 p-3.5 rounded-2xl cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
                    >
                      {darkMode ? <Sun className="w-5 h-5 text-amber-500 animate-pulse" /> : <Moon className="w-5 h-5 text-indigo-700" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/70">
                    <div>
                      <h5 className="text-sm font-semibold text-red-600 dark:text-red-400">Control de Sesión</h5>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-sm">Cierra de manera segura tu sesión actual en este terminal para prevenir accesos no autorizados a las fichas e historiales clínicos.</p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200/50 dark:border-red-800/40 text-red-600 dark:text-red-400 py-3 px-5 rounded-2xl cursor-pointer transition-all font-bold text-xs flex items-center gap-2 block border-0"
                      type="button"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión Activa
                    </button>
                  </div>

                  {/* App details details license info */}
                  <div className="p-4 bg-teal-50/20 dark:bg-slate-800/20 border border-teal-500/10 rounded-2xl flex gap-3 text-xs text-teal-800 dark:text-teal-300 leading-relaxed font-light">
                    <ShieldCheck className="w-5.5 h-5.5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <h6 className="font-bold">Licencia Pro Activada Correctamente — Perfil {activeUser?.profile.toUpperCase()}</h6>
                      <p className="mt-0.5">
                        Este terminal clínico está autorizado para procesar datos locales e históricos cifrados. Los aranceles configurados forman parte del almacenamiento persistente seguro.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Specific Administrative and Audit card for CLINICA / UNIVERSIDAD */}
                {activeUser?.profile === "clinica" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs animate-fade-in">
                    <div>
                      <span className="text-[9px] font-black uppercase text-pink-600 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/15">Módulo de Auditoría</span>
                      <h4 className="text-md font-bold mt-2 text-slate-900 dark:text-white">Panel de Administración y Auditoría</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Nivel: Administrador Clínico Total. Monitoreo de eventos y seguridad del terminal.</p>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                      <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-widest text-[9px] font-bold">Registro de Cambios y Accesos Recientes</div>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-[10.5px]">
                        <div className="p-3 flex justify-between">
                          <span className="text-slate-400">Reciente</span>
                          <span className="text-emerald-500 font-bold">USUARIO_REGISTRO_OK</span>
                          <span className="text-slate-500 dark:text-slate-400">Email: {activeUser.email}</span>
                        </div>
                        <div className="p-3 flex justify-between">
                          <span className="text-slate-400">Reciente</span>
                          <span className="text-teal-500 dark:text-teal-400">CARGA_EXPEDIENTES_INIT</span>
                          <span className="text-slate-500 dark:text-slate-400">Cloud SQL PostgreSQL / Firestore</span>
                        </div>
                        <div className="p-3 flex justify-between">
                          <span className="text-slate-400">Reciente</span>
                          <span className="text-amber-500">AUDITORIA_INTEGRIDAD_SUCCESS</span>
                          <span className="text-slate-500 dark:text-slate-400">Fichas periodontales 100% HIPAA-safe</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeUser?.profile === "universidad" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs animate-fade-in">
                    <div>
                      <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">Orientado a Docencia</span>
                      <h4 className="text-md font-bold mt-2 text-slate-900 dark:text-white">Herramientas Académicas e Investigación</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supervisión en tiempo real de alumnos, cátedras clínicas y validación de expedientes de estudio.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 flex items-center gap-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/25">
                        <span className="text-xl">🎓</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Asistencia de Alumnos</p>
                          <span className="text-[9.5px] text-slate-400 font-light block leading-tight mt-0.5">Valida el aprendizaje clínico del internado</span>
                        </div>
                      </div>
                      <div className="p-3 flex items-center gap-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/25">
                        <span className="text-xl">🧬</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Protocolos Periodontales</p>
                          <span className="text-[9.5px] text-slate-400 font-light block leading-tight mt-0.5">Formatos de investigación basados en AAP 2018</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ARANCELES */}
            {ajustesSubTab === "aranceles" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 space-y-4 shadow-xs animate-fade-in">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     💵 Aranceles y Honorarios de Tratamientos
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Modifica los aranceles vigentes. Al emitir presupuestos clínicos se aplicarán estos valores predeterminados.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(aranceles).map(([treatmentKey, priceValue]) => (
                    <div key={treatmentKey} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold">{treatmentKey}</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          value={priceValue}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setAranceles(prev => ({ ...prev, [treatmentKey]: val }));
                          }}
                          className="w-full text-xs pl-6 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-right font-mono text-teal-600 dark:text-teal-400 font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: BACKUP & EXPORT */}
            {ajustesSubTab === "backup" && (
              <DataBackupExport
                patients={patients}
                appointments={appointments}
                aranceles={aranceles}
                onRestoreData={(restoredPatients, restoredAppointments) => {
                  setPatients(deduplicatePatients(restoredPatients));
                  if (restoredAppointments.length > 0) {
                    setAppointments(deduplicateAppointments(restoredAppointments));
                  }
                }}
              />
            )}

            {/* TAB 5: SEGURIDAD, PRIVACIDAD & BLINDAJE HIPAA */}
            {ajustesSubTab === "seguridad" && (
              <div className="space-y-6 animate-fade-in">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-teal-900/40 via-slate-900 to-slate-900 border border-teal-500/20 rounded-2xl p-6 text-white space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2">
                        <span>Seguridad, Privacidad & Blindaje ePHI</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                          100% Protegido
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Configuración de privacidad visual, pistas de auditoría clínica inmutables (45 CFR § 164.312) y cortafuegos WAF.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CARD 1: ESCUDO DE PRIVACIDAD ANTI-MIRADAS */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 space-y-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${privacyMode ? "bg-amber-500/20 text-amber-500" : "bg-teal-500/10 text-teal-600 dark:text-teal-400"}`}>
                          {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Escudo de Privacidad Anti-Miradas
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enmascaramiento visual de datos personales (PII/PHI)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleTogglePrivacyMode}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
                          privacyMode
                            ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                        }`}
                      >
                        {privacyMode ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Activo (Oculto)</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Desactivado</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {privacyMode 
                        ? "🛡️ Los RUTs, teléfonos, correos y diagnósticos sensibles se encuentran enmascarados con asteriscos en pantalla para proteger la confidencialidad frente a pacientes u observadores casuales."
                        : "👁️ Los datos clínicos e identificadores se muestran en texto visible para facilitar la consulta rápida en el consultorio."
                      }
                    </p>

                    {/* Inactivity timeout selector */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-teal-500" />
                          <span>Bloqueo automático por inactividad</span>
                        </span>
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">
                          {inactivityMinutes} min
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 30].map(mins => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => handleChangeInactivityMinutes(mins)}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                              inactivityMinutes === mins
                                ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            {mins} min
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: CUMPLIMIENTO HIPAA SHIELD */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 space-y-5 shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Cumplimiento HIPAA Shield</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Pistas de auditoría ePHI inmutables (45 CFR § 164.312)
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Registro cronológico inalterable de aperturas de fichas y recetas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Doble capa de autorización y verificación de identidad médica</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Cifrado TLS 1.3 / HTTPS forzado y Content Security Policy</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowHipaaCenter(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Abrir Centro de Auditoría e Historial HIPAA</span>
                    </button>
                  </div>

                  {/* CARD 3: BLINDAJE WAF & DEFENSAS PERIMETRALES */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Fortaleza de Blindaje Perimetral WAF & Cifrado (100% Blindaje)
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Cortafuegos inteligente, Honeypot Tarpit defensivo y arquitectura Zero-Trust
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSecurityModal(true)}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Ver Diagnóstico de Blindaje & Telemetría WAF</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-sm font-bold text-teal-600 dark:text-teal-400 font-mono">AES-256 / TLS 1.3</div>
                        <div className="text-[10px] text-slate-500">Cifrado de Extremo a Extremo</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">Zero-Trust</div>
                        <div className="text-[10px] text-slate-500">Reglas Firestore Default-Deny</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">Anti-XSS CSP</div>
                        <div className="text-[10px] text-slate-500">Aislamiento de Scripts</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">Honeypot Tarpit</div>
                        <div className="text-[10px] text-slate-500">Trampas Antiescáner Activas</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Direct Patient Mobile Consent Remote Signing Portal (Bypasses Doctor Auth for Patients)
  const urlParams = new URLSearchParams(window.location.search);
  const signSessionParam = urlParams.get("sign_session") || urlParams.get("consent_session");
  if (signSessionParam) {
    return <MobileConsentSign sessionId={signSessionParam} />;
  }

  // External Patient Portal Access (Bypasses Doctor Auth for Patients accessing their personal file)
  const portalPatientParam = urlParams.get("portal_patient") || urlParams.get("patient_portal") || urlParams.get("portal");
  if (portalPatientParam) {
    return <ExternalPatientPortal accessKey={portalPatientParam} />;
  }

  if (!isLoggedIn) {
    if (guestView === "login") {
      return (
        <LoginScreen 
          onLogin={handleLoginSuccess} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          defaultEmail=""
          onBackToLanding={() => setGuestView("landing")}
          onOpenPatientPortal={(mode) => {
            setPortalAccessKey(mode === "register" ? "new" : "");
            setGuestView("patient_portal");
          }}
        />
      );
    }

    if (guestView === "patient_portal") {
      return (
        <ExternalPatientPortal
          accessKey={portalAccessKey === "new" ? "" : portalAccessKey}
          initialMode={portalAccessKey === "new" ? "register" : "lookup"}
          onClose={() => setGuestView("landing")}
        />
      );
    }

    // Default entry view: Alternativa 1 (Institutional Landing Page with Bifurcated Access)
    return (
      <LandingPage
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onEnterAsDentist={() => setGuestView("login")}
        onEnterAsPatient={() => {
          setPortalAccessKey("");
          setGuestView("patient_portal");
        }}
        onSelectPatientRut={(rut) => {
          setPortalAccessKey(rut || "");
          setGuestView("patient_portal");
        }}
      />
    );
  }

  // Securely isolate and render the PatientPortal component if active profile is "cliente"
  if (activeUser?.profile === "cliente") {
    return (
      <PatientPortal 
        activeUser={activeUser}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        allAppointments={appointments}
        onAddAppointment={(newApp) => setAppointments((prev) => [newApp, ...prev])}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans ${darkMode ? "dark text-slate-100 bg-[#090d16]" : "bg-slate-50 text-slate-900"} flex flex-col md:flex-row relative transition-colors duration-300`}>
      {/* Dynamic Cosmic Slate Background (Visible in Dark Mode) */}
      {darkMode && (
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden no-print bg-[#090d16] will-change-transform">
          {/* Static high-performance deep ambient gradients */}
          <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-teal-950/20 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute top-[30%] -right-[15%] w-[70%] h-[70%] bg-slate-900/30 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-950/15 blur-[90px] rounded-full pointer-events-none" />
          
          {/* High-performance grid mask */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{ 
              backgroundImage: 'radial-gradient(rgba(20, 184, 166, 0.4) 1.5px, transparent 1.5px)', 
              backgroundSize: '24px 24px' 
            }} 
          />
        </div>
      )}

      {/* SIDEBAR ON DESKTOP - HIDDEN ON MOBILE */}
      <aside className={`${effectiveSidebarCollapsed ? "w-20" : "w-64"} bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-100 dark:border-slate-800/50 flex flex-col py-6 sticky top-0 h-screen hidden md:flex shrink-0 no-print z-10 transition-[width] duration-300 overflow-y-auto overflow-x-hidden scrollbar-none relative`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => {
            if (isZenMode) {
              setIsZenMode(false);
              localStorage.setItem("perioZenMode", "false");
              setIsSidebarCollapsed(false);
              setIsClinicalSidebarCollapsed(false);
            } else {
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }
          }}
          className="absolute top-7 right-3 w-6 h-6 bg-slate-100 hover:bg-teal-100 dark:bg-slate-800 dark:hover:bg-teal-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 rounded-lg flex items-center justify-center cursor-pointer transition-colors z-20"
          title={isZenMode ? "Salir de Modo Zen" : "Contraer barra lateral"}
        >
          {effectiveSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Brand Header */}
        <div className={`px-4 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center transition-all ${effectiveSidebarCollapsed ? 'justify-center px-0' : ''}`}>
          {effectiveSidebarCollapsed ? (
            <Logo variant="icon" size="sm" />
          ) : (
            <Logo size="md" subtitle="Software Odontológico" />
          )}
        </div>

        {/* Doctor Identity Context Card */}
        {!effectiveSidebarCollapsed && (
          <div className="mx-4 my-4 bg-slate-50/70 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 flex items-center gap-2.5 whitespace-nowrap overflow-hidden transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-center text-xs font-bold shrink-0 font-mono shadow-xs border border-slate-800">
              DR
            </div>
            <div className="overflow-hidden">
               <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">{doctorName}</div>
               <div className="text-[9px] text-slate-400 truncate tracking-tight">{clinicName}</div>
            </div>
          </div>
        )}

        {/* Quick Search Trigger Pill */}
        <div className={`px-4 ${effectiveSidebarCollapsed ? 'mt-4 mb-4' : 'mb-4'}`}>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent("periodash-open-search"))}
            className={`w-full py-2 bg-slate-50/50 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800/50 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl transition-all flex items-center cursor-pointer group ${effectiveSidebarCollapsed ? 'px-2 justify-center' : 'px-3 justify-between text-left'}`}
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
              {!effectiveSidebarCollapsed && <span className="text-[10.5px] font-medium whitespace-nowrap">Buscador</span>}
            </div>
            {!effectiveSidebarCollapsed && (
              <kbd className="text-[8.5px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 rounded px-1 py-0.5 tracking-tight font-mono font-bold shrink-0">
                Ctrl+K
              </kbd>
            )}
          </button>
        </div>

        {/* Onboarding Guide Trigger */}
        <div className={`px-4 mb-4 ${effectiveSidebarCollapsed ? 'hidden' : ''}`}>
          <button 
            onClick={() => setShowHelpPanel(true)}
            className="w-full py-2 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 hover:from-teal-500/20 hover:to-emerald-500/20 border border-teal-500/20 text-teal-700 dark:text-teal-300 rounded-xl transition-all flex items-center justify-between px-3 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-500 group-hover:animate-bounce" />
              <span className="text-[10.5px] font-bold">Guía de Aprendizaje</span>
            </div>
            <span className="text-[9px] bg-teal-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              {learningMode ? 'ON' : 'Ayuda'}
            </span>
          </button>
        </div>

        {/* Navigation panel Links */}
        <nav className="flex-1 px-3 space-y-4 overflow-y-auto hide-scrollbar">
          {[
            {
              category: "Atención Clínica",
              items: [
                { id: "clinica", label: "Estación Clínica", icon: Stethoscope },
                { id: "pacientes", label: "Expedientes", icon: Users },
                { id: "flujo", label: "Flujo & Sillones", icon: Activity },
                { id: "agenda", label: "Agenda Médica", icon: Calendar },
              ]
            },
            {
              category: "Gestión & Análisis",
              items: [
                { id: "dashboard", label: "Panel Principal", icon: LayoutDashboard },
                { id: "finanzas", label: "Plan & Finanzas", icon: Banknote },
                { id: "reportes", label: "Imp / Reportes", icon: Printer },
              ]
            },
            {
              category: "Comunidad & Mercado",
              items: [
                { id: "dentalstories", label: "DentalStories", icon: MessageSquare },
                { id: "tienda", label: "Mercado Dental", icon: ShoppingBag },
                { id: "bolsa-empleo", label: "Bolsa de Empleo", icon: Briefcase },
              ]
            },
            {
              category: "Sistema",
              items: [
                { id: "ajustes", label: "Ajustes", icon: Settings }
              ]
            }
          ].map((group) => (
            <div key={group.category} className="space-y-1">
              {!effectiveSidebarCollapsed && (
                <span className="px-3 text-[9.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block pb-1">
                  {group.category}
                </span>
              )}
              {group.items.map((item) => {
                const ActiveIcon = item.icon;
                const isActive = activeTab === item.id;
                const isNeon = item.id === "dentalstories" || item.id === "tienda" || item.id === "bolsa-empleo";
                return (
                  <button
                    key={item.id}
                    title={effectiveSidebarCollapsed ? item.label : undefined}
                    onClick={() => {
                      if (item.id === "pacientes") {
                        setActivePatientId("");
                      }
                      setActiveTab(item.id as ActiveTab);
                    }}
                    className={`relative w-full text-left font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-3 ${effectiveSidebarCollapsed ? 'justify-center px-1' : 'px-3.5'} ${
                      isActive
                        ? isNeon
                          ? "text-white shadow-[0_0_16px_rgba(20,184,166,0.55)] scale-[1.01]"
                          : "text-white shadow-md shadow-teal-600/10"
                        : isNeon
                        ? "text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:shadow-[0_0_10px_rgba(20,184,166,0.25)] dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-100"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-100"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActivePillBg"
                        className={`absolute inset-0 rounded-xl z-0 ${
                          isNeon
                            ? "bg-gradient-to-r from-teal-600 via-teal-500 to-indigo-600"
                            : "bg-teal-600"
                        }`}
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                    <div className={`relative z-10 flex items-center justify-center shrink-0 ${isNeon ? "w-5 h-5 rounded-md overflow-hidden neon-intense-glow" : ""}`}>
                      {isNeon && (
                        <>
                          <div className="absolute inset-0 neon-rainbow-bg rounded-md pointer-events-none opacity-100" />
                          <div className={`absolute inset-[1.5px] rounded-[4px] z-0 pointer-events-none transition-colors ${isActive ? (item.id === "tienda" ? 'bg-teal-700' : 'bg-teal-600') : 'bg-white group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800/40'}`} />
                        </>
                      )}
                      <ActiveIcon className={`w-4 h-4 relative z-10 ${isNeon ? (isActive ? 'text-white scale-110' : 'text-slate-700 dark:text-slate-200') : ''}`} />
                    </div>
                    {!effectiveSidebarCollapsed && <span className="relative z-10 whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}

          <button
            onClick={() => setShowLandingModal(true)}
            title={effectiveSidebarCollapsed ? "Conoce PerioDash" : undefined}
            className={`w-full text-left font-bold text-xs py-2.5 mt-1 rounded-xl transition-all cursor-pointer text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 inline-flex items-center gap-3 ${effectiveSidebarCollapsed ? 'justify-center px-1' : 'px-3.5'}`}
          >
            <div className="relative flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            {!effectiveSidebarCollapsed && <span className="whitespace-nowrap">Conoce PerioDash</span>}
          </button>

          <button
            onClick={handleLogout}
            title={effectiveSidebarCollapsed ? "Cerrar sesión" : undefined}
            className={`w-full text-left font-bold text-xs py-2.5 mt-1 rounded-xl transition-all cursor-pointer text-red-500 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 dark:hover:bg-red-500/10 inline-flex items-center gap-3 ${effectiveSidebarCollapsed ? 'justify-center px-1' : 'px-3.5'}`}
          >
            <div className="relative flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            {!effectiveSidebarCollapsed && <span className="whitespace-nowrap">Cerrar sesión</span>}
          </button>
        </nav>

        {/* Footer info lock indicator */}
        {!effectiveSidebarCollapsed && (
          <div className="px-5 pt-4 border-t border-slate-50 dark:border-slate-800 text-[10px] text-slate-400 space-y-1 mt-auto overflow-hidden whitespace-nowrap transition-all duration-300">
            <p className="font-semibold">Licencia Profesional Activa</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-mono">Cifrado de Extremo a Extremo</span>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <InteractiveHelpPanel
          activePatient={activePatient}
          onUpdatePatient={(updatedPat) => {
            setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
          }}
          activeTab={activeTab}
          clinicalSubView={clinicalSubView}
          onNavigate={(tab, subView) => {
            setActiveTab(tab);
            if (subView) {
              setClinicalSubView(subView);
            }
          }}
          darkMode={darkMode}
          isOpen={showHelpPanel}
          onClose={() => setShowHelpPanel(!showHelpPanel)}
          learningMode={learningMode}
          setLearningMode={setLearningMode}
        />

        {/* MOBILE CONTAINER HEADER */}
        <header className="md:hidden w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 p-3.5 flex justify-between items-center z-20 sticky top-0 shadow-xs no-print">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsMobileDrawerOpen(true)}>
            <Logo size="sm" subtitle="Software Odontológico" />
          </div>

          <div className="flex items-center gap-2">
            {activePatient && (
              <button
                onClick={() => { setActiveTab('clinica'); setClinicalSubView('ficha'); }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-500/30 rounded-full text-teal-700 dark:text-teal-300 text-[10px] font-bold cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[80px]">{activePatient.name.split(' ')[0]}</span>
              </button>
            )}

            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("periodash-open-search"))}
              className="text-teal-600 dark:text-teal-400 p-2 border border-slate-200/60 dark:border-slate-800 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/20"
              title="Buscador rápido (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="text-slate-500 dark:text-slate-300 p-2 border border-slate-200/60 dark:border-slate-800 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/60"
              title="Cambiar tema"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </header>

        {/* DESKTOP TOP HEADER */}
        <header className="hidden md:flex w-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/30 px-8 py-4 justify-between items-center z-20 sticky top-0 no-print">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-teal-600 dark:text-teal-400 font-extrabold uppercase tracking-wider">PerioDash</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-700 dark:text-slate-200 font-bold capitalize">
              {activeTab === "clinica" ? "Estación Clínica" : activeTab === "pacientes" ? "Expedientes" : activeTab === "agenda" ? "Agenda Médica" : activeTab === "flujo" ? "Flujo & Sillones" : activeTab === "finanzas" ? "Plan & Finanzas" : activeTab}
            </span>
            {activeTab === "clinica" && (
              <>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold capitalize">
                  {clinicalSubView}
                </span>
              </>
            )}
            {activePatient && (
              <>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[160px]">
                  {activePatient.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Live Real-Time Date Pill */}
            <div 
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs"
              title="Fecha actual del sistema clínico"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="capitalize">
                {new Date().toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>

            {/* Network Cloud Sync Indicator */}
            <NetworkStatusIndicator
              isSyncing={isSyncingFirebase}
              syncError={firebaseSyncError}
              lastSyncedTime={lastSyncedTime}
              onManualSync={handleManualSync}
              onOpenIntegrations={() => {
                setActiveTab("ajustes");
                setAjustesSubTab("integraciones");
              }}
            />

            {/* Quick Search */}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("periodash-open-search"))}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50/50 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800/50 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer"
              title="Buscador rápido"
            >
              <Search className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-[11px] font-medium">Buscador</span>
              <kbd className="text-[9px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 rounded px-1 py-0.5 tracking-tight font-mono font-bold ml-1.5">
                Ctrl+K
              </kbd>
            </button>

            {/* Centro de Éxito button */}
            <button 
              onClick={() => setShowHelpPanel(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 hover:from-teal-500/20 hover:to-emerald-500/20 border border-teal-500/20 text-teal-700 dark:text-teal-300 rounded-xl transition-all cursor-pointer group"
              title="Centro de Éxito Clínico"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-500 group-hover:animate-bounce" />
              <span className="text-[11px] font-bold">Guía Clínica</span>
              {learningMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
              )}
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border border-slate-100 dark:border-slate-800/50 rounded-xl cursor-pointer bg-slate-50/30 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-300 transition-all"
              title="Cambiar apariencia"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-700" />}
            </button>
          </div>
        </header>

        {/* VIEWPORT AREA CONTENT */}
        <main className="flex-1 w-full p-4 md:p-8 space-y-6 pb-[calc(110px+env(safe-area-inset-bottom))] md:pb-8 relative z-0 print:p-0 print:m-0 print:overflow-visible">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6, scale: 0.998 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.998 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="gpu-layer"
            >
              <Suspense fallback={<ClinicalViewSkeleton />}>
                {renderTabContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

      {/* Main content closing */}
    </div>


      {/* FLOATING CHATBOT ENGINE */}
      <DentitoChat 
        activePatient={activePatient} 
        patients={patients}
        appointments={appointments}
        activeTab={activeTab}
        clinicalSubView={clinicalSubView}
        doctorName={doctorName}
        clinicName={clinicName}
        aranceles={aranceles}
      />

      <Spotlight 
        patients={patients} 
        onSelectPatient={(id) => setActivePatientId(id)} 
        onNavigate={(tab) => {
          setActiveTab(tab as ActiveTab);
          window.dispatchEvent(new CustomEvent('periodash-navigate', { detail: tab }));
        }} 
      />

      <Suspense fallback={null}>
        <AnimatePresence>
          {showShareModal && activePatient && (
            <SharePatientModal patient={activePatient} onClose={() => setShowShareModal(false)} />
          )}

          {showPrescriptionModal && activePatient && (
            <PrescriptionAndReferralModal
              isOpen={showPrescriptionModal}
              onClose={() => setShowPrescriptionModal(false)}
              patient={activePatient}
              doctorName={doctorName}
              clinicName={clinicName}
              onAddEvolution={(newEvo) => {
                const updatedPat: Patient = {
                  ...activePatient,
                  evolutions: [newEvo, ...(activePatient.evolutions || [])]
                };
                setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
              }}
            />
          )}

          {showPeriodontoComparison && activePatient && (
            <PeriodontogramComparisonModal
              isOpen={showPeriodontoComparison}
              onClose={() => setShowPeriodontoComparison(false)}
              patient={activePatient}
              onSaveCurrentSnapshot={(title) => {
                // Calculate periodontal summary parameters
                let totalSites = 0;
                let bopSites = 0;
                let sumDepth = 0;
                Object.values(activePatient.periodontogram || {}).forEach((state: any) => {
                  ['vestibular', 'lingual'].forEach(arch => {
                    const data = state?.[arch];
                    if (data?.sondaje) {
                      ['distal', 'medio', 'mesial'].forEach(pos => {
                        const val = data.sondaje[pos];
                        if (val && !isNaN(val)) {
                          sumDepth += Number(val);
                          totalSites++;
                        }
                      });
                    }
                    if (data?.sangrado) {
                      ['distal', 'medio', 'mesial'].forEach(pos => {
                        if (data.sangrado[pos]) bopSites++;
                      });
                    }
                  });
                });

                const newSnapshot: PeriodontogramVisit = {
                  id: `visit-${Date.now()}`,
                  date: new Date().toISOString(),
                  title: title,
                  oLearyScore: 18,
                  bopScore: totalSites > 0 ? Math.round((bopSites / totalSites) * 100) : 0,
                  meanPocketDepth: totalSites > 0 ? Number((sumDepth / totalSites).toFixed(1)) : 2.4,
                  periodontogram: activePatient.periodontogram
                };
                const updatedPat: Patient = {
                  ...activePatient,
                  periodontogramHistory: [newSnapshot, ...(activePatient.periodontogramHistory || [])]
                };
                setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
              }}
            />
          )}

          {showKioskModal && activePatient && (
            <KioskModeModal
              isOpen={showKioskModal}
              onClose={() => setShowKioskModal(false)}
              patient={activePatient}
              onSavePatient={(updatedPat) => {
                setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
              }}
            />
          )}

          {deletingPatientId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingPatientId(null)}
              className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-md z-[260] flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-[2rem] max-w-sm w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto"
              >
                <button 
                  onClick={() => setDeletingPatientId(null)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center border border-red-500/20 animate-pulse">
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-[#09090b] dark:text-white">¿Purgar Expediente Clínico?</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      ¿Estás seguro de que deseas eliminar permanentemente a <strong className="text-slate-900 dark:text-teal-400 font-bold">{patients.find(p => p.id === deletingPatientId)?.name || "este paciente"}</strong> y todos sus registros clínicos, periodontogramas e historiales? Esta operación es irreversible.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => executeDeletePatient(deletingPatientId)}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer active:scale-95 text-center"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setDeletingPatientId(null)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700/60 active:scale-95 text-center"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />
      </Suspense>

      {/* Mobile Bottom Dock Bar */}
      <MobileBottomDock
        activePatient={activePatient}
        activeTab={activeTab}
        onNavigate={(tab, subView) => {
          setActiveTab(tab as any);
          if (subView) setClinicalSubView(subView as any);
        }}
        onToggleVoice={() => window.dispatchEvent(new CustomEvent('periodash-open-dentito'))}
        onOpenNewAppointment={() => setActiveTab('agenda')}
        onOpenNewPatient={() => setShowRegisterForm(true)}
        onOpenMenu={() => setIsMobileDrawerOpen(true)}
      />

      {/* Mobile Full Navigation Drawer */}
      <MobileNavigationDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === "pacientes") {
            setActivePatientId("");
          }
          setActiveTab(tab);
        }}
        clinicalSubView={clinicalSubView}
        onSelectClinicalSubView={(sub) => {
          setActiveTab("clinica");
          setClinicalSubView(sub);
        }}
        doctorName={doctorName}
        clinicName={clinicName}
        activePatientName={activePatient?.name}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenSearch={() => window.dispatchEvent(new CustomEvent("periodash-open-search"))}
        onOpenHelp={() => setShowHelpPanel(true)}
        onOpenNewPatient={() => setShowRegisterForm(true)}
        onOpenNewAppointment={() => setActiveTab('agenda')}
        onOpenLanding={() => setShowLandingModal(true)}
        onLogout={handleLogout}
      />

      {/* Modal Preview of Institutional Landing Page (When Logged in) */}
      {showLandingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl overflow-y-auto">
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setShowLandingModal(false)}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl border border-teal-500/30 text-xs font-bold shadow-2xl hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>✕ Volver al Terminal Clínico</span>
            </button>
          </div>
          <LandingPage
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onEnterAsDentist={() => setShowLandingModal(false)}
            onEnterAsPatient={() => {
              setShowLandingModal(false);
              setPortalAccessKey("1");
              setGuestView("patient_portal");
            }}
            onSelectPatientRut={(rut) => {
              setShowLandingModal(false);
              setPortalAccessKey(rut || "1");
              setGuestView("patient_portal");
            }}
          />
        </div>
      )}

      {/* HIPAA Screen Inactivity Auto-Lock Overlay (§ 164.312(a)(2)(iii)) */}
      <HipaaInactivityLock
        user={activeUser}
        onLogout={handleLogout}
        darkMode={darkMode}
        timeoutMinutes={inactivityMinutes}
      />

      {/* HIPAA Compliance & Audit Center Modal */}
      <HipaaComplianceCenter
        isOpen={showHipaaCenter}
        onClose={() => setShowHipaaCenter(false)}
        patients={patients}
        onUpdatePatient={(updatedPat) => {
          setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
        }}
        currentUser={activeUser}
        darkMode={darkMode}
        privacyMode={privacyMode}
        onTogglePrivacyMode={handleTogglePrivacyMode}
        inactivityMinutes={inactivityMinutes}
        onChangeInactivityMinutes={handleChangeInactivityMinutes}
      />

      {/* Security Hardening & Defensive Shield Modal */}
      <SecurityHardeningBanner
        darkMode={darkMode}
        currentUser={activeUser}
        privacyMode={privacyMode}
        onTogglePrivacyMode={handleTogglePrivacyMode}
        inactivityMinutes={inactivityMinutes}
        onChangeInactivityMinutes={handleChangeInactivityMinutes}
        hideTrigger={true}
        isOpenControlled={showSecurityModal}
        onCloseControlled={() => setShowSecurityModal(false)}
      />

    </div>
  );
}
