import React, { useState, useEffect } from "react";
import { Appointment, Patient, PatientCommunication } from "../types";
import { 
  WHATSAPP_TEMPLATES, 
  WhatsAppTemplateId, 
  sendWhatsAppReminder, 
  checkTwilioConfigStatus,
  createFallbackPatient
} from "../services/whatsappReminderService";
import { 
  X, 
  Send, 
  MessageSquare, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  ExternalLink,
  Filter,
  Check,
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WhatsAppBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  patients: Patient[];
  clinicName: string;
  doctorName: string;
  onCommunicationsBatchSent?: (updatedPatients: Patient[]) => void;
}

interface BatchItem {
  appointment: Appointment;
  patient: Patient;
  selected: boolean;
  hasPhone: boolean;
  status: "idle" | "sending" | "sent" | "failed";
  statusMessage?: string;
  waMeUrl?: string;
}

export default function WhatsAppBatchModal({
  isOpen,
  onClose,
  appointments,
  patients,
  clinicName,
  doctorName,
  onCommunicationsBatchSent
}: WhatsAppBatchModalProps) {
  const [dateFilter, setDateFilter] = useState<"today" | "tomorrow" | "all">("today");
  const [selectedTemplateId, setSelectedTemplateId] = useState<WhatsAppTemplateId>("recordatorio_estandar");
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [twilioStatus, setTwilioStatus] = useState({ twilioConfigured: false, fromNumber: "+14155238886" });

  useEffect(() => {
    checkTwilioConfigStatus().then(st => setTwilioStatus(st));
  }, []);

  // Compute targets based on appointments & date filter
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const filteredAppointments = appointments.filter(app => {
      if (app.status === "Cancelled" || app.status === "Completed") return false;
      if (dateFilter === "today") return app.date === todayStr;
      if (dateFilter === "tomorrow") return app.date === tomorrowStr;
      return true; // "all"
    });

    const batchList: BatchItem[] = filteredAppointments.map(app => {
      const patient = patients.find(p => p.id === app.patientId) || 
        createFallbackPatient(app.patientId || `pat-${app.id}`, app.patientName, "");

      const rawPhone = (patient.phone || "").replace(/[^0-9]/g, "");
      const hasPhone = rawPhone.length >= 8;

      return {
        appointment: app,
        patient,
        selected: hasPhone,
        hasPhone,
        status: "idle"
      };
    });

    setItems(batchList);
  }, [appointments, patients, dateFilter]);

  if (!isOpen) return null;

  const totalSelected = items.filter(i => i.selected).length;
  const totalSent = items.filter(i => i.status === "sent").length;

  const toggleSelectAll = () => {
    const areAllSelected = items.every(i => !i.hasPhone || i.selected);
    setItems(prev => prev.map(i => ({
      ...i,
      selected: i.hasPhone ? !areAllSelected : false
    })));
  };

  const toggleItem = (appId: string) => {
    setItems(prev => prev.map(i => {
      if (i.appointment.id === appId && i.hasPhone) {
        return { ...i, selected: !i.selected };
      }
      return i;
    }));
  };

  const handleStartBatch = async () => {
    const targets = items.filter(i => i.selected && i.hasPhone);
    if (targets.length === 0) {
      alert("No hay pacientes seleccionados con número de teléfono válido.");
      return;
    }

    setIsProcessing(true);
    setProgressIndex(0);

    const template = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
    const updatedPatientsMap = new Map<string, Patient>();

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (!item.selected || !item.hasPhone) continue;

      setProgressIndex(idx + 1);

      // Set item to sending
      setItems(curr => curr.map((it, i) => i === idx ? { ...it, status: "sending" } : it));

      const message = template.renderText({
        patient: item.patient,
        appointment: item.appointment,
        clinicName: clinicName || "PerioClinic Pro",
        doctorName: doctorName || "Cirujano Dentista"
      });

      const res = await sendWhatsAppReminder({
        patient: item.patient,
        appointment: item.appointment,
        message,
        templateType: selectedTemplateId,
        forceDirectLink: false
      });

      // Update patient communications record in memory
      const newComm: PatientCommunication = {
        id: `batch-${Date.now()}-${idx}`,
        date: new Date().toISOString().replace("T", " ").slice(0, 16),
        type: "whatsapp",
        template: "recordatorio_cita",
        recipient: item.patient.phone,
        message,
        status: res.success ? "sent" : "failed"
      };

      const existingPat = updatedPatientsMap.get(item.patient.id) || item.patient;
      const updatedPat = {
        ...existingPat,
        communications: [newComm, ...(existingPat.communications || [])]
      };
      updatedPatientsMap.set(item.patient.id, updatedPat);

      // Mark result on item
      setItems(curr => curr.map((it, i) => i === idx ? {
        ...it,
        status: res.success ? "sent" : "failed",
        statusMessage: res.message,
        waMeUrl: res.waMeUrl
      } : it));

      // Small delay between requests to be gentle with rate limits
      await new Promise(r => setTimeout(r, 450));
    }

    setIsProcessing(false);

    if (onCommunicationsBatchSent && updatedPatientsMap.size > 0) {
      onCommunicationsBatchSent(Array.from(updatedPatientsMap.values()));
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
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-950/20 via-teal-950/20 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  Despacho Masivo de Recordatorios WhatsApp
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Envía recordatorios automáticos y sincronizados a los pacientes con citas agendadas.
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

          {/* Config Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setDateFilter("today")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dateFilter === "today" ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Citas de Hoy
              </button>
              <button
                onClick={() => setDateFilter("tomorrow")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dateFilter === "tomorrow" ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Citas de Mañana
              </button>
              <button
                onClick={() => setDateFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dateFilter === "all" ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Todas las Activas
              </button>
            </div>

            {/* Template selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-400">Plantilla:</span>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value as WhatsAppTemplateId)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none"
              >
                {WHATSAPP_TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table / Queue */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
            
            {/* Quick summary metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Citas</p>
                <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">{items.length}</p>
              </div>
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-center">
                <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Seleccionados</p>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{totalSelected}</p>
              </div>
              <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 rounded-2xl border border-teal-200 dark:border-teal-900 text-center">
                <p className="text-[10px] text-teal-600 uppercase font-bold tracking-wider">Despachados</p>
                <p className="text-lg font-bold font-mono text-teal-600 dark:text-teal-400">{totalSent}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Servicio Activo</p>
                <p className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 mt-1">
                  {twilioStatus.twilioConfigured ? "Twilio API" : "wa.me Links"}
                </p>
              </div>
            </div>

            {/* List */}
            {items.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-bold text-sm">No hay citas agendadas para el período seleccionado.</p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && items.every(i => !i.hasPhone || i.selected)}
                      onChange={toggleSelectAll}
                      className="rounded text-teal-600 cursor-pointer"
                    />
                    <span>Paciente / Procedimiento</span>
                  </div>
                  <span>Horario & Estado de Envío</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[340px] overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.appointment.id}
                      className={`px-4 py-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                        item.selected ? "bg-emerald-50/20 dark:bg-emerald-950/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          disabled={!item.hasPhone || isProcessing}
                          onChange={() => toggleItem(item.appointment.id)}
                          className="rounded text-teal-600 cursor-pointer disabled:opacity-30"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.patient.name}
                            </span>
                            {item.hasPhone ? (
                              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                                {item.patient.phone}
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                                Sin Teléfono
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.appointment.treatment}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.appointment.date} {item.appointment.time}
                          </span>
                        </div>

                        {/* Status badge */}
                        <div>
                          {item.status === "idle" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Pendiente
                            </span>
                          )}
                          {item.status === "sending" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Enviando
                            </span>
                          )}
                          {item.status === "sent" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Enviado
                            </span>
                          )}
                          {item.status === "failed" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </div>

                        {/* Direct wa.me individual shortcut */}
                        {item.hasPhone && (
                          <button
                            type="button"
                            onClick={() => {
                              const template = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
                              const msg = template.renderText({
                                patient: item.patient,
                                appointment: item.appointment,
                                clinicName: clinicName || "PerioClinic Pro",
                                doctorName: doctorName || "Cirujano Dentista"
                              });
                              const digits = item.patient.phone.replace(/[^0-9]/g, "");
                              window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, "_blank");
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-all cursor-pointer"
                            title="Abrir chat directo en WhatsApp"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {isProcessing ? `Procesando envío masivo (${progressIndex}/${totalSelected})...` : `${totalSelected} citas seleccionadas para recordatorio.`}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleStartBatch}
                disabled={isProcessing || totalSelected === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando Lote...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Iniciar Despacho ({totalSelected})</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
