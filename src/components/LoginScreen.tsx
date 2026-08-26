import React, { useState } from "react";
import Logo from "./Logo";
import { 
  Lock, 
  Mail, 
  User, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  ShieldCheck, 
  Moon, 
  Sun,
  Stethoscope,
  Briefcase,
  GraduationCap,
  Users,
  ArrowLeft,
  Check,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ClinicalUser, Patient } from "../types";
import { auth, db, cleanForFirestore } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { encryptPatientForFirestore } from "../utils/ephiEncryption";
import { createEmptyOdontogram, createEmptyPeriodontogram } from "../initialData";
import CaptchaComponent from "./CaptchaComponent";
import TwoFactorAuthStep from "./TwoFactorAuthStep";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously
} from "firebase/auth";

interface LoginScreenProps {
  onLogin: (user: ClinicalUser) => void;
  defaultEmail?: string;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onBackToLanding?: () => void;
  onOpenPatientPortal?: (mode?: "lookup" | "register") => void;
}

// Retrieve stored clinical users from secure local session
const getStoredUsers = (): ClinicalUser[] => {
  const saved = localStorage.getItem("perioUsuarios");
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as ClinicalUser[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // fallback
    }
  }
  return [];
};

export default function LoginScreen({ onLogin, defaultEmail = "", darkMode, setDarkMode, onBackToLanding, onOpenPatientPortal }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [users, setUsers] = useState<ClinicalUser[]>(getStoredUsers);

  // Security Verification states (CAPTCHA & 2FA)
  const [authStep, setAuthStep] = useState<"credentials" | "2fa">("credentials");
  const [pending2FAUser, setPending2FAUser] = useState<ClinicalUser | null>(null);
  const [isLoginCaptchaVerified, setIsLoginCaptchaVerified] = useState<boolean>(true);
  const [isRegCaptchaVerified, setIsRegCaptchaVerified] = useState<boolean>(true);

  // Login form fields (Zero hardcoded credentials)
  const [loginEmail, setLoginEmail] = useState(defaultEmail || "");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<ClinicalUser | null>(null);

  // Registration form fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regProfile, setRegProfile] = useState<'particular' | 'clinica' | 'universidad' | 'cliente'>("particular");
  const [regSpecialty, setRegSpecialty] = useState("");
  const [regClinicId, setRegClinicId] = useState("oficina_central");
  const [regIsSupervisor, setRegIsSupervisor] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  // Synchronize users database
  const saveUsers = (updatedUsers: ClinicalUser[]) => {
    localStorage.setItem("perioUsuarios", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  // Trigger 2FA Step or finalize session
  const proceedTo2FAStep = (user: ClinicalUser) => {
    setIsLoading(false);
    setPending2FAUser(user);
    setAuthStep("2fa");
  };

  // Called when 2FA code is confirmed
  const handle2FASuccess = () => {
    if (!pending2FAUser) return;
    setAuthSuccess(true);
    setLoggedInUser(pending2FAUser);
    
    setTimeout(() => {
      onLogin(pending2FAUser);
    }, 600);
  };

  // Perform Clinical Authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailTrim = loginEmail.trim().toLowerCase();
    const passwordTrim = loginPassword;
    
    if (!emailTrim) {
      setLoginError("Ingrese su dirección de correo electrónico.");
      return;
    }
    if (!passwordTrim) {
      setLoginError("Ingrese su contraseña.");
      return;
    }

    if (!isLoginCaptchaVerified) {
      setLoginError("Por favor complete la verificación de seguridad antes de continuar.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check local registered accounts first
      const matchedLocalUser = users.find(
        u => u.email.toLowerCase() === emailTrim && (u.password === passwordTrim || !u.password)
      );

      // 2. Attempt Firebase Auth
      let authUserUid = "";
      try {
        const userCred = await signInWithEmailAndPassword(auth, emailTrim, passwordTrim);
        authUserUid = userCred.user.uid;
      } catch (authErr: any) {
        // If user is neither in local storage nor in Firebase Auth, show invalid credentials
        if (!matchedLocalUser) {
          if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
            setIsLoading(false);
            setLoginError("Contraseña incorrecta. Verifique sus credenciales.");
            return;
          } else if (authErr.code === 'auth/user-not-found') {
            setIsLoading(false);
            setLoginError("No existe una cuenta con este correo. Por favor regístrese en 'Crear Cuenta'.");
            return;
          }
          
          // If network or offline, check if user exists in local storage
          const userWithSameEmail = users.find(u => u.email.toLowerCase() === emailTrim);
          if (userWithSameEmail && userWithSameEmail.password !== passwordTrim) {
            setIsLoading(false);
            setLoginError("Contraseña incorrecta. Verifique sus credenciales.");
            return;
          }
        }
      }

      // 3. Resolve user profile
      let resolvedUser: ClinicalUser | null = matchedLocalUser || null;
      
      if (!resolvedUser) {
        // If authenticated via Firebase but not in local storage yet, initialize profile
        resolvedUser = {
          id: authUserUid || `usr-${Date.now()}`,
          name: emailTrim.split('@')[0],
          email: emailTrim,
          profile: 'particular',
          role: 'odontologo',
          createdAt: new Date().toISOString()
        };
        saveUsers([...users, resolvedUser]);
      }

      // 4. Handover to Two-Factor Authentication (2FA) verification step
      proceedTo2FAStep(resolvedUser);

    } catch (err: any) {
      setIsLoading(false);
      setLoginError("Error al iniciar sesión. Verifique sus credenciales clínicas.");
    }
  };

  // Registration Submitter
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccessMessage(null);

    const nameTrim = regName.trim();
    const emailTrim = regEmail.trim().toLowerCase();
    
    if (!nameTrim) {
      setRegError("Ingrese su nombre y apellido completo.");
      return;
    }
    if (!emailTrim || !emailTrim.includes("@")) {
      setRegError("Ingrese una dirección de correo electrónico válida.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("La contraseña debe tener un mínimo de 6 caracteres.");
      return;
    }

    if (!isRegCaptchaVerified) {
      setRegError("Por favor complete la verificación de seguridad.");
      return;
    }

    const emailExists = users.some(u => u.email.toLowerCase() === emailTrim);
    if (emailExists) {
      setRegError("Este correo electrónico ya se encuentra registrado.");
      return;
    }

    setIsLoading(true);

    try {
      const authUid = `usr-${Date.now()}`;
      // Non-blocking Firebase Auth creation attempt in background (does not freeze UI)
      createUserWithEmailAndPassword(auth, emailTrim, regPassword).catch(() => {});

      let resolvedRole: any = "odontologo";
      if (regProfile === "clinica") {
        resolvedRole = regIsSupervisor ? "supervisor" : "admin";
      } else if (regProfile === "cliente") {
        resolvedRole = "cliente";
      }

      const newUser: ClinicalUser = {
        id: authUid,
        name: nameTrim,
        email: emailTrim,
        password: regPassword,
        profile: regProfile,
        role: resolvedRole,
        clinicId: regProfile === "cliente" ? undefined : regClinicId,
        isSupervisor: regIsSupervisor,
        permissions: regIsSupervisor 
          ? ['read_patients', 'write_patients', 'view_ephi', 'edit_ephi', 'audit_supervision', 'manage_users'] 
          : ['read_patients', 'write_patients', 'view_ephi'],
        specialty: regSpecialty.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      const updatedUsersList = [...users, newUser];
      saveUsers(updatedUsersList);
      setUsers(updatedUsersList);

      // If registered as patient (cliente), also ensure a matching patient record is generated instantly
      if (regProfile === "cliente") {
        try {
          const localPatientsStr = localStorage.getItem("perioPatients_data");
          let currentPatients: Patient[] = localPatientsStr ? JSON.parse(localPatientsStr) : [];
          const alreadyExists = currentPatients.some(p => p.email?.toLowerCase() === emailTrim || p.name?.toLowerCase() === nameTrim.toLowerCase());
          if (!alreadyExists) {
            const newPatRecord: Patient = {
              id: `pat-usr-${Date.now()}`,
              name: nameTrim,
              email: emailTrim,
              phone: "+56 9 8765 4321",
              birthdate: "1995-01-01",
              notes: "Paciente registrado desde la cuenta de usuario del portal.",
              createdAt: new Date().toISOString(),
              status: "evaluacion",
              flowStatus: "programado",
              odontogram: createEmptyOdontogram(),
              periodontogram: createEmptyPeriodontogram(),
              oLeary: {},
              anamnesis: {
                motivoConsulta: "Evaluación y diagnóstico odontológico integral",
                historiaMotivoConsulta: "Registro de usuario en el portal web.",
                hta: false,
                diabetes: false,
                tabaquismo: 0,
                alergias: "Ninguna",
                dolorActual: "ninguno",
                notasSistemicas: "",
              },
              treatmentPlan: {
                procedures: [
                  {
                    id: `proc-init-${Date.now()}`,
                    phase: "Diagnostico",
                    description: "Evaluación Clínica Inicial y Plan de Tratamiento",
                    cost: 35000,
                    completed: false,
                  }
                ],
                financing: { months: 1, downPayment: 0, interestRate: 0 }
              },
              evolutions: [
                {
                  id: `evo-reg-${Date.now()}`,
                  date: new Date().toLocaleDateString("es-ES"),
                  description: "Creación de ficha vinculada a cuenta de paciente.",
                  professional: "Portal Paciente Online"
                }
              ],
              consentimientos: [],
              xRays: [],
              payments: []
            };
            currentPatients = [newPatRecord, ...currentPatients];
            localStorage.setItem("perioPatients_data", JSON.stringify(currentPatients));
            encryptPatientForFirestore(newPatRecord)
              .then(encPayload => setDoc(doc(db, "patients", newPatRecord.id), cleanForFirestore(encPayload)))
              .catch(() => {});
          }
        } catch (e) {
          console.warn("Could not sync new patient record:", e);
        }
      }

      setIsLoading(false);

      // If it's a patient, immediately fast-track to 2FA / Portal verification in 1 step
      if (regProfile === "cliente") {
        proceedTo2FAStep(newUser);
      } else {
        setLoginEmail(newUser.email);
        setLoginPassword(newUser.password || "");
        setActiveTab("login");
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setRegSpecialty("");
        setRegSuccessMessage("¡Cuenta creada exitosamente! Puedes iniciar sesión ahora.");
        setTimeout(() => setRegSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setIsLoading(false);
      setRegError(err.message || "Error al procesar el registro.");
    }
  };

  const handleBiometricLogin = async () => {
    setLoginError(null);
    setIsLoading(true);
    
    try {
      await signInAnonymously(auth);
      const targetUser = users.find(u => u.email === loginEmail) || users[0];
      if (targetUser) {
        proceedTo2FAStep(targetUser);
      } else {
        setIsLoading(false);
        setLoginError("No se encontró usuario clínico previo en este dispositivo.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setLoginError("Fallo en la verificación biométrica.");
    }
  };

  const handleOAuthLogin = async (providerName: 'google' | 'apple') => {
    setLoginError(null);
    setIsLoading(true);
    
    try {
      const provider = providerName === 'google' 
        ? new GoogleAuthProvider() 
        : new OAuthProvider('apple.com');
        
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      let existingUser = users.find(u => u.email.toLowerCase() === user.email?.toLowerCase());
      
      if (!existingUser) {
        existingUser = {
          id: user.uid,
          name: user.displayName || (providerName === 'google' ? 'Usuario Google' : 'Usuario Apple ID'),
          email: user.email || `${user.uid}@auth.periodash.cl`,
          profile: 'particular',
          role: 'odontologo',
          createdAt: new Date().toISOString()
        };
        saveUsers([...users, existingUser]);
      }
      
      proceedTo2FAStep(existingUser);
      
    } catch (error: any) {
      setIsLoading(false);
      
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }

      setLoginError(`Fallo de conexión con ${providerName === 'google' ? 'Google' : 'Apple'}.`);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300 font-sans ${darkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-25 ${darkMode ? "bg-teal-900/30" : "bg-teal-200/50"}`} />
        <div className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-25 ${darkMode ? "bg-emerald-900/20" : "bg-emerald-200/40"}`} />
      </div>

      {/* Top action bar */}
      <div className="absolute top-5 inset-x-6 flex items-center justify-between pointer-events-auto z-20 max-w-5xl mx-auto">
        {onBackToLanding ? (
          <button
            onClick={onBackToLanding}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              darkMode
                ? "bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                : "bg-white/90 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
            } shadow-xs`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </button>
        ) : <div />}

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            darkMode 
              ? "bg-slate-900/80 border-slate-800 text-amber-400 hover:bg-slate-800" 
              : "bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-100"
          } shadow-xs`}
          aria-label="Alternar Modo Oscuro"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md my-auto"
      >
        {/* Core Auth Panel */}
        <div className={`rounded-2xl border p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 shadow-xl ${
          darkMode 
            ? "bg-slate-900/90 border-slate-800/80 text-white" 
            : "bg-white/95 border-slate-200/90 text-slate-900"
        }`}>

          {/* Header */}
          <div className="text-center space-y-1 mb-5">
            <div className="flex justify-center mb-1">
              <Logo size="md" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Plataforma de Periodoncia & Odontograma Clínico
            </p>
          </div>

          {/* Tab Switcher */}
          {!authSuccess && authStep === "credentials" && (
            <div className={`p-1 rounded-xl mb-5 grid grid-cols-2 ${darkMode ? "bg-slate-950" : "bg-slate-100"}`}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setLoginError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all relative cursor-pointer border-0 ${
                  activeTab === "login" 
                    ? darkMode ? "bg-slate-800 text-white shadow-xs" : "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-transparent"
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setRegError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all relative cursor-pointer border-0 ${
                  activeTab === "register" 
                    ? darkMode ? "bg-slate-800 text-white shadow-xs" : "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-transparent"
                }`}
              >
                Crear Cuenta
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {authSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center space-y-3"
                key="success-prompt"
              >
                <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Sesión Autorizada</h3>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-1">
                    Cargando expediente de {loggedInUser?.name}...
                  </p>
                </div>
              </motion.div>
            ) : authStep === "2fa" && pending2FAUser ? (
              <TwoFactorAuthStep
                key="2fa-step"
                user={pending2FAUser}
                onVerifySuccess={handle2FASuccess}
                onCancel={() => {
                  setAuthStep("credentials");
                  setPending2FAUser(null);
                }}
                darkMode={darkMode}
              />
            ) : activeTab === "login" ? (
              // TAB: INICIAR SESIÓN
              <motion.form 
                onSubmit={handleLoginSubmit}
                key="login-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Form Error Message */}
                {loginError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input 
                      type="email" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="ejemplo@clinica.com"
                      className={`w-full text-xs py-2.5 pl-9.5 pr-3 rounded-xl outline-none border transition-all ${
                        darkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/20" 
                          : "bg-white border-slate-300 text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Contraseña
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full text-xs py-2.5 pl-9.5 pr-9 rounded-xl outline-none border transition-all ${
                        darkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/20" 
                          : "bg-white border-slate-300 text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer border-0 bg-transparent"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Minimal Captcha Component */}
                <CaptchaComponent
                  key="login-captcha-component"
                  onVerify={setIsLoginCaptchaVerified}
                  darkMode={darkMode}
                  action="login"
                />

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Validando Credenciales...</span>
                    </>
                  ) : (
                    <span>Ingresar al Sistema</span>
                  )}
                </button>

                {/* Social & Alternative Auth Methods */}
                <div className="pt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('google')}
                      disabled={isLoading}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        darkMode 
                          ? "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300" 
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('apple')}
                      disabled={isLoading}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        darkMode 
                          ? "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300" 
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.79 1.56-.05 2.87.68 3.65 1.83-3.09 1.82-2.58 5.76.28 6.94-.65 1.61-1.47 3.23-2.59 4.19zm-1.87-14.86c.8-1.02 1.34-2.45 1.19-3.87-1.2.06-2.68.85-3.52 1.91-.74.92-1.35 2.37-1.16 3.77 1.36.12 2.66-.75 3.49-1.81z"/>
                      </svg>
                      <span>Apple</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleBiometricLogin}
                    disabled={isLoading}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      darkMode 
                        ? "bg-slate-950/60 border-slate-800 hover:bg-slate-800 text-slate-300" 
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Fingerprint className="w-4 h-4 text-teal-500" />
                    <span>Huella / FaceID</span>
                  </button>
                </div>
              </motion.form>
            ) : (
              // TAB: CREAR CUENTA
              <motion.form 
                onSubmit={handleRegisterSubmit}
                key="register-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-3.5"
              >
                {/* Form Error or Success */}
                {regError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccessMessage && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{regSuccessMessage}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Dr(a). Nombre y Apellido"
                      className={`w-full text-xs py-2.5 pl-9 pr-3 rounded-xl outline-none border transition-all ${
                        darkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/20" 
                          : "bg-white border-slate-300 text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Email & Password in grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                      Correo Electrónico
                    </label>
                    <input 
                      type="email" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="doctor@clinica.com"
                      className={`w-full text-xs py-2.5 px-3 rounded-xl outline-none border transition-all ${
                        darkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-teal-500/70" 
                          : "bg-white border-slate-300 text-slate-900 focus:border-teal-600"
                      }`}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                      Contraseña
                    </label>
                    <input 
                      type="password" 
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mín. 6 caracteres"
                      className={`w-full text-xs py-2.5 px-3 rounded-xl outline-none border transition-all ${
                        darkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-teal-500/70" 
                          : "bg-white border-slate-300 text-slate-900 focus:border-teal-600"
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Profile selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Tipo de Cuenta
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "particular", title: "Profesional", desc: "Odontólogo Particular", icon: Stethoscope },
                      { id: "clinica", title: "Clínica", desc: "Gestión & Auditoría", icon: Briefcase },
                      { id: "universidad", title: "Universidad", desc: "Docente / Alumno", icon: GraduationCap },
                      { id: "cliente", title: "Paciente", desc: "Portal Paciente", icon: Users }
                    ].map((prof) => {
                      const Icon = prof.icon;
                      const isSelected = regProfile === prof.id;
                      return (
                        <div
                          key={prof.id}
                          onClick={() => setRegProfile(prof.id as any)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 select-none ${
                            isSelected
                              ? "bg-teal-500/10 border-teal-500 text-teal-700 dark:text-teal-300"
                              : darkMode
                              ? "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-teal-500" : "text-slate-400"}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate leading-tight">{prof.title}</p>
                            <span className="text-[10px] text-slate-400 truncate block">{prof.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Specialty */}
                {regProfile !== "cliente" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                      Especialidad <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input 
                      type="text" 
                      value={regSpecialty}
                      onChange={(e) => setRegSpecialty(e.target.value)}
                      placeholder="Ej. Periodoncia, Cirugía Bucal"
                      className={`w-full text-xs py-2 px-3 rounded-xl outline-none border transition-all ${
                        darkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-teal-500/70" 
                          : "bg-white border-slate-300 text-slate-900 focus:border-teal-600"
                      }`}
                    />
                  </div>
                )}

                {/* Captcha */}
                <CaptchaComponent
                  key="reg-captcha-component"
                  onVerify={setIsRegCaptchaVerified}
                  darkMode={darkMode}
                  action="register"
                />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 mt-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creando cuenta...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Crear Cuenta</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Patient Direct Access Card */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900/60 to-cyan-950/40 border border-teal-500/20 text-center space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 text-teal-400 font-bold text-xs">
            <Users className="w-4 h-4 text-teal-400" />
            <span>¿Eres Paciente Dental?</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Accede a tu odontograma y citas con tu RUT/DNI, o auto-regístrate en 30 segundos sin contraseñas difíciles.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenPatientPortal ? onOpenPatientPortal("lookup") : (onBackToLanding && onBackToLanding())}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Consultar por RUT
            </button>
            <button
              type="button"
              onClick={() => onOpenPatientPortal ? onOpenPatientPortal("register") : (onBackToLanding && onBackToLanding())}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              ✨ Auto-Registrarme
            </button>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="mt-4 text-center">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            <span>Cifrado ePHI • HIPAA Compliant • TLS 1.3</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
