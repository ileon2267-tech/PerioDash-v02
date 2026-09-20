import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Inbox,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  User,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Paperclip,
  Check,
  LogOut,
  ShieldCheck,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { safeStorage } from "../utils/safeStorage";
import { Patient, ClinicalUser } from "../types";
import {
  isGmailConnected,
  initGmailAuth,
  disconnectGmail,
  getGmailProfile,
  fetchGmailMessages,
  sendGmailMessage,
  GmailMessage,
  GmailUserProfile,
  CLINICAL_EMAIL_TEMPLATES
} from "../services/gmailService";

interface GmailCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  patients: Patient[];
  currentUser: ClinicalUser | null;
  initialPatient?: Patient | null;
  initialTemplate?: "custom" | "prescription" | "appointmentReminder" | "postOp" | "quote";
  initialSubject?: string;
  initialBody?: string;
}

export default function GmailCenterModal({
  isOpen,
  onClose,
  darkMode,
  patients,
  currentUser,
  initialPatient,
  initialTemplate = "custom",
  initialSubject,
  initialBody,
}: GmailCenterModalProps) {
  const [isConnected, setIsConnected] = useState<boolean>(isGmailConnected());
  const [userProfile, setUserProfile] = useState<GmailUserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"compose" | "inbox">("compose");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Compose State
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatient?.id || "");
  const [toEmail, setToEmail] = useState<string>(initialPatient?.email || "");
  const [subject, setSubject] = useState<string>(initialSubject || "");
  const [bodyText, setBodyText] = useState<string>(initialBody || "");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialTemplate);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Inbox State
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);

  // Sync initial patient if modal opens
  useEffect(() => {
    if (initialPatient) {
      setSelectedPatientId(initialPatient.id);
      if (initialPatient.email) setToEmail(initialPatient.email);
    }
    if (initialSubject) setSubject(initialSubject);
    if (initialBody) setBodyText(initialBody);
    if (initialTemplate) setSelectedTemplate(initialTemplate);
  }, [initialPatient, initialSubject, initialBody, initialTemplate, isOpen]);

  // Check connection and load profile on open
  useEffect(() => {
    if (isOpen) {
      const connected = isGmailConnected();
      setIsConnected(connected);
      if (connected) {
        loadProfile();
        if (activeTab === "inbox") {
          loadMessages();
        }
      }
    }
  }, [isOpen, activeTab]);

  const loadProfile = async () => {
    try {
      const profile = await getGmailProfile();
      if (profile) setUserProfile(profile);
    } catch {
      // ignore
    }
  };

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      await initGmailAuth(true);
      setIsConnected(true);
      await loadProfile();
      setStatusMessage({ type: "success", text: "Conexión con Gmail establecida exitosamente." });
      if (activeTab === "inbox") loadMessages();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "No se pudo conectar con Gmail. Asegúrese de otorgar los permisos requeridos.",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGmail();
    setIsConnected(false);
    setUserProfile(null);
    setMessages([]);
    setStatusMessage({ type: "success", text: "Cuenta de Gmail desconectada de PerioDash." });
  };

  const loadMessages = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const msgs = await fetchGmailMessages(searchQuery, 20);
      setMessages(msgs);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Error al cargar correos de Gmail." });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientSelect = (patId: string) => {
    setSelectedPatientId(patId);
    const pat = patients.find(p => p.id === patId);
    if (pat) {
      if (pat.email) setToEmail(pat.email);
      applyTemplate(selectedTemplate, pat);
    }
  };

  const applyTemplate = (templateKey: string, pat?: Patient) => {
    setSelectedTemplate(templateKey);
    const activePat = pat || patients.find(p => p.id === selectedPatientId) || initialPatient;
    const patName = activePat?.name || "Paciente";
    const docName = currentUser?.name || "Dr. Alejandro Soto";
    const clinicName = "Clínica Odontológica PerioDash";

    if (templateKey === "appointmentReminder") {
      const t = CLINICAL_EMAIL_TEMPLATES.appointmentReminder(
        patName,
        "Mañana a las 10:00 hrs",
        "10:00 AM",
        docName,
        clinicName,
        "Control y Mantenimiento Periodontal"
      );
      setSubject(t.subject);
      setBodyText(t.bodyText);
    } else if (templateKey === "postOp") {
      const t = CLINICAL_EMAIL_TEMPLATES.postOpInstructions(
        patName,
        "Cirugía Periodontal / Raspado y Alisado Radicular",
        docName,
        clinicName
      );
      setSubject(t.subject);
      setBodyText(t.bodyText);
    } else if (templateKey === "quote") {
      const t = CLINICAL_EMAIL_TEMPLATES.treatmentQuote(
        patName,
        docName,
        clinicName,
        "$145.000 CLP",
        "• Destartraje supragingival completo\n• Pulido coronario con pasta profiláctica\n• Sesión de instrucción en técnica de higiene y uso de cepillos interproximales"
      );
      setSubject(t.subject);
      setBodyText(t.bodyText);
    } else if (templateKey === "prescription") {
      const t = CLINICAL_EMAIL_TEMPLATES.prescription(
        patName,
        docName,
        clinicName,
        "1. Amoxicilina 500mg - 1 cápsula cada 8 horas por 7 días.\n2. Ibuprofeno 400mg - 1 comprimido cada 8 horas en caso de dolor por 3 días.\n3. Clorhexidina 0.12% - Enjuagues de 15ml por 30 segundos cada 12 horas por 14 días.",
        "Tomar los antibióticos con las comidas. No consumir alcohol durante el tratamiento."
      );
      setSubject(t.subject);
      setBodyText(t.bodyText);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail) {
      setStatusMessage({ type: "error", text: "Por favor indique la dirección de correo del destinatario." });
      return;
    }
    if (!subject.trim()) {
      setStatusMessage({ type: "error", text: "Por favor escriba un asunto para el correo." });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const activePat = patients.find(p => p.id === selectedPatientId) || initialPatient;
      const patName = activePat?.name || "Paciente";
      const docName = currentUser?.name || "Dr. Alejandro Soto";
      const clinicName = "Clínica PerioDash";

      let htmlContent: string | undefined;
      if (selectedTemplate === "prescription") {
        htmlContent = CLINICAL_EMAIL_TEMPLATES.prescription(
          patName,
          docName,
          clinicName,
          bodyText,
          "Seguir las dosis e indicaciones especificadas por su odontólogo."
        ).bodyHtml;
      } else if (selectedTemplate === "appointmentReminder") {
        htmlContent = CLINICAL_EMAIL_TEMPLATES.appointmentReminder(
          patName,
          "Próxima cita agendada",
          "Horario clínico",
          docName,
          clinicName,
          subject
        ).bodyHtml;
      } else if (selectedTemplate === "postOp") {
        htmlContent = CLINICAL_EMAIL_TEMPLATES.postOpInstructions(
          patName,
          "Tratamiento Odontológico",
          docName,
          clinicName
        ).bodyHtml;
      } else if (selectedTemplate === "quote") {
        htmlContent = CLINICAL_EMAIL_TEMPLATES.treatmentQuote(
          patName,
          docName,
          clinicName,
          "Ver detalle adjunto",
          bodyText
        ).bodyHtml;
      } else {
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 16px; border-radius: 8px; color: #ffffff; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 19px;">${clinicName}</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Comunicación Clínica Directa</p>
            </div>
            <div style="font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-line;">${bodyText}</div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
              Enviado por ${docName} desde la plataforma clínica PerioDash.
            </p>
          </div>
        `;
      }

      await sendGmailMessage(toEmail, subject, bodyText, htmlContent);

      setStatusMessage({
        type: "success",
        text: `Correo enviado exitosamente a ${toEmail} desde su cuenta de Gmail.`,
      });

    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Error al enviar el correo a través de Gmail.",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden my-auto ${
            darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shadow-inner">
                <Mail className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base sm:text-lg">Centro de Mensajería Gmail</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-400/20 text-teal-200 border border-teal-300/30">
                    OAuth 2.0 Verificado
                  </span>
                </div>
                <p className="text-xs text-teal-100/80">
                  Comunicaciones clínicas con pacientes, recetas y recordatorios oficiales
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub-bar */}
          <div className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
            darkMode ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("compose")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "compose"
                    ? "bg-teal-600 text-white shadow-xs"
                    : darkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-600"
                }`}
              >
                <Send className="w-3.5 h-3.5" /> Redactar Correo
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("inbox");
                  if (isConnected) loadMessages();
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "inbox"
                    ? "bg-teal-600 text-white shadow-xs"
                    : darkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-600"
                }`}
              >
                <Inbox className="w-3.5 h-3.5" /> Bandeja de Entrada
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Conectado: <strong>{userProfile?.emailAddress || safeStorage.getItem("perio_gmail_user_email") || "Gmail Activo"}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="p-1.5 text-xs text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Desconectar cuenta de Gmail"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGmail}
                  disabled={isConnecting}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {isConnecting ? "Conectando..." : "Vincular mi Cuenta Gmail"}
                </button>
              )}
            </div>
          </div>

          {/* Feedback Status Alert */}
          {statusMessage && (
            <div className={`mx-6 mt-4 p-3 rounded-2xl text-xs flex items-center justify-between border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300"
            }`}>
              <div className="flex items-center gap-2">
                {statusMessage.type === "success" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main Content Area */}
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === "compose" ? (
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" /> Plantillas Clínicas:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyTemplate("prescription")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedTemplate === "prescription"
                        ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    💊 Receta Digital
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate("appointmentReminder")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedTemplate === "appointmentReminder"
                        ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    📅 Recordatorio de Cita
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate("postOp")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedTemplate === "postOp"
                        ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    🩹 Cuidados Post-Op
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate("quote")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedTemplate === "quote"
                        ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    💰 Presupuesto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplate("custom");
                      setSubject("");
                      setBodyText("");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedTemplate === "custom"
                        ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    ✍️ Personalizado
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Paciente de la Ficha (Opcional):
                    </label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => handlePatientSelect(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs outline-hidden ${
                        darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="">-- Seleccionar paciente registrado --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.email ? `(${p.email})` : "(Sin correo registrado)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Destinatario (Email): <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="paciente@correo.com"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs outline-hidden ${
                        darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Asunto del Mensaje: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Receta Odontológica y Plan de Cuidados"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold outline-hidden ${
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                      Contenido / Instrucciones Clínicas:
                    </label>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> {previewMode ? "Editar texto" : "Vista previa HTML"}
                    </button>
                  </div>

                  {previewMode ? (
                    <div className={`p-4 rounded-2xl border text-xs min-h-[160px] max-h-[300px] overflow-y-auto ${
                      darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="font-bold text-teal-600 mb-2">Asunto: {subject || "(Sin asunto)"}</div>
                      <div className="whitespace-pre-line text-slate-700 dark:text-slate-300">{bodyText}</div>
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                        Se enviará con membrete profesional de la clínica y firma de {currentUser?.name || "Dr. Alejandro Soto"}.
                      </div>
                    </div>
                  ) : (
                    <textarea
                      rows={7}
                      required
                      placeholder="Escriba aquí el contenido del correo para el paciente..."
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      className={`w-full p-3 rounded-2xl border text-xs outline-hidden leading-relaxed font-mono ${
                        darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    />
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Cifrado TLS 1.3 vía Gmail API oficial con respaldo de auditoría clínica</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 sm:flex-none cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSending}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enviando por Gmail...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar Correo Oficial</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por paciente, asunto o correo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") loadMessages();
                      }}
                      className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs outline-hidden ${
                        darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={loadMessages}
                    disabled={isLoading}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    <span>Actualizar</span>
                  </button>
                </div>

                {isLoading ? (
                  <div className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-500 mb-2" />
                    <p className="text-xs">Consultando bandeja de entrada de Gmail...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <Inbox className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-sm font-semibold">No se encontraron correos en esta búsqueda</p>
                    <p className="text-xs text-slate-400 mt-1">Los correos recibidos y enviados aparecerán aquí.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-2 max-h-[460px] overflow-y-auto pr-1">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => setSelectedMessage(msg)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                            selectedMessage?.id === msg.id
                              ? "bg-teal-500/10 border-teal-500 shadow-xs"
                              : msg.isUnread
                              ? darkMode ? "bg-slate-800/90 border-teal-500/40" : "bg-teal-50/50 border-teal-200"
                              : darkMode ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-semibold truncate max-w-[120px]">
                              {msg.from?.split("<")[0] || "Desconocido"}
                            </span>
                            <span>{msg.date ? new Date(msg.date).toLocaleDateString() : ""}</span>
                          </div>
                          <h4 className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
                            {msg.subject || "(Sin asunto)"}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {msg.snippet}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className={`md:col-span-2 p-5 rounded-2xl border flex flex-col justify-between max-h-[460px] overflow-y-auto ${
                      darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      {selectedMessage ? (
                        <div className="space-y-4">
                          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                              {selectedMessage.subject}
                            </h3>
                            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mt-2 gap-2">
                              <div>
                                <strong>De:</strong> {selectedMessage.from}
                              </div>
                              <div>
                                <strong>Fecha:</strong> {selectedMessage.date}
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              <strong>Para:</strong> {selectedMessage.to}
                            </div>
                          </div>

                          <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                            {selectedMessage.bodyHtml ? (
                              <div
                                dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
                                className="gmail-message-body bg-white text-slate-900 p-4 rounded-xl shadow-xs border border-slate-200 overflow-x-auto"
                              />
                            ) : (
                              <div className="whitespace-pre-line font-sans p-2">
                                {selectedMessage.bodyText || selectedMessage.snippet}
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">ID: {selectedMessage.id}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab("compose");
                                setToEmail(selectedMessage.from?.match(/<([^>]+)>/)?.[1] || selectedMessage.from || "");
                                setSubject(`Re: ${selectedMessage.subject}`);
                                setBodyText(`\n\n--- Mensaje original ---\n${selectedMessage.snippet}`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" /> Responder
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-24 text-center text-slate-400 my-auto">
                          <Mail className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                          <p className="text-xs font-medium">Seleccione un correo de la lista para ver su contenido</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
