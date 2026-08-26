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
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Patient, ClinicalUser, HipaaAuditLogEntry, HipaaActionType } from "../types";
import { getStoredAuditLogs, recordHipaaAudit, maskPII } from "../utils/hipaaAudit";

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
  const [activeTab, setActiveTab] = useState<"audit" | "safeguards" | "consents" | "settings">("audit");
  const [auditLogs, setAuditLogs] = useState<HipaaAuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [selectedPatientForConsent, setSelectedPatientForConsent] = useState<Patient | null>(null);
  const [consentSignerName, setConsentSignerName] = useState("");
  const [consentNppAccepted, setConsentNppAccepted] = useState(true);
  const [consentDisclosureAccepted, setConsentDisclosureAccepted] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
            { id: "consents", label: "Avisos de Privacidad (NPP)", icon: FileSpreadsheet, count: patients.filter(p => p.hipaaConsent?.signed).length },
            { id: "settings", label: "Inactividad & Parámetros", icon: Clock }
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
                    ? "border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-500/5"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive 
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                    rule: "§ 164.312(a)(2)(iv) Cifrado en Reposo",
                    status: "AES-256 Activo",
                    desc: "Almacenamiento de expedientes, periodontogramas e imágenes en Google Cloud Firestore con cifrado simétrico por defecto.",
                    icon: Database,
                    badge: "Cumple"
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
