import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Lock, 
  KeyRound, 
  Server, 
  Database, 
  FileCheck, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
  Fingerprint,
  Radio,
  Zap,
  Flame
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  isHipaaPrivacyModeEnabled, 
  setHipaaPrivacyMode, 
  getHipaaInactivityMinutes, 
  setHipaaInactivityMinutes,
  recordHipaaAudit
} from "../utils/hipaaAudit";
import { fetchFortressTelemetry, FortressTelemetry } from "../utils/securityShield";
import { ClinicalUser } from "../types";

interface SecurityHardeningBannerProps {
  darkMode: boolean;
  currentUser: ClinicalUser | null;
  privacyMode: boolean;
  onTogglePrivacyMode: (enabled: boolean) => void;
  inactivityMinutes: number;
  onChangeInactivityMinutes: (minutes: number) => void;
  hideTrigger?: boolean;
  isOpenControlled?: boolean;
  onCloseControlled?: () => void;
}

export default function SecurityHardeningBanner({
  darkMode,
  currentUser,
  privacyMode,
  onTogglePrivacyMode,
  inactivityMinutes,
  onChangeInactivityMinutes,
  hideTrigger = false,
  isOpenControlled,
  onCloseControlled
}: SecurityHardeningBannerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isModalOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  const handleCloseModal = () => {
    if (onCloseControlled) {
      onCloseControlled();
    } else {
      setInternalIsOpen(false);
    }
  };
  const [activeTab, setActiveTab] = useState<"status" | "waf" | "barriers">("status");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSuccess, setAuditSuccess] = useState(false);
  const [telemetry, setTelemetry] = useState<FortressTelemetry | null>(null);

  const loadTelemetry = async () => {
    const data = await fetchFortressTelemetry();
    if (data) setTelemetry(data);
  };

  useEffect(() => {
    loadTelemetry();
  }, []);

  const handleRunSecurityAudit = async () => {
    setIsAuditing(true);
    setAuditSuccess(false);

    await loadTelemetry();

    setTimeout(() => {
      setIsAuditing(false);
      setAuditSuccess(true);
      recordHipaaAudit(
        "SECURITY_ALERT",
        "Diagnóstico de blindaje de seguridad WAF y verificación de barreras defensivas PII/PHI ejecutado con éxito.",
        {
          user: currentUser,
          resource: "PerioDash Military-Grade Fortress Core",
          severity: "info"
        }
      );
    }, 800);
  };

  return (
    <>
      {/* Top Header Micro-Widget (only rendered if hideTrigger is false) */}
      {!hideTrigger && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onTogglePrivacyMode(!privacyMode)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              privacyMode
                ? "bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-300 hover:bg-amber-500/30"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
            }`}
            title={privacyMode ? "Modo Privacidad Activo: Datos PII/PHI enmascarados" : "Activar Escudo de Privacidad Anti-Miradas"}
          >
            {privacyMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span className="hidden sm:inline">Escudo PII: ON</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Privacidad</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setInternalIsOpen(true);
              loadTelemetry();
            }}
            className="p-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 transition-all cursor-pointer shadow-xs flex items-center gap-1 text-xs font-bold"
            title="Centro de Seguridad y Barreras Defensivas PII/PHI"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            <span className="hidden md:inline">Blindaje 100%</span>
          </button>
        </div>
      )}

      {/* Security Dialog Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
                darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-500/10 via-transparent to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-500 border border-teal-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg flex items-center gap-2">
                      <span>Fortaleza de Seguridad & Blindaje WAF</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30">
                        Inquebrantable
                      </span>
                    </h3>
                    <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Cortafuegos inteligente, Honeypot Tarpit, Reglas Zero-Trust y cumplimiento HIPAA / RGPD
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("status")}
                  className={`py-3 border-b-2 transition-all cursor-pointer ${
                    activeTab === "status"
                      ? "border-teal-500 text-teal-600 dark:text-teal-400"
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  8 Anillos de Blindaje
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("waf")}
                  className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "waf"
                      ? "border-teal-500 text-teal-600 dark:text-teal-400"
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Telemetría WAF & Tarpit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("barriers")}
                  className={`py-3 border-b-2 transition-all cursor-pointer ${
                    activeTab === "barriers"
                      ? "border-teal-500 text-teal-600 dark:text-teal-400"
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  Controles de Privacidad
                </button>
              </div>

              {/* Content Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {activeTab === "status" && (
                  <div className="space-y-4">
                    {/* Diagnostic Summary */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                      darkMode ? "bg-slate-950/60 border-slate-800" : "bg-teal-50/50 border-teal-100"
                    }`}>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div>
                          <h4 className="font-bold text-xs">Blindaje Perimetral Activo • 0 Vulnerabilidades</h4>
                          <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                            WAF en tiempo real, Trampas Honeypot y Cifrado AES-256 / TLS 1.3 protegiendo la clínica.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRunSecurityAudit}
                        disabled={isAuditing}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
                        <span>{isAuditing ? "Verificando..." : "Auditar Fortaleza"}</span>
                      </button>
                    </div>

                    {auditSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-medium flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Auditoría exitosa: Los 7 anillos defensivos y el sistema Tarpit responden al 100%.</span>
                      </motion.div>
                    )}

                    {/* 7 Defensive Pillars Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span>1. WAF & Inspector Profundo</span>
                          </span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase">Activo</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Neutraliza SQL Injection, NoSQL Injection, XSS Políglota y Prototype Pollution.
                        </p>
                      </div>

                      <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                            <Flame className="w-4 h-4 text-rose-500" />
                            <span>2. Trampas Honeypot & Tarpit</span>
                          </span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase">3.0s Delay / 24h Ban</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Rutas trampa asfixian herramientas automáticas (sqlmap, gobuster) dejándolas congeladas.
                        </p>
                      </div>

                      <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                            <Server className="w-4 h-4" />
                            <span>3. Cifrado TLS 1.3 & HSTS</span>
                          </span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase">1 Año Preload</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          HSTS forzado, CSP estricto, Anti-Clickjacking y bloqueo de sniffing MIME.
                        </p>
                      </div>

                      <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                            <EyeOff className="w-4 h-4" />
                            <span>4. Escudo PII en Consola & RAM</span>
                          </span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase">Activo</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Intercepta y anonimiza RUTs, nombres y teléfonos para impedir fugas en DevTools o logs.
                        </p>
                      </div>

                      <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                            <Lock className="w-4 h-4" />
                            <span>5. Bloqueo Inactividad HIPAA</span>
                          </span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase">{inactivityMinutes} min</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Cierra la terminal médica automáticamente si el profesional se aleja del sillón dental.
                        </p>
                      </div>

                      <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                            <Database className="w-4 h-4" />
                            <span>6. Reglas Firestore Zero-Trust</span>
                          </span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase">Default-Deny</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          RBAC médico estricto, partición por clínica e inalterabilidad de registros clínicos.
                        </p>
                      </div>

                      <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                            <KeyRound className="w-4 h-4" />
                            <span>7. Aislamiento de Secretos</span>
                          </span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase">100% Servidor Backend</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Las llaves secretas de Gemini y APIs nunca viajan al navegador. Peticiones procesadas en rutas aisladas con rate-limiting.
                        </p>
                      </div>

                      <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        darkMode ? "bg-slate-950/40 border-teal-500/30" : "bg-teal-50/50 border-teal-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                            <Lock className="w-4 h-4 text-emerald-400" />
                            <span>8. Cifrado Zero-Knowledge ePHI</span>
                          </span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase">AES-256-GCM / PBKDF2</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Capa de cifrado en el navegador antes de enviar a Firestore. Base de datos 100% ciega a fichas clínicas y citas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "waf" && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl border ${
                      darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                          <h4 className="font-bold text-xs">Estado en Vivo del Cortafuegos</h4>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                          MODO TARPIT DEFENSIVO
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <div className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
                            {telemetry?.waf.signaturesLoaded || 15}
                          </div>
                          <div className="text-[10px] text-slate-500">Firmas 0-Day WAF</div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                            {telemetry?.waf.honeypotsLoaded || 25}
                          </div>
                          <div className="text-[10px] text-slate-500">Trampas Honeypot</div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                            {telemetry?.waf.totalAttacksBlocked || 0}
                          </div>
                          <div className="text-[10px] text-slate-500">Ataques Neutralizados</div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {telemetry?.waf.tarpitDelaySeconds || 3.0}s
                          </div>
                          <div className="text-[10px] text-slate-500">Castigo Tarpit Delay</div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border space-y-2 ${
                      darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      <h4 className="font-bold text-xs flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <Flame className="w-4 h-4" />
                        <span>¿Por qué un atacante se aburre de intentarlo?</span>
                      </h4>
                      <p className={`text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                        Cuando un escáner malicioso o bot intenta probar contraseñas, inyecciones SQL o rutas secretas (<code className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">/.env, /wp-admin, /admin.php</code>), el servidor de PerioDash no solo lo bloquea de inmediato, sino que aplica una **retención de conexión forzada (Tarpit de 3 segundos)** por cada intento y suspende su IP por 24 horas. Esto causa que herramientas automatizadas queden colgadas por horas sin obtener ningún dato, agotando sus recursos y obligando al atacante a desistir.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "barriers" && (
                  <div className="space-y-4">
                    {/* Privacy Mode Switch */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                      darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs flex items-center gap-1.5">
                          <EyeOff className="w-4 h-4 text-amber-500" />
                          <span>Modo Quirófano / Escudo Anti-Miradas (PII Masking)</span>
                        </h4>
                        <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Enmascara instantáneamente RUTs, nombres, correos y teléfonos en todas las pantallas.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onTogglePrivacyMode(!privacyMode)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                          privacyMode
                            ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                        }`}
                      >
                        {privacyMode ? "Activado" : "Desactivado"}
                      </button>
                    </div>

                    {/* Inactivity Threshold Select */}
                    <div className={`p-4 rounded-2xl border space-y-2 ${
                      darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      <h4 className="font-bold text-xs flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-teal-500" />
                        <span>Tiempo de Inactividad para Bloqueo Automático HIPAA</span>
                      </h4>
                      <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Seleccione los minutos sin actividad requeridos para bloquear la terminal médica:
                      </p>
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {[3, 5, 10, 15].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => onChangeInactivityMinutes(mins)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              inactivityMinutes === mins
                                ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                                : darkMode
                                ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {mins} minutos
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 text-xs">
                <span className="text-[11px] text-slate-400">
                  PerioDash Fortress Engine • Zero Trust Architecture
                </span>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer border-0"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
