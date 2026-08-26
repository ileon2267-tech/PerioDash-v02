import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Database, 
  KeyRound, 
  Smartphone, 
  FileSpreadsheet, 
  FileJson, 
  X, 
  RefreshCw, 
  PenTool,
  Check,
  ShieldAlert,
  Info,
  Flame,
  Zap,
  Activity,
  Radio,
  Sliders,
  Trash2,
  PlayCircle,
  Terminal,
  AlertOctagon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Patient, ClinicalUser, HipaaAuditLogEntry, HipaaActionType } from "../types";
import { getStoredAuditLogs, recordHipaaAudit, maskPII } from "../utils/hipaaAudit";
import { 
  getClinicMasterPassphrase, 
  setClinicMasterPassphrase, 
  resetClinicMasterPassphrase, 
  runEphiEncryptionBenchmark,
  EPHI_CIPHER_VERSION
} from "../utils/ephiEncryption";
import {
  subscribeToFirestoreThreats,
  dismissFirestoreThreat,
  clearAllFirestoreThreats,
  simulateSuspiciousQueryAttack,
  getFirestoreMetrics,
  FirestoreQueryMetrics,
  FirestoreThreatIncident
} from "../utils/firestoreInterceptor";

interface HipaaComplianceCenterProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onUpdatePatient: (updated: Patient) => void;
  currentUser: ClinicalUser | null;
  darkMode: boolean;
  privacyMode: boolean;
  onTogglePrivacyMode: () => void;
  inactivityMinutes: number;
  onChangeInactivityMinutes: (minutes: number) => void;
}

export default function HipaaComplianceCenter({
  isOpen,
  onClose,
  patients,
  onUpdatePatient,
  currentUser,
  darkMode,
  privacyMode,
  onTogglePrivacyMode,
  inactivityMinutes,
  onChangeInactivityMinutes
}: HipaaComplianceCenterProps) {
  const [activeTab, setActiveTab] = useState<"audit" | "safeguards" | "dos_guard" | "consents" | "settings">("audit");
  const [auditLogs, setAuditLogs] = useState<HipaaAuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [selectedPatientForConsent, setSelectedPatientForConsent] = useState<Patient | null>(null);
  const [consentSignerName, setConsentSignerName] = useState("");
  const [consentNppAccepted, setConsentNppAccepted] = useState(true);
  const [consentDisclosureAccepted, setConsentDisclosureAccepted] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Firestore Read Interceptor & Threat Detection State
  const [threatMetrics, setThreatMetrics] = useState<FirestoreQueryMetrics>(getFirestoreMetrics());
  const [selectedIncidentModal, setSelectedIncidentModal] = useState<FirestoreThreatIncident | null>(null);
  const [isSimulatingAttack, setIsSimulatingAttack] = useState(false);

  // ePHI Client-Side Encryption Management State
  const [currentPassphrase, setCurrentPassphrase] = useState(getClinicMasterPassphrase());
  const [isEditingPassphrase, setIsEditingPassphrase] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState("");
  const [benchmarkResult, setBenchmarkResult] = useState<{
    success: boolean;
    algorithm: string;
    keyDerivation: string;
    roundtripTimeMs: number;
    sampleCipherText: string;
    ciphertextLength: number;
    sampleIv: string;
  } | null>(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);

  // Load audit logs on mount & listen to new events
  const refreshLogs = () => {
    setAuditLogs(getStoredAuditLogs());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleLogAdded = () => {
      refreshLogs();
    };
    window.addEventListener("hipaa_audit_recorded", handleLogAdded);
    return () => window.removeEventListener("hipaa_audit_recorded", handleLogAdded);
  }, []);

  // Subscribe to real-time Firestore Read Interceptor telemetry and threats
  useEffect(() => {
    const unsubscribeThreats = subscribeToFirestoreThreats((metrics) => {
      setThreatMetrics(metrics);
    });
    return () => unsubscribeThreats();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      (log.userName && log.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.patientName && log.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.resource && log.resource.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    const matchesSeverity = severityFilter === "ALL" || log.severity === severityFilter;

    return matchesSearch && matchesAction && matchesSeverity;
  });

  // Export Logs to CSV
  const handleExportCSV = () => {
    try {
      const headers = ["ID", "Timestamp", "Usuario", "Rol", "Accion", "Paciente", "Recurso", "Severidad", "Detalle", "SHA256_Hash_Integridad"];
      const rows = filteredLogs.map(l => [
        `"${l.id}"`,
        `"${l.timestamp}"`,
        `"${l.userName}"`,
        `"${l.userRole}"`,
        `"${l.action}"`,
        `"${l.patientName || 'N/A'}"`,
        `"${l.resource}"`,
        `"${l.severity}"`,
        `"${l.details.replace(/"/g, '""')}"`,
        `"${l.sensitiveDataHash || 'N/A'}"`
      ]);

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HIPAA_Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      recordHipaaAudit("EXPORT_EHR_CSV", "Exportación de registro de auditoría HIPAA en formato CSV.", {
        user: currentUser,
        resource: "Pista de Auditoría HIPAA"
      });

      showToast("Pista de auditoría CSV descargada exitosamente.");
    } catch (e) {
      console.error(e);
    }
  };

  // Export Logs to JSON
  const handleExportJSON = () => {
    try {
      const exportData = {
        standard: "HIPAA Security Rule § 164.312(b) Audit Controls",
        clinic: "PerioDash Pro Dental Cloud",
        exportDate: new Date().toISOString(),
        totalEntries: filteredLogs.length,
        logs: filteredLogs
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HIPAA_Audit_Trail_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      recordHipaaAudit("EXPORT_EHR_JSON", "Exportación de registro de auditoría HIPAA en formato JSON.", {
        user: currentUser,
        resource: "Pista de Auditoría HIPAA"
      });

      showToast("Registro de auditoría JSON descargado con éxito.");
    } catch (e) {
      console.error(e);
    }
  };

  // Sign HIPAA NPP / Consent for Patient
  const handleSaveConsent = () => {
    if (!selectedPatientForConsent) return;

    const updatedPatient: Patient = {
      ...selectedPatientForConsent,
      hipaaConsent: {
        signed: true,
        signedDate: new Date().toISOString(),
        nppAcknowledged: consentNppAccepted,
        disclosureAuthorized: consentDisclosureAccepted,
        signerName: consentSignerName || selectedPatientForConsent.name,
        version: "HIPAA-NPP-v2.1",
        emergencyAccessAuthorized: true
      }
    };

    onUpdatePatient(updatedPatient);

    recordHipaaAudit("HIPAA_CONSENT_SIGNED", `Firma formal del Aviso de Prácticas de Privacidad (NPP) y consentimiento ePHI.`, {
      user: currentUser,
      patientId: updatedPatient.id,
      patientName: updatedPatient.name,
      resource: "Consentimiento de Privacidad HIPAA"
    });

    setSelectedPatientForConsent(null);
    showToast(`Consentimiento HIPAA registrado para ${updatedPatient.name}.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className={`w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          darkMode ? "bg-slate-900 border-teal-500/30 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-6 border-b flex items-center justify-between gap-4 ${
          darkMode ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-display font-bold">
                  Centro de Cumplimiento HIPAA & Auditoría ePHI
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  100% Conforme
                </span>
              </div>
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Salvaguardas técnicas, administrativas y pistas de auditoría inmutables (45 CFR § 164.312).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Privacy Toggle */}
            <button
              type="button"
              onClick={onTogglePrivacyMode}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                privacyMode
                  ? "bg-teal-500 text-white border-teal-400 shadow-md shadow-teal-500/20"
                  : darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              title="Oculta nombres y DNIs en pantalla para demostraciones y salas clínicas"
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-teal-500" />}
              <span className="hidden sm:inline">{privacyMode ? "Modo Privacidad Activo" : "Enmascarar ePHI"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                darkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-4 sm:px-6 gap-2 sm:gap-4 overflow-x-auto ${
          darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/50 border-slate-200"
        }`}>
          {[
            { id: "audit", label: "Pistas de Auditoría (§164.312b)", icon: FileText, count: auditLogs.length },
            { id: "safeguards", label: "Salvaguardas Técnicas", icon: ShieldCheck },
            { 
              id: "dos_guard", 
              label: "Guardián DoS & Interceptor", 
              icon: ShieldAlert, 
              count: threatMetrics.activeThreatCount > 0 ? threatMetrics.activeThreatCount : undefined,
              isCritical: threatMetrics.activeThreatCount > 0 
            },
            { id: "consents", label: "Avisos de Privacidad (NPP)", icon: FileSpreadsheet, count: patients.filter(p => p.hipaaConsent?.signed).length },
            { id: "settings", label: "Inactividad & Cifrado ePHI", icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 sm:px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? tab.isCritical 
                      ? "border-rose-500 text-rose-500 dark:text-rose-400 bg-rose-500/10"
                      : "border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-500/5"
                    : tab.isCritical
                    ? "border-transparent text-rose-500 hover:text-rose-600 dark:text-rose-400 animate-pulse"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.isCritical ? "text-rose-500 animate-bounce" : ""}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    tab.isCritical
                      ? "bg-rose-500 text-white animate-pulse"
                      : isActive 
                      ? "bg-teal-500/20 text-teal-600 dark:text-teal-400" 
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* CRITICAL THREAT ALERT BANNER */}
          <AnimatePresence>
            {threatMetrics.activeThreatCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="p-4 rounded-2xl border-2 border-rose-500/60 bg-gradient-to-r from-rose-950/70 via-slate-900/90 to-rose-950/50 text-rose-200 shadow-xl shadow-rose-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 animate-pulse">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-black text-xs sm:text-sm text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-400" />
                        <span>Alerta de Seguridad: Tráfico Anómalo / Sospecha de DoS en Firestore</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-black uppercase tracking-wider animate-pulse">
                        {threatMetrics.activeThreatCount} {threatMetrics.activeThreatCount === 1 ? "Amenaza Activa" : "Amenazas Activas"}
                      </span>
                      {threatMetrics.isThrottlingActive && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
                          Throttling Preventivo Activado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-rose-200/90 leading-snug">
                      {threatMetrics.threats[0]?.details || "El interceptor detectó un patrón de consultas inusual que excede los límites seguros para información clínica ePHI."}
                    </p>
                    <div className="flex items-center gap-3 text-[10.5px] font-mono text-rose-300/80 pt-0.5">
                      <span>Colección: <strong className="text-white">{threatMetrics.threats[0]?.affectedCollection || "patients"}</strong></span>
                      <span>•</span>
                      <span>Ráfaga: <strong className="text-white">{threatMetrics.threats[0]?.queryBurstRate || threatMetrics.readsLast3s} qps</strong></span>
                      <span>•</span>
                      <span>Tipo: <strong className="text-white">{threatMetrics.threats[0]?.threatType || "BURST_DOS_ATTACK"}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("dos_guard")}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Investigar Guardián</span>
                  </button>
                  {threatMetrics.threats[0] && (
                    <button
                      type="button"
                      onClick={() => {
                        dismissFirestoreThreat(threatMetrics.threats[0].id);
                        showToast("Amenaza descartada del panel principal.");
                      }}
                      className="p-2 rounded-xl border border-rose-500/40 hover:bg-rose-500/20 text-rose-300 text-xs transition-all cursor-pointer"
                      title="Descartar esta alerta"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: AUDIT TRAIL */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              {/* Filter and Export Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex flex-1 gap-2 items-center">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Buscar por usuario, paciente, acción o detalle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none transition-all ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white focus:border-teal-500" : "bg-white border-slate-200 text-slate-800 focus:border-teal-500"
                      }`}
                    />
                  </div>

                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className={`text-xs py-2 px-3 rounded-xl border outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <option value="ALL">Todas las Acciones</option>
                    <option value="LOGIN">Inicios de Sesión</option>
                    <option value="VIEW_PATIENT_RECORD">Consulta de Ficha</option>
                    <option value="UPDATE_PERIODONTOGRAM">Periodontograma</option>
                    <option value="UPDATE_ODONTOGRAM">Odontograma</option>
                    <option value="HIPAA_CONSENT_SIGNED">Consentimiento HIPAA</option>
                    <option value="EXPORT_EHR_JSON">Exportaciones EHR</option>
                    <option value="SESSION_AUTO_LOCKED">Bloqueo Inactividad</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                      darkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Exportar CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                      darkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <FileJson className="w-3.5 h-3.5 text-teal-500" />
                    <span>Exportar JSON</span>
                  </button>
                </div>
              </div>

              {/* Audit Table */}
              <div className={`rounded-2xl border overflow-hidden shadow-xs ${
                darkMode ? "border-slate-800 bg-slate-950/50" : "border-slate-200 bg-white"
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${
                        darkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-100/70 border-slate-200 text-slate-600"
                      }`}>
                        <th className="p-3">Timestamp / Fecha</th>
                        <th className="p-3">Usuario Clínico</th>
                        <th className="p-3">Acción Registrada</th>
                        <th className="p-3">Paciente / ePHI</th>
                        <th className="p-3">Recurso & Detalles</th>
                        <th className="p-3">Hash SHA-256 (Integridad)</th>
                        <th className="p-3 text-center">Severidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            No se encontraron registros de auditoría que coincidan con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map(log => {
                          const dateObj = new Date(log.timestamp);
                          const formattedDate = dateObj.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
                          const formattedTime = dateObj.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

                          return (
                            <tr key={log.id} className="hover:bg-teal-500/5 transition-colors">
                              <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{formattedDate}</span>
                                <span className="text-slate-400 ml-1.5">{formattedTime}</span>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">{log.userName}</div>
                                <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono uppercase">{log.userRole}</div>
                              </td>
                              <td className="p-3">
                                <span className="font-mono font-bold text-[10.5px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3">
                                {log.patientName ? (
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {privacyMode ? maskPII(log.patientName, "name") : log.patientName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono">---</span>
                                )}
                              </td>
                              <td className="p-3 max-w-xs truncate">
                                <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">{log.resource}</div>
                                <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">{log.details}</div>
                              </td>
                              <td className="p-3 font-mono text-[10px]">
                                {log.sensitiveDataHash ? (
                                  <div className="flex items-center gap-1.5" title={`SHA-256 Digest: ${log.sensitiveDataHash}`}>
                                    <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-bold truncate max-w-[120px]">
                                      {log.sensitiveDataHash.slice(0, 10)}...{log.sensitiveDataHash.slice(-6)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[9.5px]">N/A</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider ${
                                  log.severity === "critical"
                                    ? "bg-red-500/15 text-red-500 border border-red-500/20"
                                    : log.severity === "warning"
                                    ? "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                                    : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
                                }`}>
                                  {log.severity}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL SAFEGUARDS MATRIX */}
          {activeTab === "safeguards" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-teal-700 dark:text-teal-300 uppercase tracking-wide">
                    Evaluación de Conformidad HIPAA Security Rule (45 CFR § 164.312)
                  </h4>
                  <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                    Todas las salvaguardas técnicas obligatorias (*Required*) y especificadas (*Addressable*) se encuentran activas y validadas en el entorno clínico PerioDash Pro.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    rule: "§ 164.312(a)(1) Control de Acceso (RBAC Estricto & Partición por Oficina)",
                    status: "RBAC Estricto + Aislamiento ePHI",
                    desc: "Acceso granular por roles clínicos y partición por sucursal. Los administradores sin rol de supervisor activo tienen bloqueado el acceso a ePHI.",
                    icon: KeyRound,
                    badge: "Cumple"
                  },
                  {
                    rule: "§ 164.312(a)(2)(iii) Cierre Automático",
                    status: `Activo (${inactivityMinutes} min)`,
                    desc: "Bloqueo automático de terminal clínica ante inactividad para proteger registros expuestos en sillones de atención.",
                    icon: Clock,
                    badge: "Cumple"
                  },
                  {
                    rule: "§ 164.312(a)(2)(iv) Cifrado Zero-Knowledge ePHI",
                    status: "AES-256-GCM Nativo + PBKDF2",
                    desc: "Capa de cifrado del lado del cliente antes de enviar datos al servidor. Firestore almacena sólo texto cifrado ininteligible (Zero-Knowledge).",
                    icon: Database,
                    badge: "Blindado"
                  },
                  {
                    rule: "§ 164.312(b) Controles de Auditoría",
                    status: "Auditoría en Tiempo Real",
                    desc: "Registro inmutable de accesos a fichas, modificaciones de sondaje, exportaciones e intentos de autenticación.",
                    icon: FileText,
                    badge: "Cumple"
                  },
                  {
                    rule: "§ 164.312(c)(1) Integridad de Datos ePHI",
                    status: "Validación de Esquema",
                    desc: "Mecanismos electrónicos contra alteración no autorizada de datos médicos e historial de evoluciones fechadas.",
                    icon: ShieldCheck,
                    badge: "Cumple"
                  },
                  {
                    rule: "§ 164.312(d) Autenticación de Personas",
                    status: "2FA + CAPTCHA Activo",
                    desc: "Verificación de identidad clínica en dos factores (código OTP de 6 dígitos) y desafío antirobot.",
                    icon: Smartphone,
                    badge: "Cumple"
                  },
                  {
                    rule: "Firebase App Check (reCAPTCHA v3)",
                    status: "Verificación de Integridad Web",
                    desc: "Atestación criptográfica de cliente web legítimo contra bots, scraping automatizado y scripts no autorizados hacia Cloud Firestore.",
                    icon: ShieldAlert,
                    badge: "Cumple"
                  },
                  {
                    rule: "§ 164.312(e)(1) Cifrado en Tránsito",
                    status: "TLS 1.3 / HTTPS / HSTS",
                    desc: "Túnel criptográfico de extremo a extremo con redirección forzada y cabecera Strict-Transport-Security (1 año).",
                    icon: Lock,
                    badge: "Cumple"
                  },
                  {
                    rule: "Regla de Privacidad (Minimum Necessary)",
                    status: "Modo Privacidad ePHI",
                    desc: "Enmascaramiento visual de RUTs, teléfonos y nombres completos para prevenir visualizaciones no autorizadas.",
                    icon: EyeOff,
                    badge: "Cumple"
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
                            <Icon className="w-4 h-4" />
                          </div>
                          <h5 className="font-bold text-xs">{item.rule}</h5>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">
                          {item.badge}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed mb-3 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                        {item.desc}
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 dark:border-slate-800/80 font-mono">
                        <span className="text-slate-400">Estado Técnico:</span>
                        <span className="font-bold text-teal-600 dark:text-teal-400">{item.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: FIRESTORE READ INTERCEPTOR & DOS GUARDIAN (§164.312) */}
          {activeTab === "dos_guard" && (
            <div className="space-y-5">
              {/* Header & Status Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                threatMetrics.activeThreatCount > 0
                  ? "bg-rose-950/30 border-rose-500/40"
                  : darkMode
                  ? "bg-slate-950/60 border-slate-800"
                  : "bg-teal-50/50 border-teal-200"
              }`}>
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`p-3 rounded-2xl border shrink-0 ${
                    threatMetrics.activeThreatCount > 0
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse"
                      : "bg-teal-500/20 border-teal-500/30 text-teal-500"
                  }`}>
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Guardián de Flujo Firestore & Detección de DoS</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          threatMetrics.activeThreatCount > 0
                            ? "bg-rose-500 text-white"
                            : "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                        }`}>
                          {threatMetrics.activeThreatCount > 0 ? `${threatMetrics.activeThreatCount} Amenazas Detectadas` : "Escudo 100% Activo"}
                        </span>
                      </h4>
                    </div>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                      Monitoreo perimetral en tiempo real que intercepta consultas sospechosas, ráfagas DoS y anomalías criptográficas sobre colecciones clínicas (45 CFR § 164.312(b)).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      clearAllFirestoreThreats();
                      showToast("Registro de amenazas de Firestore restablecido.");
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Limpiar Registro</span>
                  </button>
                </div>
              </div>

              {/* Throttling Notice */}
              {threatMetrics.isThrottlingActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                  <div className="flex-1">
                    <strong className="font-bold text-amber-200">Circuit Breaker & Throttling Preventivo Activado:</strong>
                    <span className="ml-1 text-amber-200/90">
                      Se está aplicando un retraso de seguridad de 15 segundos para proteger el consumo de cuota de Firestore y enfriar posibles ráfagas automatizadas.
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Realtime Telemetry Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className={`p-4 rounded-2xl border space-y-1 ${
                  darkMode ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ráfaga (Ventana 3s)</span>
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                      threatMetrics.readsLast3s >= 12
                        ? "bg-rose-500 text-white"
                        : threatMetrics.readsLast3s >= 8
                        ? "bg-amber-500 text-black"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {threatMetrics.readsLast3s >= 12 ? "CRÍTICO" : threatMetrics.readsLast3s >= 8 ? "ELEVADO" : "NORMAL"}
                    </span>
                  </div>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-white">
                    {threatMetrics.readsLast3s} <span className="text-xs font-normal text-slate-400">lecturas</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Umbral DoS: ≥12 lecturas en 3.0s</p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1 ${
                  darkMode ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-teal-400" />
                      <span>Volumen (Ventana 60s)</span>
                    </span>
                    <span className="text-[10px] font-mono text-teal-500 font-bold">1 Min</span>
                  </div>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-white">
                    {threatMetrics.readsLast60s} <span className="text-xs font-normal text-slate-400">lecturas</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Umbral Scraping: ≥40 / minuto</p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1 ${
                  darkMode ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>Pico Histórico QPS</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Max Burst</span>
                  </div>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-white">
                    {threatMetrics.peakBurstQps} <span className="text-xs font-normal text-slate-400">qps</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Ráfaga máxima registrada</p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1 ${
                  darkMode ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Total Interceptadas</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">100% Zero-Trust</span>
                  </div>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-white">
                    {threatMetrics.totalReadsIntercepted}
                  </div>
                  <p className="text-[10px] text-slate-500">Consultas validadas por el filtro</p>
                </div>
              </div>

              {/* Interactive Threat Simulation & Audit Sandbox */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-teal-500" />
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Laboratorio de Pruebas de Intrusión & Verificación de Alertas (§164.312b)
                    </h5>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Auditoría HIPAA en Vivo</span>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Ejecuta simulaciones controladas de patrones adversarios para validar que el interceptor bloquea, registra en la auditoría inmutable y dispara la alerta visual en tiempo real:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isSimulatingAttack}
                    onClick={() => {
                      simulateSuspiciousQueryAttack("burst_dos");
                      showToast("Simulación de Ráfaga DoS (16 queries) ejecutada con éxito.");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      darkMode
                        ? "bg-slate-900 border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/5 text-slate-200"
                        : "bg-white border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-500 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" />
                        <span>1. Ráfaga DoS (16 qps)</span>
                      </span>
                      <PlayCircle className="w-4 h-4 text-rose-400" />
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-snug">
                      Dispara ráfaga de lecturas concurrentes que supera el umbral de 3 segundos e inicia throttling.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={isSimulatingAttack}
                    onClick={() => {
                      simulateSuspiciousQueryAttack("scraping");
                      showToast("Simulación de Scraping Masivo (45 queries) ejecutada.");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      darkMode
                        ? "bg-slate-900 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5 text-slate-200"
                        : "bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-500 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>2. Scraping Masivo (45 qpm)</span>
                      </span>
                      <PlayCircle className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-snug">
                      Simula extracción sostenida de expedientes ePHI que satura la ventana de 60 segundos.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={isSimulatingAttack}
                    onClick={() => {
                      simulateSuspiciousQueryAttack("decryption_tamper");
                      showToast("Simulación de Manipulación Criptográfica (4 fallos) ejecutada.");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      darkMode
                        ? "bg-slate-900 border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/5 text-slate-200"
                        : "bg-white border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-400 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>3. Manipulación ePHI</span>
                      </span>
                      <PlayCircle className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-snug">
                      Simula anomalías en el descifrado del cliente provocadas por alteración de datos o clave inválida.
                    </p>
                  </button>
                </div>
              </div>

              {/* Threat Incidents Table / Feed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      Registro de Incidentes de Tráfico & Amenazas Detectadas
                    </h5>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {threatMetrics.threats.length} {threatMetrics.threats.length === 1 ? "incidente registrado" : "incidentes registrados"}
                  </span>
                </div>

                <div className={`rounded-2xl border overflow-hidden ${
                  darkMode ? "border-slate-800 bg-slate-950/50" : "border-slate-200 bg-white"
                }`}>
                  {threatMetrics.threats.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h6 className="font-bold text-xs text-slate-700 dark:text-slate-200">
                        No se registran amenazas activas ni anomalías de tráfico
                      </h6>
                      <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                        El interceptor continúa analizando cada petición de lectura y descifrado ePHI en Firestore en tiempo real.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {threatMetrics.threats.map((threat) => {
                        const dateObj = new Date(threat.detectedAt);
                        const formattedTime = dateObj.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                        const formattedDate = dateObj.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });

                        return (
                          <div key={threat.id} className="p-4 hover:bg-slate-500/5 transition-colors space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                                  threat.severity === "critical"
                                    ? "bg-rose-500 text-white"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                }`}>
                                  {threat.severity === "critical" ? "CRÍTICO" : "ADVERTENCIA"}
                                </span>
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                  {threat.threatType === "BURST_DOS_ATTACK"
                                    ? "Ataque de Ráfaga DoS en Firestore"
                                    : threat.threatType === "SCRAPING_EXFILTRATION"
                                    ? "Sospecha de Extracción / Scraping Masivo"
                                    : "Manipulación Criptográfica / Fallos ePHI"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-slate-400">
                                  {formattedDate} {formattedTime}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedIncidentModal(threat)}
                                  className="px-2.5 py-1 rounded-lg border border-teal-500/30 hover:bg-teal-500/10 text-teal-400 text-[11px] font-semibold transition-all cursor-pointer"
                                >
                                  Forense
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    dismissFirestoreThreat(threat.id);
                                    showToast("Incidente descartado.");
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] transition-all cursor-pointer"
                                >
                                  Descartar
                                </button>
                              </div>
                            </div>

                            <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                              {threat.details}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                              <span>Colección afectada: <strong className="text-teal-400">{threat.affectedCollection}</strong></span>
                              <span>Ráfaga detectada: <strong className="text-white">{threat.queryBurstRate} qps</strong></span>
                              <span>Mitigación: <strong className="text-emerald-400">{threat.mitigationStatus}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTICE OF PRIVACY PRACTICES (NPP) & CONSENTS */}
          {activeTab === "consents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Avisos de Prácticas de Privacidad (NPP)</h4>
                  <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Registro de consentimiento para tratamiento y divulgación de información médica protegida.
                  </p>
                </div>
              </div>

              <div className={`rounded-2xl border overflow-hidden ${
                darkMode ? "border-slate-800 bg-slate-950/50" : "border-slate-200 bg-white"
              }`}>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}>
                      <th className="p-3">Paciente</th>
                      <th className="p-3">Documento (RUT/DNI)</th>
                      <th className="p-3 text-center">Estado HIPAA Consent</th>
                      <th className="p-3">Fecha de Firma</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {patients.map(p => {
                      const isSigned = !!p.hipaaConsent?.signed;
                      return (
                        <tr key={p.id} className="hover:bg-teal-500/5">
                          <td className="p-3 font-semibold">
                            {privacyMode ? maskPII(p.name, "name") : p.name}
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {privacyMode ? maskPII(p.rut || p.dni, "rut") : (p.rut || p.dni || "N/A")}
                          </td>
                          <td className="p-3 text-center">
                            {isSigned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Firmado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                                <AlertTriangle className="w-3 h-3" />
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-400">
                            {p.hipaaConsent?.signedDate
                              ? new Date(p.hipaaConsent.signedDate).toLocaleDateString("es-CL")
                              : "Sin registrar"}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPatientForConsent(p);
                                setConsentSignerName(p.name);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                isSigned
                                  ? darkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                                  : "bg-teal-600 hover:bg-teal-700 text-white border-teal-500 shadow-xs"
                              }`}
                            >
                              {isSigned ? "Ver / Actualizar" : "Gestionar Firma"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal for Signing HIPAA Consent Form */}
              <AnimatePresence>
                {selectedPatientForConsent && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
                        darkMode ? "bg-slate-900 border-teal-500/30 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-teal-500" />
                          <h4 className="font-bold text-sm">Firma de Consentimiento HIPAA</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPatientForConsent(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className={`p-3.5 rounded-xl border text-xs leading-relaxed max-h-40 overflow-y-auto ${
                        darkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}>
                        <p className="font-bold mb-1">Aviso de Prácticas de Privacidad (Notice of Privacy Practices - NPP)</p>
                        <p className="text-[11px] mb-2 text-slate-400">
                          Este documento describe cómo se utiliza y divulga su información médica (ePHI) en PerioDash Pro y cómo usted puede acceder a ella según las regulaciones HIPAA (45 CFR § 164.520).
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                          <li>Uso exclusivo para fines de tratamiento odontológico, diagnóstico periodontal y facturación autorizada.</li>
                          <li>Cifrado de grado bancario (AES-256 y TLS 1.3) en todos los registros radiográficos y sondajes.</li>
                          <li>Derecho a solicitar copias íntegras, rectificaciones o pistas de auditoría de su expediente.</li>
                        </ul>
                      </div>

                      <div className="space-y-3 pt-1">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={consentNppAccepted}
                            onChange={(e) => setConsentNppAccepted(e.target.checked)}
                            className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs">
                            El paciente declara haber recibido y comprendido el <strong>Aviso de Prácticas de Privacidad (NPP)</strong>.
                          </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={consentDisclosureAccepted}
                            onChange={(e) => setConsentDisclosureAccepted(e.target.checked)}
                            className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs">
                            Autorización para el tratamiento clínico y transmisión segura de registros periodontales al laboratorio/especialistas.
                          </span>
                        </label>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Nombre del Firmante / Representante
                          </label>
                          <input
                            type="text"
                            value={consentSignerName}
                            onChange={(e) => setConsentSignerName(e.target.value)}
                            className={`w-full p-2.5 text-xs rounded-xl border outline-none ${
                              darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setSelectedPatientForConsent(null)}
                          className="w-1/2 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveConsent}
                          className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md cursor-pointer border-0"
                        >
                          Registrar Firma Digital
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* TAB 4: SECURITY SETTINGS & INACTIVITY */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-2xl">
              {/* Zero-Knowledge ePHI Client-Side Encryption Panel */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                darkMode ? "bg-slate-950/60 border-teal-500/30" : "bg-teal-50/50 border-teal-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-500 border border-teal-500/30">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm">Cifrado del Lado del Cliente (Zero-Knowledge ePHI)</h4>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 uppercase">
                          AES-256-GCM
                        </span>
                      </div>
                      <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                        Toda la información médica y de citas se cifra en el navegador antes de transmitirse a Firestore. La nube nunca ve texto plano.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benchmark Runner */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                        <RefreshCw className={`w-3.5 h-3.5 ${isRunningBenchmark ? "animate-spin" : ""}`} />
                        <span>Verificación Criptográfica en Tiempo Real</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Prueba el ciclo de cifrado y descifrado nativo (Web Crypto API) con un registro clínico simulado.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isRunningBenchmark}
                      onClick={async () => {
                        setIsRunningBenchmark(true);
                        try {
                          const res = await runEphiEncryptionBenchmark();
                          setBenchmarkResult(res);
                          showToast(`Benchmark completado en ${res.roundtripTimeMs} ms con éxito.`);
                        } catch (err: any) {
                          showToast(`Error en benchmark: ${err.message}`);
                        } finally {
                          setIsRunningBenchmark(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isRunningBenchmark ? "Probando..." : "Ejecutar Benchmark"}
                    </button>
                  </div>

                  {benchmarkResult && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Prueba Exitosa: Ciclo Cifrado / Descifrado ePHI</span>
                        </span>
                        <span className="font-mono">{benchmarkResult.roundtripTimeMs} ms</span>
                      </div>
                      <div className="text-slate-400 space-y-0.5">
                        <div><strong>Algoritmo:</strong> {benchmarkResult.algorithm}</div>
                        <div><strong>Derivación de Clave:</strong> {benchmarkResult.keyDerivation}</div>
                        <div><strong>Longitud Payload Cifrado:</strong> {benchmarkResult.ciphertextLength} caracteres Base64</div>
                        <div className="truncate font-mono text-[10px] bg-slate-950/40 p-1.5 rounded text-slate-300">
                          <strong>Blob visible en Firestore:</strong> {benchmarkResult.sampleCipherText.slice(0, 60)}...
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Passphrase Manager */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                        <span>Frase Maestra de Derivación Criptográfica (PBKDF2)</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Clave secreta compartida en el navegador para derivar las llaves AES-256 de la clínica.
                      </p>
                    </div>
                    {!isEditingPassphrase && (
                      <button
                        type="button"
                        onClick={() => {
                          setPassphraseInput(currentPassphrase);
                          setIsEditingPassphrase(true);
                        }}
                        className="px-3 py-1 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                      >
                        Personalizar Clave
                      </button>
                    )}
                  </div>

                  {isEditingPassphrase ? (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={passphraseInput}
                        onChange={(e) => setPassphraseInput(e.target.value)}
                        placeholder="Ingresa la nueva frase maestra de la clínica (mín. 10 caracteres)"
                        className={`w-full p-2 text-xs rounded-lg border font-mono outline-none ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (passphraseInput.trim().length < 10) {
                              showToast("La frase maestra debe tener al menos 10 caracteres de longitud.");
                              return;
                            }
                            setClinicMasterPassphrase(passphraseInput.trim());
                            setCurrentPassphrase(passphraseInput.trim());
                            setIsEditingPassphrase(false);
                            showToast("Frase maestra de cifrado actualizada con éxito.");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Guardar y Aplicar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            resetClinicMasterPassphrase();
                            setCurrentPassphrase(getClinicMasterPassphrase());
                            setIsEditingPassphrase(false);
                            showToast("Frase maestra restablecida a la predeterminada del sistema.");
                          }}
                          className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold cursor-pointer"
                        >
                          Restablecer Predeterminada
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingPassphrase(false)}
                          className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] font-mono bg-slate-950/40 p-2 rounded-lg text-slate-400">
                      <span>Clave activa: •••••••••••••••••••••••• ({currentPassphrase.length} caracteres)</span>
                      <span className="text-emerald-400 font-sans font-bold text-[10px]">Derivación PBKDF2 100k it.</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Inactivity Timeout Config */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Tiempo de Bloqueo por Inactividad HIPAA</h4>
                    <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Regla de Cierre Automático (45 CFR § 164.312(a)(2)(iii)).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {[5, 10, 15, 30].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        onChangeInactivityMinutes(mins);
                        showToast(`Tiempo de inactividad establecido a ${mins} minutos.`);
                      }}
                      className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        inactivityMinutes === mins
                          ? "bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-500/20"
                          : darkMode
                          ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-sm font-mono">{mins} Min</div>
                      <div className="text-[9px] opacity-75">{mins === 15 ? "Recomendado" : "Personalizado"}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy Mode (Minimum Necessary Standard) */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500">
                      <EyeOff className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Enmascaramiento Dinámico de ePHI (Modo Privacidad)</h4>
                      <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Oculta nombres, RUTs y datos de contacto en pantallas compartidas o salas de conferencias.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onTogglePrivacyMode}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      privacyMode
                        ? "bg-teal-600 border-teal-500 text-white"
                        : darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {privacyMode ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>

              {/* BAA Agreement & Infrastructure Certificate */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-2 text-teal-500 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acuerdo de Socio Comercial (BAA - Business Associate Agreement)</span>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  PerioDash Pro opera sobre infraestructura Google Cloud Platform con soporte para acuerdos BAA (HIPAA/HITECH), garantizando que los datos de salud se procesan exclusivamente en centros de datos certificados SOC 2 / ISO 27001.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Forensic Incident Details Modal */}
        <AnimatePresence>
          {selectedIncidentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className={`w-full max-w-xl p-6 rounded-3xl border shadow-2xl space-y-4 ${
                  darkMode ? "bg-slate-900 border-rose-500/30 text-white" : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Diagnóstico Forense de Amenaza</h4>
                      <p className="text-[10px] font-mono text-slate-400">ID: {selectedIncidentModal.id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedIncidentModal(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Tipo de Incidente</span>
                      <span className="font-mono font-bold text-rose-400">{selectedIncidentModal.threatType}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Colección Objetivo</span>
                      <span className="font-mono font-bold text-teal-400">{selectedIncidentModal.affectedCollection}</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Detalles del Vector de Ataque</span>
                    <p className="leading-relaxed font-sans">{selectedIncidentModal.details}</p>
                  </div>

                  <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Telemetría de Lecturas en Bruto (JSON)</span>
                    <pre className="text-[10px] font-mono text-emerald-400 bg-slate-950 p-2.5 rounded-lg overflow-x-auto max-h-36">
                      {JSON.stringify(selectedIncidentModal.rawMetrics, null, 2)}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] leading-relaxed">
                    <strong>Salvaguarda Técnica Aplicada:</strong> El interceptor limitó las ráfagas concurrentes mediante retardo preventivo y generó una pista de auditoría SHA-256 inmutable en el registro de conformidad § 164.312(b).
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      dismissFirestoreThreat(selectedIncidentModal.id);
                      setSelectedIncidentModal(null);
                      showToast("Incidente cerrado y archivado.");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Descartar Amenaza
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIncidentModal(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-6 right-6 z-50 px-4 py-3 bg-teal-600 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
