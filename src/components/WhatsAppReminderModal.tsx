import React, { useState, useEffect } from "react";
import { Patient, Appointment, PatientCommunication } from "../types";
import { 
  WHATSAPP_TEMPLATES, 
  WhatsAppTemplateId, 
  sendWhatsAppReminder, 
  checkTwilioConfigStatus,
  WhatsAppSendResult 
} from "../services/whatsappReminderService";
import { 
  X, 
  Send, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  MessageSquare, 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  Bot, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { copyToClipboardSafely } from "../utils/safeClipboard";
import GmailCenterModal from "./GmailCenterModal";

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  appointment?: Appointment;
  clinicName: string;
  doctorName: string;
  onCommunicationSent?: (newComm: PatientCommunication, updatedPatient: Patient) => void;
}

export default function WhatsAppReminderModal({
  isOpen,
  onClose,
  patient,
  appointment,
  clinicName,
  doctorName,
  onCommunicationSent
}: WhatsAppReminderModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<WhatsAppTemplateId>("recordatorio_estandar");
  const [messageText, setMessageText] = useState<string>("");
  const [customNote, setCustomNote] = useState<string>("");
  const [twilioStatus, setTwilioStatus] = useState<{
    twilioConfigured: boolean;
    fromNumber: string;
    accountSidMasked?: string | null;
    provider: string;
  }>({ twilioConfigured: false, fromNumber: "+14155238886", provider: "wa_me_direct" });

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendResult, setSendResult] = useState<WhatsAppSendResult | null>(null);
  const [showGmailModal, setShowGmailModal] = useState(false);

  // Load Twilio config on mount
  useEffect(() => {
    let mounted = true;
    checkTwilioConfigStatus().then(status => {
      if (mounted) {
        setTwilioStatus(status);
        setLoadingConfig(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Update rendered text whenever template, patient, appointment or note changes
  useEffect(() => {
    const template = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
    const generated = template.renderText({
      patient,
      appointment,
      clinicName: clinicName || "PerioClinic Pro",
      doctorName: doctorName || "Cirujano Dentista",
      customNote
    });
    setMessageText(generated);
  }, [selectedTemplateId, patient, appointment, clinicName, doctorName, customNote]);

  if (!isOpen) return null;

  const rawPhone = (patient.phone || "").replace(/[^0-9+]/g, "");
  const hasValidPhone = rawPhone.length >= 8;

  const handleCopy = async () => {
    await copyToClipboardSafely(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDirectWaMe = () => {
    if (!hasValidPhone) {
      alert("El paciente no tiene un número telefónico válido registrado.");
      return;
    }
    const cleanDigits = rawPhone.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank");

    saveCommunicationRecord("sent", "wa_me_direct");
  };

  const handleSendTwilio = async () => {
    if (!hasValidPhone) {
      alert("El paciente no tiene un número telefónico válido registrado.");
      return;
    }

    setIsSending(true);
    setSendResult(null);

    const result = await sendWhatsAppReminder({
      patient,
      appointment,
      message: messageText,
      templateType: selectedTemplateId,
      forceDirectLink: false
    });

    setIsSending(false);
    setSendResult(result);

    if (result.success) {
      saveCommunicationRecord("sent", result.provider);
      if (result.method === "wa_me_ready" && !twilioStatus.twilioConfigured) {
        // Automatically open wa.me if twilio was not present
        window.open(result.waMeUrl, "_blank");
      }
    }
  };

  const saveCommunicationRecord = (status: PatientCommunication["status"], providerName: string) => {
    const newComm: PatientCommunication = {
      id: `comm-wa-${Date.now()}`,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      type: "whatsapp",
      template: selectedTemplateId === "recordatorio_estandar" ? "recordatorio_cita" : "custom",
      recipient: patient.phone,
      message: messageText,
      status
    };

    const updatedPatient: Patient = {
      ...patient,
      communications: [newComm, ...(patient.communications || [])]
    };

    if (onCommunicationSent) {
      onCommunicationSent(newComm, updatedPatient);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col my-6 max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-900/10 via-teal-900/10 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                    Servicio de Recordatorios WhatsApp
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Twilio & Direct wa.me
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Paciente: <strong className="text-slate-700 dark:text-slate-300">{patient.name}</strong></span>
                  <span>•</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{patient.phone || "Sin teléfono"}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Template Selection & Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Service Status Pill */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${twilioStatus.twilioConfigured ? "bg-emerald-500" : "bg-teal-500"}`} />
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {twilioStatus.twilioConfigured ? "API Twilio Conectada" : "Modo Enlace Directo (wa.me)"}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {twilioStatus.twilioConfigured 
                        ? `Remitente: ${twilioStatus.fromNumber} (Envío automatizado en 1 clic)` 
                        : "Abre el chat oficial en WhatsApp Web o App móvil con el mensaje precargado"}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    {twilioStatus.twilioConfigured ? "REST API" : "wa.me Ready"}
                  </span>
                </div>
              </div>

              {/* Template Selector Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                  1. Seleccionar Plantilla Clínica
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {WHATSAPP_TEMPLATES.map((tmpl) => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-xs ring-2 ring-emerald-500/20"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${tmpl.badgeColor}`}>
                              {tmpl.badge}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                          </div>
                          <p className="text-xs font-bold font-display">{tmpl.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {tmpl.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Appointment Context Info */}
              {appointment ? (
                <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/60 text-xs text-teal-950 dark:text-teal-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-teal-800 dark:text-teal-300">
                      <Calendar className="w-3.5 h-3.5" /> Cita Asociada
                    </span>
                    <span className="font-mono font-bold bg-teal-200/60 dark:bg-teal-900/80 px-2 py-0.5 rounded text-[10px]">
                      {appointment.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-teal-900 dark:text-teal-300">
                    <p>🗓️ <strong>Fecha:</strong> {appointment.date}</p>
                    <p>⏰ <strong>Hora:</strong> {appointment.time} hrs</p>
                    <p className="col-span-2">🩺 <strong>Tratamiento:</strong> {appointment.treatment}</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Sin cita específica seleccionada; usando datos generales de ficha clínica.</span>
                </div>
              )}

              {/* Custom Note Injection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Agregar Nota Personalizada o Indicación Extra (Opcional):
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Ej: Recuerda traer tu radiografía panorámica..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Editable Message Preview Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Contenido del Mensaje (Editable):
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {messageText.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full text-xs font-sans p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none leading-relaxed"
                />
              </div>

            </div>

            {/* Right Column: WhatsApp Live Phone Mockup Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                2. Vista Previa en WhatsApp
              </label>

              {/* WhatsApp Chat Simulator Screen */}
              <div className="flex-1 bg-[#efeae2] dark:bg-[#0b141a] rounded-3xl p-4 border border-slate-300 dark:border-slate-800 flex flex-col justify-between shadow-inner min-h-[380px] relative overflow-hidden">
                {/* Chat Top Bar */}
                <div className="bg-[#005d4b] dark:bg-[#202c33] -mx-4 -mt-4 p-3 flex items-center justify-between text-white shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center font-bold text-xs">
                      🦷
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{clinicName || "PerioClinic Pro"}</p>
                      <p className="text-[10px] text-emerald-200">En línea (Cuenta Empresa)</p>
                    </div>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </div>

                {/* Message Bubble Container */}
                <div className="py-4 space-y-3 overflow-y-auto max-h-[300px]">
                  {/* Encrypted Notice */}
                  <div className="text-center">
                    <span className="inline-block px-2.5 py-1 bg-amber-100 dark:bg-slate-800 text-amber-900 dark:text-amber-200/80 rounded-lg text-[9px] font-medium shadow-xs">
                      🔒 Los mensajes están cifrados de extremo a extremo conforme a HIPAA.
                    </span>
                  </div>

                  {/* Outgoing WhatsApp Bubble */}
                  <div className="flex justify-end">
                    <div className="bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 p-3 rounded-2xl rounded-tr-xs shadow-xs max-w-[90%] text-xs leading-relaxed whitespace-pre-wrap font-sans relative">
                      {messageText}
                      <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-slate-500 dark:text-emerald-200 font-mono">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <CheckCircle2 className="w-3 h-3 text-sky-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Result Feedback Banner */}
                {sendResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    sendResult.success 
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300" 
                      : "bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300"
                  }`}>
                    {sendResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{sendResult.message}</p>
                      {sendResult.error && (
                        <p className="text-[10px] mt-0.5 opacity-90">{sendResult.error}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Phone verification warning */}
                {!hasValidPhone && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Por favor agrega un número de teléfono válido al paciente para enviar el mensaje.</span>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "¡Copiado al Portapapeles!" : "Copiar Texto"}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowGmailModal(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                title="Enviar este recordatorio o mensaje clínico mediante correo oficial de Gmail"
              >
                <Mail className="w-4 h-4" />
                <span>Enviar por Gmail</span>
              </button>

              <button
                type="button"
                onClick={handleDirectWaMe}
                disabled={!hasValidPhone}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                title="Abre WhatsApp Web o la App directamente con el mensaje pre-cargado"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir Chat (wa.me)</span>
              </button>

              <button
                type="button"
                onClick={handleSendTwilio}
                disabled={!hasValidPhone || isSending}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                title={twilioStatus.twilioConfigured ? "Enviar de forma transparente por Twilio API" : "Generar despacho de recordatorio"}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{twilioStatus.twilioConfigured ? "Enviar por Twilio API" : "Enviar Recordatorio"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </motion.div>

        {showGmailModal && (
          <GmailCenterModal
            isOpen={showGmailModal}
            onClose={() => setShowGmailModal(false)}
            darkMode={document.documentElement.classList.contains('dark')}
            patients={[patient]}
            currentUser={{ id: '1', name: doctorName, role: 'periodoncista', email: 'doctor@perio.com' } as any}
            initialPatient={patient}
            initialTemplate="appointmentReminder"
            initialSubject={`Recordatorio de Cita - ${clinicName}`}
            initialBody={messageText}
          />
        )}
      </div>
    </AnimatePresence>
  );
}
