import React, { useState, useEffect } from "react";
import { Appointment, Patient } from "../types";
import { matchPatientByRut } from "../utils/rutUtils";
import { User } from "firebase/auth";
import { 
  signInWithGoogleCalendar, 
  initCalendarAuth, 
  getCalendarAccessToken, 
  disconnectGoogleCalendar, 
  fetchCalendarEvents, 
  createGoogleCalendarEvent, 
  deleteGoogleCalendarEvent, 
  convertAppointmentToCalendarDates,
  GoogleCalendarEvent 
} from "../services/googleCalendar";
import { ConfirmCalendarActionModal, GoogleImportModal } from "./GoogleCalendarSyncModal";
import WhatsAppReminderModal from "./WhatsAppReminderModal";
import WhatsAppBatchModal from "./WhatsAppBatchModal";
import { twilioService } from "../services/twilioService";
import { createFallbackPatient } from "../services/whatsappReminderService";
import { maskPII } from "../utils/hipaaAudit";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Edit, 
  Search, 
  MessageSquare,
  Coffee,
  X,
  Phone,
  Filter,
  CheckSquare,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Smile,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Send,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const GoogleGLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const getTreatmentStyle = (treatment: string) => {
  const t = treatment.toLowerCase();
  if (t.includes("sondaje") || t.includes("periodon") || t.includes("raspado") || t.includes("curetaje") || t.includes("rar")) {
    return {
      bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      label: "Periodoncia",
      dot: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400"
    };
  }
  if (t.includes("limpieza") || t.includes("profilaxis") || t.includes("pulido") || t.includes("destartraje")) {
    return {
      bg: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
      label: "Mantenimiento",
      dot: "bg-sky-500",
      textColor: "text-sky-600 dark:text-sky-400"
    };
  }
  if (t.includes("ortodoncia") || t.includes("bracket") || t.includes("guardia") || t.includes("oclusal")) {
    return {
      bg: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
      label: "Ortodoncia",
      dot: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400"
    };
  }
  if (t.includes("implante") || t.includes("cirugía") || t.includes("injerto") || t.includes("imp")) {
    return {
      bg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
      label: "Cirugía",
      dot: "bg-rose-500",
      textColor: "text-rose-600 dark:text-rose-400"
    };
  }
  if (t.includes("endodoncia") || t.includes("conducto")) {
    return {
      bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      label: "Endodoncia",
      dot: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400"
    };
  }
  if (t.includes("caries") || t.includes("obturación") || t.includes("resina") || t.includes("restauraci")) {
    return {
      bg: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
      label: "Operatoria",
      dot: "bg-pink-500",
      textColor: "text-pink-600 dark:text-pink-400"
    };
  }
  return {
    bg: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
    label: "Gral / Diagnóstico",
    dot: "bg-teal-500",
    textColor: "text-teal-600 dark:text-teal-400"
  };
};

interface AgendaProps {
  appointments: Appointment[];
  patients: Patient[];
  onAddAppointment: (newApp: Appointment) => void;
  onUpdateStatus: (id: string, status: Appointment["status"]) => void;
  onDeleteAppointment: (id: string) => void;
  onUpdateAppointment?: (updatedApp: Appointment) => void;
  clinicName?: string;
  doctorName?: string;
  onUpdatePatient?: (updatedPatient: Patient) => void;
  privacyMode?: boolean;
}

// Helper for dynamic real current date
const getTodayStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Agenda({
  appointments,
  patients,
  onAddAppointment,
  onUpdateStatus,
  onDeleteAppointment,
  onUpdateAppointment,
  clinicName = "PerioClinic Pro",
  doctorName = "Dr. Especialista Titular",
  onUpdatePatient,
  privacyMode = false
}: AgendaProps) {
  // Always initialize with dynamic current real date
  const [selectedDate, setSelectedDate] = useState(getTodayStr);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Confirmed" | "Completed" | "GoogleSynced">("All");
  const [agendaView, setAgendaView] = useState<"list" | "grid">("list");

  // WhatsApp Reminder Modals State
  const [whatsappModalState, setWhatsappModalState] = useState<{
    isOpen: boolean;
    patient: Patient | null;
    appointment?: Appointment;
  }>({ isOpen: false, patient: null });

  const [showBatchWhatsAppModal, setShowBatchWhatsAppModal] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formPatientId, setFormPatientId] = useState("");
  const [formDate, setFormDate] = useState(getTodayStr);
  const [formTime, setFormTime] = useState("10:00");
  const [formBox, setFormBox] = useState("Sillón 1");
  const [formTreatment, setFormTreatment] = useState("");
  const [formStatus, setFormStatus] = useState<Appointment["status"]>("Confirmed");
  const [formSyncWithGoogle, setFormSyncWithGoogle] = useState(true);

  // Google Calendar Integration State
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [calendarNotification, setCalendarNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    actionType: 'create' | 'delete' | 'syncAll' | 'exportAll';
    appointment?: Appointment;
    totalAppointments?: number;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    actionType: 'create',
    onConfirm: async () => {},
  });

  // Escape key handler for Appointment Form Modal
  useEffect(() => {
    if (!showForm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowForm(false);
        setEditingId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm]);

  useEffect(() => {
    const unsubscribe = initCalendarAuth(
      (user, token) => {
        setIsGoogleConnected(true);
        setGoogleUser(user);
      },
      () => {
        if (!getCalendarAccessToken()) {
          setIsGoogleConnected(false);
          setGoogleUser(null);
        }
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleConnectGoogle = async () => {
    try {
      setIsCalendarLoading(true);
      const res = await signInWithGoogleCalendar();
      if (res) {
        setIsGoogleConnected(true);
        setGoogleUser(res.user);
        setCalendarNotification({
          type: 'success',
          message: `Conectado exitosamente con Google Calendar (${res.user.email})`
        });
      }
    } catch (err: any) {
      setCalendarNotification({
        type: 'error',
        message: err.message || 'Error al conectar con Google Calendar'
      });
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await disconnectGoogleCalendar();
      setIsGoogleConnected(false);
      setGoogleUser(null);
      setCalendarNotification({
        type: 'success',
        message: 'Desconectado de Google Calendar'
      });
    } catch (err: any) {
      setCalendarNotification({
        type: 'error',
        message: err.message || 'Error al desconectar'
      });
    }
  };

  const requestSyncAppointment = (app: Appointment) => {
    if (!isGoogleConnected) {
      handleConnectGoogle();
      return;
    }
    setConfirmModal({
      isOpen: true,
      actionType: 'create',
      appointment: app,
      totalAppointments: 1,
      onConfirm: async () => {
        try {
          setIsCalendarLoading(true);
          const { startDateTime, endDateTime } = convertAppointmentToCalendarDates(app);
          const matchedPatient = patients.find(p => p.id === app.patientId);
          
          const createdEvent = await createGoogleCalendarEvent({
            summary: `Cita Dental: ${app.patientName} - ${app.treatment}`,
            description: `PerioDash Clínico\nPaciente: ${app.patientName}\nTratamiento: ${app.treatment}\nSillón: ${app.box || 'Sillón 1'}\nTeléfono: ${matchedPatient?.phone || 'No registrado'}\nEstado: ${app.status}`,
            startDateTime,
            endDateTime,
            attendees: matchedPatient?.email ? [{ email: matchedPatient.email, displayName: matchedPatient.name }] : undefined,
          });

          const updated: Appointment = {
            ...app,
            googleCalendarEventId: createdEvent.id,
            googleCalendarSyncedAt: new Date().toISOString(),
          };

          if (onUpdateAppointment) {
            onUpdateAppointment(updated);
          }

          setCalendarNotification({
            type: 'success',
            message: `Cita de ${app.patientName} sincronizada con Google Calendar.`
          });
        } catch (err: any) {
          setCalendarNotification({
            type: 'error',
            message: `Error al sincronizar cita: ${err.message}`
          });
        } finally {
          setIsCalendarLoading(false);
        }
      }
    });
  };

  const requestDeleteFromCalendar = (app: Appointment) => {
    if (!app.googleCalendarEventId) return;
    setConfirmModal({
      isOpen: true,
      actionType: 'delete',
      appointment: app,
      onConfirm: async () => {
        try {
          setIsCalendarLoading(true);
          await deleteGoogleCalendarEvent(app.googleCalendarEventId!);
          const updated: Appointment = {
            ...app,
            googleCalendarEventId: undefined,
            googleCalendarSyncedAt: undefined,
          };
          if (onUpdateAppointment) {
            onUpdateAppointment(updated);
          }
          setCalendarNotification({
            type: 'success',
            message: `Evento retirado de Google Calendar.`
          });
        } catch (err: any) {
          setCalendarNotification({
            type: 'error',
            message: `Error al eliminar de Google Calendar: ${err.message}`
          });
        } finally {
          setIsCalendarLoading(false);
        }
      }
    });
  };

  const requestSyncAllAppointments = () => {
    if (!isGoogleConnected) {
      handleConnectGoogle();
      return;
    }
    const unsynced = dateAppointments.filter(a => a.status !== 'Cancelled');
    if (unsynced.length === 0) {
      setCalendarNotification({
        type: 'success',
        message: 'No hay citas activas para sincronizar en esta fecha.'
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      actionType: 'syncAll',
      totalAppointments: unsynced.length,
      onConfirm: async () => {
        try {
          setIsCalendarLoading(true);
          let count = 0;
          for (const app of unsynced) {
            const { startDateTime, endDateTime } = convertAppointmentToCalendarDates(app);
            const matchedPatient = patients.find(p => p.id === app.patientId);
            const event = await createGoogleCalendarEvent({
              summary: `Cita Dental: ${app.patientName} - ${app.treatment}`,
              description: `PerioDash Clínico\nPaciente: ${app.patientName}\nTratamiento: ${app.treatment}\nSillón: ${app.box || 'Sillón 1'}\nTeléfono: ${matchedPatient?.phone || 'No registrado'}`,
              startDateTime,
              endDateTime,
              attendees: matchedPatient?.email ? [{ email: matchedPatient.email, displayName: matchedPatient.name }] : undefined,
            });
            const updated: Appointment = {
              ...app,
              googleCalendarEventId: event.id,
              googleCalendarSyncedAt: new Date().toISOString(),
            };
            if (onUpdateAppointment) {
              onUpdateAppointment(updated);
            }
            count++;
          }
          setCalendarNotification({
            type: 'success',
            message: `${count} citas sincronizadas con Google Calendar correctamente.`
          });
        } catch (err: any) {
          setCalendarNotification({
            type: 'error',
            message: `Error en la sincronización masiva: ${err.message}`
          });
        } finally {
          setIsCalendarLoading(false);
        }
      }
    });
  };

  const handleExportToGoogleCalendar = async () => {
    if (!isGoogleConnected) {
      await handleConnectGoogle();
      return;
    }
    const activeApps = appointments.filter(a => a.status !== 'Cancelled');
    if (activeApps.length === 0) {
      setCalendarNotification({
        type: 'error',
        message: 'No hay citas activas en la clínica para exportar a Google Calendar.'
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      actionType: 'exportAll',
      totalAppointments: activeApps.length,
      onConfirm: async () => {
        try {
          setIsCalendarLoading(true);
          let exportedCount = 0;
          for (const app of activeApps) {
            const { startDateTime, endDateTime } = convertAppointmentToCalendarDates(app);
            const matchedPatient = patients.find(p => p.id === app.patientId);
            const created = await createGoogleCalendarEvent({
              summary: `Cita Dental: ${app.patientName} - ${app.treatment}`,
              description: `PerioDash Clínico\nPaciente: ${app.patientName}\nTratamiento: ${app.treatment}\nSillón: ${app.box || 'Sillón 1'}\nTeléfono: ${matchedPatient?.phone || 'No registrado'}\nEstado: ${app.status}`,
              startDateTime,
              endDateTime,
              attendees: matchedPatient?.email ? [{ email: matchedPatient.email, displayName: matchedPatient.name }] : undefined,
            });

            const updated: Appointment = {
              ...app,
              googleCalendarEventId: created.id,
              googleCalendarSyncedAt: new Date().toISOString(),
            };
            if (onUpdateAppointment) {
              onUpdateAppointment(updated);
            }
            exportedCount++;
          }
          setCalendarNotification({
            type: 'success',
            message: `Se han exportado ${exportedCount} citas clínicas a tu Google Calendar exitosamente.`
          });
        } catch (err: any) {
          setCalendarNotification({
            type: 'error',
            message: `Error al exportar a Google Calendar: ${err.message}`
          });
        } finally {
          setIsCalendarLoading(false);
        }
      }
    });
  };

  const handleOpenImportModal = async () => {
    if (!isGoogleConnected) {
      await handleConnectGoogle();
    }
    try {
      setIsCalendarLoading(true);
      const base = new Date(selectedDate + "T00:00:00");
      const minDate = new Date(base.getTime() - 3 * 86400000).toISOString();
      const maxDate = new Date(base.getTime() + 14 * 86400000).toISOString();
      const events = await fetchCalendarEvents(minDate, maxDate);
      setGoogleEvents(events);
      setShowImportModal(true);
    } catch (err: any) {
      setCalendarNotification({
        type: 'error',
        message: `Error al consultar Google Calendar: ${err.message}`
      });
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleImportSingleGoogleEvent = (evt: GoogleCalendarEvent) => {
    const start = evt.start?.dateTime ? new Date(evt.start.dateTime) : new Date(selectedDate + "T10:00:00");
    const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;

    const patientName = evt.summary?.replace(/^Cita Dental:\s*/i, '').split(' - ')[0] || evt.summary || 'Paciente Google Calendar';
    const existingPatient = patients.find(p => p.name.toLowerCase() === patientName.toLowerCase()) || patients[0];

    const newApp: Appointment = {
      id: `gc-import-${Date.now()}`,
      patientId: existingPatient?.id || 'pac-1',
      patientName: patientName,
      date: dateStr,
      time: timeStr,
      treatment: evt.description?.split('\n')[0] || evt.summary || 'Consulta Dental',
      status: 'Confirmed',
      box: 'Sillón 1',
      googleCalendarEventId: evt.id,
      googleCalendarSyncedAt: new Date().toISOString(),
    };

    onAddAppointment(newApp);
    setCalendarNotification({
      type: 'success',
      message: `Cita "${evt.summary}" importada con éxito.`
    });
  };

  const AVAILABLE_BOXES = ["Sillón 1", "Sillón 2", "Sillón 3"];

  // Frequently used clinical presets to maximize productivity
  const CLINICAL_PRESETS = [
    "Periodontodiagnóstico Integral",
    "Sondaje Periodontal de 6 Puntos",
    "Destartraje Ultrasónico y Pulido Coronario",
    "Raspado y Alisado Radicular (RAR) x Cuadrante",
    "Cirugía Plástica Gingival o Injerto Libre",
    "Control de Placa Bacteriana O'Leary",
    "Mantenimiento Periodontal y Soporte de Citas",
    "Evaluación de Urgencia Clínica"
  ];

  // Default mock hours
  const COMMON_HOURS = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", 
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", 
    "17:00", "17:30", "18:00"
  ];

  // Helper to get the week days starting from Sunday of the selectedDate
  const getDynamicWeekDays = (baseDateStr: string) => {
    try {
      const baseDate = new Date(baseDateStr + "T00:00:00");
      if (isNaN(baseDate.getTime())) {
        return [];
      }
      const dayOfWeek = baseDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
      
      const days = [];
      const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - dayOfWeek + i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dayNumVal = String(d.getDate()).padStart(2, '0');
        const value = `${year}-${month}-${dayNumVal}`;
        
        days.push({
          value,
          label: labels[i],
          dayNum: dayNumVal,
          isToday: value === todayStr
        });
      }
      return days;
    } catch (e) {
      return [];
    }
  };

  const WEEK_DAYS = getDynamicWeekDays(selectedDate);

  // Escape key listener for modal form
  useEffect(() => {
    if (!showForm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowForm(false);
        setEditingId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm]);

  // Map to select patient from state
  const handleOpenAddForm = (initialTime?: string, initialBox?: string) => {
    setEditingId(null);
    setFormPatientId("");
    setFormDate(selectedDate);
    setFormTime(initialTime || "10:00");
    setFormBox(initialBox || "Sillón 1");
    setFormTreatment("");
    setFormStatus("Confirmed");
    setFormSyncWithGoogle(isGoogleConnected);
    setShowForm(true);
  };

  const handleOpenEditForm = (app: Appointment) => {
    setEditingId(app.id);
    setFormPatientId(app.patientId);
    setFormDate(app.date);
    setFormTime(app.time);
    setFormBox(app.box || "Sillón 1");
    setFormTreatment(app.treatment);
    setFormStatus(app.status);
    setFormSyncWithGoogle(!!app.googleCalendarEventId || isGoogleConnected);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId || !formDate || !formTime || !formTreatment) return;

    const matchedPatient = patients.find(p => p.id === formPatientId);
    if (!matchedPatient) return;

    let calendarEventId: string | undefined = undefined;
    let calendarSyncedAt: string | undefined = undefined;

    // Direct Google Calendar Sync on new/edit appointment creation
    if (formSyncWithGoogle && isGoogleConnected) {
      try {
        setIsCalendarLoading(true);
        const tempApp: Appointment = {
          id: editingId || `temp-${Date.now()}`,
          patientId: formPatientId,
          patientName: matchedPatient.name,
          date: formDate,
          time: formTime,
          treatment: formTreatment,
          status: formStatus,
          box: formBox,
        };
        const { startDateTime, endDateTime } = convertAppointmentToCalendarDates(tempApp);
        const createdEvent = await createGoogleCalendarEvent({
          summary: `Cita Dental: ${matchedPatient.name} - ${formTreatment}`,
          description: `PerioDash Clínico\nPaciente: ${matchedPatient.name}\nTratamiento: ${formTreatment}\nSillón: ${formBox}\nTeléfono: ${matchedPatient?.phone || 'No registrado'}\nEstado: ${formStatus}`,
          startDateTime,
          endDateTime,
          attendees: matchedPatient?.email ? [{ email: matchedPatient.email, displayName: matchedPatient.name }] : undefined,
        });

        calendarEventId = createdEvent.id;
        calendarSyncedAt = new Date().toISOString();
        setCalendarNotification({
          type: 'success',
          message: `Cita clínica guardada y sincronizada directamente en Google Calendar.`
        });
      } catch (syncErr: any) {
        console.error("Error auto-syncing to Google Calendar:", syncErr);
        setCalendarNotification({
          type: 'error',
          message: `Cita guardada en PerioDash, pero hubo un error con Google Calendar: ${syncErr.message}`
        });
      } finally {
        setIsCalendarLoading(false);
      }
    }

    if (editingId) {
      const existing = appointments.find(a => a.id === editingId);
      // Correct optimization: use onUpdateAppointment callback to save state properly
      const updatedApp: Appointment = {
        id: editingId,
        patientId: formPatientId,
        patientName: matchedPatient.name,
        date: formDate,
        time: formTime,
        treatment: formTreatment,
        status: formStatus,
        box: formBox,
        googleCalendarEventId: calendarEventId || existing?.googleCalendarEventId,
        googleCalendarSyncedAt: calendarSyncedAt || existing?.googleCalendarSyncedAt,
      };

      if (onUpdateAppointment) {
        onUpdateAppointment(updatedApp);
      } else {
        // Fallback for older interface compatibility
        onDeleteAppointment(editingId);
        onAddAppointment(updatedApp);
      }
    } else {
      // Add new appointment with unique ID
      const newApp: Appointment = {
        id: `app-${Date.now()}`,
        patientId: formPatientId,
        patientName: matchedPatient.name,
        date: formDate,
        time: formTime,
        treatment: formTreatment,
        status: formStatus,
        box: formBox,
        googleCalendarEventId: calendarEventId,
        googleCalendarSyncedAt: calendarSyncedAt,
      };
      onAddAppointment(newApp);
    }

    // Reset and close
    setShowForm(false);
    setEditingId(null);
    setFormTreatment("");
  };

  // WhatsApp Smart Modal Launcher
  const handleSendWhatsApp = (app: Appointment) => {
    const matchedPatient = patients.find(p => p.id === app.patientId) || 
      createFallbackPatient(app.patientId || `pat-${app.id}`, app.patientName, "");

    setWhatsappModalState({
      isOpen: true,
      patient: matchedPatient,
      appointment: app
    });
  };

  // Filter appointments for active date and filters
  const dateAppointments = appointments.filter(app => app.date === selectedDate);
  const filteredAppointments = dateAppointments.filter(app => {
    const patientObj = patients.find(p => p.id === app.patientId);
    const matchesSearch = app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.treatment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          matchPatientByRut(patientObj?.rut || patientObj?.dni, searchQuery);
    const matchesStatus = statusFilter === "All" 
      ? true 
      : statusFilter === "GoogleSynced"
      ? Boolean(app.googleCalendarEventId)
      : app.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => a.time.localeCompare(b.time));

  // Daily statistics metrics
  const totalCount = dateAppointments.length;
  const pendingCount = dateAppointments.filter(a => a.status === "Pending").length;
  const confirmedCount = dateAppointments.filter(a => a.status === "Confirmed").length;
  const completedCount = dateAppointments.filter(a => a.status === "Completed").length;
  const syncedCount = dateAppointments.filter(a => Boolean(a.googleCalendarEventId)).length;

  // Premium Clinic KPIs
  const occupancyRate = Math.round((totalCount / (COMMON_HOURS.length * AVAILABLE_BOXES.length)) * 100) || 0;
  
  // Calculate busiest chair today
  const boxCounts = dateAppointments.reduce((acc, app) => {
    const boxName = app.box || "Sillón 1";
    acc[boxName] = (acc[boxName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  let busiestBox = "Sillón 1";
  let busiestBoxCount = 0;
  Object.entries(boxCounts).forEach(([b, count]) => {
    if (count > busiestBoxCount) {
      busiestBox = b;
      busiestBoxCount = count;
    }
  });

  // Next upcoming patient today (sorted chronologically)
  const sortedActive = [...dateAppointments]
    .filter(a => a.status === "Confirmed" || a.status === "Pending")
    .sort((a, b) => a.time.localeCompare(b.time));
  const nextApp = sortedActive[0] || null;

  return (
    <div className="relative w-full h-full flex flex-col gap-6" id="agenda-clinical-panel">
      {/* Visual background ambient glow matching cosmic slate */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/5 dark:bg-teal-400/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-400/3 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 relative z-10">
        <div>
          <h2 className="text-2xl font-display font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-600" />
            Agenda y Horarios
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestión intuitiva, confirmación de citas y sincronización bidireccional con Google Calendar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar cita, RUT o paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-56 sm:w-64 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none dark:text-white transition-all focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 shadow-sm"
            />
          </div>

          {/* WhatsApp Batch Reminders Dispatcher */}
          <button
            type="button"
            onClick={() => setShowBatchWhatsAppModal(true)}
            className="px-4 py-2.5 text-xs font-bold leading-none text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all shrink-0"
            title="Enviar recordatorios automáticos por WhatsApp (Twilio API / wa.me)"
          >
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Recordatorios WhatsApp ({appointments.filter(a => a.status !== 'Cancelled').length})</span>
          </button>

          {/* Google Calendar Quick Sync/Connect & Export Actions */}
          {!isGoogleConnected ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleConnectGoogle}
                disabled={isCalendarLoading}
                className="px-4 py-2.5 text-xs font-bold leading-none text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500/50 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all shrink-0"
                title="Conectar con tu cuenta de Google Calendar"
              >
                <GoogleGLogo className="w-4 h-4" />
                <span>{isCalendarLoading ? "Conectando..." : "Conectar Google Calendar"}</span>
              </button>

              <button
                onClick={handleExportToGoogleCalendar}
                disabled={isCalendarLoading}
                className="px-4 py-2.5 text-xs font-bold leading-none text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-500/30 hover:bg-teal-100 dark:hover:bg-teal-900/40 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all shrink-0"
                title="Exportar todas las citas clínicas activas a Google Calendar"
              >
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Exportar a Google Calendar</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-800/90 border border-teal-500/30 p-1 rounded-xl shadow-xs">
              <button
                onClick={handleExportToGoogleCalendar}
                disabled={isCalendarLoading}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-teal-500/10 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Exportar todas las citas del sistema hacia tu cuenta de Google Calendar"
              >
                <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Exportar a Google Calendar ({appointments.filter(a => a.status !== 'Cancelled').length})</span>
              </button>
              <button
                onClick={requestSyncAllAppointments}
                disabled={isCalendarLoading}
                className="px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border-l border-slate-200 dark:border-slate-700"
                title="Sincronizar citas de la fecha activa con Google Calendar"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCalendarLoading ? 'animate-spin' : ''}`} />
                <span>Sincronizar Día ({dateAppointments.filter(a => a.status !== 'Cancelled').length})</span>
              </button>
              <button
                onClick={handleOpenImportModal}
                disabled={isCalendarLoading}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border-l border-slate-200 dark:border-slate-700"
                title="Importar eventos desde Google Calendar a PerioDash"
              >
                <GoogleGLogo className="w-3.5 h-3.5" />
                <span>Importar</span>
              </button>
            </div>
          )}

          <button
            onClick={() => handleOpenAddForm()}
            className="px-5 py-2.5 text-xs font-bold leading-none text-white bg-teal-600 hover:bg-teal-700 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Google Calendar Notification Banner */}
      {calendarNotification && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            calendarNotification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {calendarNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{calendarNotification.message}</span>
          </div>
          <button
            onClick={() => setCalendarNotification(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Google Calendar Connected Status Badge Strip */}
      {isGoogleConnected && googleUser && (
        <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-teal-500/30 flex items-center justify-center shadow-xs">
              <GoogleGLogo className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Google Calendar Vinculado:</span>
              <span className="ml-1.5 font-mono text-teal-700 dark:text-teal-400 font-semibold">{googleUser.email}</span>
            </div>
            <span className="px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              Sincronización Activa
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDisconnectGoogle}
              className="text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              Desconectar
            </button>
          </div>
        </div>
      )}

      {/* CLINICAL BENTO KPI METRICS PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 relative z-10 select-none">
        {/* Metric 1: Occupancy */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-teal-500/30 transition-colors"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Ocupación del Día</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{occupancyRate}%</span>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5"><TrendingUp className="w-3.5 h-3.5" /> Óptimo</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">De {COMMON_HOURS.length * AVAILABLE_BOXES.length} slots disponibles hoy.</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
        </motion.div>

        {/* Metric 2: Next Patient */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-emerald-500/30 transition-colors col-span-1"
        >
          <div className="space-y-0.5 flex-1 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Próximo Turno</span>
            {nextApp ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-black text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0">{nextApp.time}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{nextApp.patientName}</span>
                </div>
                <p className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate mt-1">Tx: {nextApp.treatment}</p>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block py-1">Sin turnos pendientes</span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Toda la agenda atendida o despejada.</p>
              </>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center shrink-0 ml-2">
            <Smile className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </motion.div>

        {/* Metric 3: Busiest Box */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-purple-500/30 transition-colors"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Sillón más Solicitado</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-slate-800 dark:text-white">{busiestBox}</span>
              <span className="text-[9px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md">{busiestBoxCount} citas</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Sillón con mayor carga clínica de hoy.</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </motion.div>

        {/* Metric 4: Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-amber-500/30 transition-colors"
        >
          <div className="space-y-1 flex-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Progreso de Atención</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{completedCount}/{totalCount}</span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">Atendidos</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20 flex items-center justify-center shrink-0 ml-2">
            <CheckCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
        </motion.div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm shrink-0 relative z-10">
        {/* Date Controls */}
        <div className="flex flex-1 overflow-x-auto gap-3.5 px-2 hide-scrollbar items-center w-full">
            <div className="flex items-center gap-1 shrink-0 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => {
                  const today = getTodayStr();
                  setSelectedDate(today);
                  setFormDate(today);
                }}
                className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  selectedDate === getTodayStr()
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 shadow-xs"
                }`}
                title="Volver a la fecha de hoy"
              >
                Hoy
              </button>

              <button 
                type="button"
                onClick={() => {
                  const d = new Date(selectedDate + "T00:00:00");
                  d.setDate(d.getDate() - 1);
                  const newDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  setSelectedDate(newDateStr);
                  setFormDate(newDateStr);
                }}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                title="Día anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="relative flex items-center">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setFormDate(e.target.value);
                  }}
                  className="text-xs font-extrabold bg-transparent outline-none border-0 text-slate-700 dark:text-slate-300 cursor-pointer py-1 px-1.5"
                />
              </div>

              <button 
                type="button"
                onClick={() => {
                  const d = new Date(selectedDate + "T00:00:00");
                  d.setDate(d.getDate() + 1);
                  const newDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  setSelectedDate(newDateStr);
                  setFormDate(newDateStr);
                }}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                title="Día siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
              {WEEK_DAYS.map((day) => {
                const isActive = selectedDate === day.value;
                return (
                  <button
                    key={day.value}
                    onClick={() => {
                      setSelectedDate(day.value);
                      setFormDate(day.value);
                    }}
                    className={`py-1.5 px-2.5 rounded-xl flex flex-col items-center justify-center min-w-[42px] gap-0.5 transition-all cursor-pointer border-0 outline-none shrink-0 ${
                      isActive 
                        ? "bg-teal-600 text-white shadow-md scale-105" 
                        : "bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-[8.5px] font-bold uppercase tracking-wider opacity-75">{day.label}</span>
                    <span className="text-xs font-black">{day.dayNum}</span>
                  </button>
                );
              })}
            </div>
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

        {/* Filters */}
        <div className="flex items-center gap-1.5 px-2 overflow-x-auto hide-scrollbar w-full md:w-auto justify-end">
              {[
                { value: "All", label: `Todas (${totalCount})` },
                { value: "Pending", label: `Ptes (${pendingCount})` },
                { value: "Confirmed", label: `Conf (${confirmedCount})` },
                { value: "GoogleSynced", label: `Google Cal (${syncedCount})`, isGoogle: true },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value as any)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === f.value
                      ? f.isGoogle
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm"
                        : "bg-teal-50 dark:bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400 shadow-sm"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {f.isGoogle && <GoogleGLogo className="w-3 h-3" />}
                  <span>{f.label}</span>
                </button>
              ))}
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setAgendaView("list")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer border-0 ${
                agendaView === "list" ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium bg-transparent"
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setAgendaView("grid")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer border-0 ${
                agendaView === "grid" ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium bg-transparent"
              }`}
            >
              Malla
            </button>
        </div>
      </div>

      {/* CORE MASTER DETAILS LAYOUT (1 COLUMN FULL WIDTH) */}
      <div className="flex-1 bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-2.5xl flex flex-col min-h-0 relative z-10 overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 hide-scrollbar">
            <AnimatePresence mode="popLayout">
              {agendaView === "list" ? (
                filteredAppointments.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 text-slate-400"
                  >
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                       <Calendar className="w-8 h-8 text-teal-500" />
                    </div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Día despejado</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2 mx-auto">
                      {searchQuery || statusFilter !== "All" 
                        ? "No hay citas que coincidan con tu búsqueda."
                        : `No hay citas agendadas para ${selectedDate}.`
                      }
                    </p>
                    {!showForm && !searchQuery && (
                      <button
                        onClick={() => handleOpenAddForm()}
                        className="mt-6 px-5 py-2.5 bg-teal-600 text-white font-bold text-sm rounded-xl cursor-pointer border-0 flex items-center gap-2 shadow-md hover:bg-teal-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Registrar Cita
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredAppointments.map((app) => {
                      const matchedPatient = patients.find(p => p.id === app.patientId);
                      
                      return (
                        <motion.div
                          key={app.id}
                          layoutId={`card-${app.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-4 rounded-2xl border transition-all relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                            app.status === "Confirmed"
                              ? "bg-white dark:bg-slate-800/80 border-emerald-500/30"
                              : app.status === "Completed"
                              ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 opacity-70"
                              : app.status === "Cancelled"
                              ? "bg-white dark:bg-slate-800/80 border-red-500/30"
                              : "bg-white dark:bg-slate-800/80 border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/5"
                          }`}
                        >
                          {/* Color bar indicator */}
                          <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${
                            app.status === "Confirmed" ? "bg-emerald-500" :
                            app.status === "Completed" ? "bg-slate-400" :
                            app.status === "Cancelled" ? "bg-red-500" : "bg-amber-500"
                          }`} />

                          {/* LEFT AREA: TIME & PATIENT */}
                          <div className="pl-3 flex items-start gap-4 flex-1">
                            {/* Chrono Slot with Clock */}
                            <div className="px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center shrink-0">
                               <span className="font-mono text-sm font-black text-slate-800 dark:text-slate-100">
                                {app.time}
                               </span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{app.box || "Sillón 1"}</span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <span className="font-bold text-slate-900 dark:text-white text-base leading-none">
                                  {privacyMode ? maskPII(app.patientName, "name") : app.patientName}
                                </span>
                                {matchedPatient?.phone && (
                                  <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                                    <Phone className="w-3 h-3" /> {privacyMode ? maskPII(matchedPatient.phone, "phone") : matchedPatient.phone}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                <span className="font-bold text-slate-400 dark:text-slate-500 mr-1 uppercase text-[10px] tracking-wider">Tx:</span>
                                {app.treatment}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                {(() => {
                                  const tStyle = getTreatmentStyle(app.treatment);
                                  return (
                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border flex items-center gap-1.5 ${tStyle.bg}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${tStyle.dot}`} />
                                      {tStyle.label}
                                    </span>
                                  );
                                })()}
                                
                                <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider ${
                                  app.status === 'Confirmed' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                                  app.status === 'Completed' ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400' :
                                  app.status === 'Cancelled' ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                                  'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {app.status === 'Confirmed' ? 'Confirmado' :
                                   app.status === 'Completed' ? 'Atendido' :
                                   app.status === 'Cancelled' ? 'Cancelado' : 'Pendiente'}
                                </span>

                                {/* Visual Indicator for Google Calendar Sync Status */}
                                {app.googleCalendarEventId ? (
                                  <span 
                                    className="px-2 py-0.5 text-[9px] font-bold rounded-md border flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-xs"
                                    title={`Sincronizado con Google Calendar${app.googleCalendarSyncedAt ? ` • ${new Date(app.googleCalendarSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`}
                                  >
                                    <GoogleGLogo className="w-3 h-3" />
                                    <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                                    <span>Google Cal</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      requestSyncAppointment(app);
                                    }}
                                    className="px-2 py-0.5 text-[9px] font-medium rounded-md border flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-slate-700/60 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                                    title="No sincronizado aún con Google Calendar. Haz clic para sincronizar."
                                  >
                                    <GoogleGLogo className="w-3 h-3 opacity-50 grayscale" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                    <span>Sin sincronizar</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* RIGHT AREA: ACTION BUTTONS AND STATUS */}
                          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                            <div className="flex items-center gap-1">
                              {(['Pending', 'Confirmed', 'Completed', 'Cancelled'] as const).map((st) => {
                                const isCurrent = app.status === st;
                                const config = {
                                  Pending: { label: "Pte", color: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 hover:bg-amber-500/15" },
                                  Confirmed: { label: "Conf", color: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-500/15" },
                                  Completed: { label: "Atend", color: "text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/30 hover:bg-teal-500/15" },
                                  Cancelled: { label: "Canc", color: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 hover:bg-red-500/15" }
                                }[st];

                                return (
                                  <button
                                    key={st}
                                    onClick={() => onUpdateStatus(app.id, st)}
                                    className={`px-2 py-1 text-[9px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                                      isCurrent 
                                        ? "bg-teal-600 border-teal-600 text-white shadow-xs scale-105" 
                                        : `${config.color} bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700`
                                    }`}
                                    title={`Marcar como ${st}`}
                                  >
                                    {config.label}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

                            {/* Twilio WhatsApp Automated Reminder Action Button */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(app)}
                              className="p-2 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-700 dark:text-emerald-300 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold shadow-xs group/wa"
                              title="Enviar recordatorio automático por WhatsApp al paciente (Twilio API / wa.me)"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover/wa:scale-110 transition-transform" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>

                            {/* Google Calendar Quick Sync / Status Button */}
                            <div className="flex items-center">
                              {app.googleCalendarEventId ? (
                                <button
                                  onClick={() => requestDeleteFromCalendar(app)}
                                  className="p-2 px-2.5 bg-emerald-500/10 hover:bg-rose-500/15 border border-emerald-500/30 hover:border-rose-500/30 text-emerald-700 hover:text-rose-600 dark:text-emerald-300 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold shadow-xs group/gcal"
                                  title="Sincronizado con Google Calendar. Haz clic para desvincular o retirar de Calendar."
                                >
                                  <GoogleGLogo className="w-3.5 h-3.5" />
                                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3] group-hover/gcal:hidden" />
                                  <X className="w-3 h-3 text-rose-600 dark:text-rose-400 hidden group-hover/gcal:block" />
                                  <span className="hidden xl:inline group-hover/gcal:hidden">Sincronizado</span>
                                  <span className="hidden xl:group-hover/gcal:inline">Desvincular</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => requestSyncAppointment(app)}
                                  className="p-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-500/15 border border-slate-200 dark:border-slate-700 hover:border-teal-500/30 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold"
                                  title="Sincronizar esta cita con Google Calendar"
                                >
                                  <GoogleGLogo className="w-3.5 h-3.5 opacity-70" />
                                  <Plus className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                  <span className="hidden xl:inline">Sincronizar</span>
                                </button>
                              )}
                            </div>

                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                              <button
                                onClick={() => handleSendWhatsApp(app)}
                                className="p-2 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center border-r border-slate-200 dark:border-slate-700"
                                title="Enviar WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditForm(app)}
                                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center border-r border-slate-200 dark:border-slate-700"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteAppointment(app.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Malla Horaria (Grid) */
                <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-sm hide-scrollbar">
                  <div className="min-w-[800px]">
                    {/* Headers */}
                    <div className="grid grid-cols-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider items-center sticky top-0 z-20">
                      <div className="col-span-1 text-center py-3">Hora</div>
                      {AVAILABLE_BOXES.map((bName) => (
                        <div key={bName} className="col-span-3 text-center border-l border-slate-200 dark:border-slate-700 py-3 relative">
                           {bName}
                        </div>
                      ))}
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {COMMON_HOURS.map((hr) => {
                        return (
                          <div key={hr} className="grid grid-cols-10 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            {/* Time */}
                            <div className="col-span-1 flex flex-col items-center justify-center font-mono text-xs font-semibold text-slate-500 bg-slate-50/30 dark:bg-slate-900/50 py-3">
                              <span>{hr}</span>
                            </div>

                            {/* Sillón Slots */}
                            {AVAILABLE_BOXES.map((bName) => {
                              const matchedApp = dateAppointments.find(
                                (app) => app.time === hr && (app.box === bName || (!app.box && bName === "Sillón 1"))
                              );

                              return (
                                <div key={bName} className="col-span-3 border-l border-slate-100 dark:border-slate-800 p-2 relative min-h-[70px]">
                                  {matchedApp ? (
                                    <div
                                      className={`group/cell h-full p-2.5 rounded-xl border relative cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all ${
                                        matchedApp.status === "Confirmed" ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] border-emerald-500/25 dark:border-emerald-500/20" :
                                        matchedApp.status === "Completed" ? "bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60" :
                                        matchedApp.status === "Cancelled" ? "bg-red-500/[0.04] dark:bg-red-500/[0.02] border-red-500/25 dark:border-red-500/20" :
                                        "bg-amber-500/[0.04] dark:bg-amber-500/[0.02] border-amber-500/25 dark:border-amber-500/20"
                                      }`}
                                    >
                                      <div className={`absolute left-0 top-0 w-1 h-full ${
                                        matchedApp.status === "Confirmed" ? "bg-emerald-500" :
                                        matchedApp.status === "Completed" ? "bg-slate-400" :
                                        matchedApp.status === "Cancelled" ? "bg-red-500" : "bg-amber-500"
                                      }`} />
                                      <div className="pl-2 flex-1" onClick={() => handleOpenEditForm(matchedApp)}>
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                                            {privacyMode ? maskPII(matchedApp.patientName, "name") : matchedApp.patientName}
                                          </span>
                                          <div className="flex items-center gap-1 shrink-0">
                                            {/* Google Calendar Visual Indicator */}
                                            {matchedApp.googleCalendarEventId ? (
                                              <span 
                                                className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[8px] font-black shadow-xs" 
                                                title={`Cita sincronizada con Google Calendar${matchedApp.googleCalendarSyncedAt ? ` (${new Date(matchedApp.googleCalendarSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}`}
                                              >
                                                <GoogleGLogo className="w-2.5 h-2.5" />
                                                <Check className="w-2 h-2 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                                              </span>
                                            ) : (
                                              <span 
                                                className="inline-flex items-center p-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-400 opacity-60" 
                                                title="No sincronizado con Google Calendar"
                                              >
                                                <GoogleGLogo className="w-2.5 h-2.5 grayscale" />
                                              </span>
                                            )}
                                            <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500">{matchedApp.time}</span>
                                          </div>
                                        </div>
                                        <div className="text-[9.5px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-semibold">{matchedApp.treatment}</div>
                                        
                                        {/* Dynamic treatment tag dot & Google Cal badge inside grid card */}
                                        <div className="flex items-center justify-between gap-1 mt-1">
                                          {(() => {
                                            const tStyle = getTreatmentStyle(matchedApp.treatment);
                                            return (
                                              <div className="flex items-center gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${tStyle.dot}`} />
                                                <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{tStyle.label}</span>
                                              </div>
                                            );
                                          })()}

                                          {matchedApp.googleCalendarEventId && (
                                            <span className="text-[7.5px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                                              <Check className="w-2 h-2 stroke-[3]" /> Cal Synced
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Quick controls bar inside grid slot */}
                                      <div className="pl-2 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between gap-2 shrink-0">
                                        <div className="flex items-center gap-1">
                                          {matchedApp.status === 'Pending' && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); onUpdateStatus(matchedApp.id, 'Confirmed'); }}
                                              className="px-1.5 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-black rounded-md cursor-pointer border-0 shadow-xs"
                                              title="Confirmar Cita"
                                            >
                                              Conf
                                            </button>
                                          )}
                                          {matchedApp.status === 'Confirmed' && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); onUpdateStatus(matchedApp.id, 'Completed'); }}
                                              className="px-1.5 py-0.5 bg-teal-600 hover:bg-teal-700 text-white text-[8px] font-black rounded-md cursor-pointer border-0 shadow-xs"
                                              title="Marcar como Atendido"
                                            >
                                              Atender
                                            </button>
                                          )}
                                          {matchedApp.status !== 'Completed' && matchedApp.status !== 'Cancelled' && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); onUpdateStatus(matchedApp.id, 'Cancelled'); }}
                                              className="px-1.5 py-0.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-600 text-[8px] font-bold rounded-md cursor-pointer border-0 transition-all"
                                              title="Cancelar Cita"
                                            >
                                              ✕
                                            </button>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(matchedApp); }}
                                            className="px-1.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-300 text-[8px] font-bold rounded-md cursor-pointer border border-emerald-500/30 transition-all flex items-center gap-0.5"
                                            title="Enviar recordatorio WhatsApp (Twilio)"
                                          >
                                            <Smartphone className="w-2.5 h-2.5" />
                                            <span>WA</span>
                                          </button>

                                          <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteAppointment(matchedApp.id); }}
                                            className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center rounded-md"
                                            title="Eliminar"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenAddForm(hr, bName)}
                                      className="w-full h-full opacity-40 hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-700 cursor-pointer text-xs font-semibold"
                                    >
                                      + Agendar
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
        </div>
      </div>

      {/* FLOATING OVERLAY MODAL FORM */}
      <AnimatePresence>
        {showForm && (
          <div 
            onClick={() => { setShowForm(false); setEditingId(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleFormSubmit}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2.5xl shadow-2xl overflow-hidden flex flex-col shrink-0"
            >
              <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-teal-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  {editingId ? "Reagendar / Editar Cita" : "Nueva Reserva Odontológica"}
                </span>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="p-1 px-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg border-0 cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                
                {/* Slot conflict alerting warning in real-time */}
                {(() => {
                  const hourConflictApp = appointments.find(
                    (app) => app.date === formDate && app.time === formTime && (app.box === formBox || (!app.box && formBox === "Sillón 1")) && app.id !== editingId && app.status !== "Cancelled"
                  );
                  if (hourConflictApp) {
                    return (
                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed font-medium animate-pulse">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block mb-0.5 uppercase tracking-wider text-[10px]">¡Conflicto de Horario en {formBox}!</strong> 
                          El paciente <span className="font-bold underline">{hourConflictApp.patientName}</span> ya se encuentra agendado en {formBox} para el horario seleccionado ({formTime} hrs - {formDate}).
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Patient Selection Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block font-sans">Paciente</label>
                  <select
                    value={formPatientId}
                    onChange={(e) => setFormPatientId(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none dark:text-white focus:border-teal-500/50 font-medium font-sans"
                    required
                  >
                    <option value="">Seleccione Paciente...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.rut ? `(RUT: ${p.rut})` : `(ID: ${p.id.split('-')[1] || p.id})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block font-sans">Fecha Operadora</label>
                    <input 
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none dark:text-white font-medium font-sans"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block font-sans">Franja Horaria</label>
                    <select
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none dark:text-white focus:border-teal-500/50 font-medium font-sans"
                    >
                      {COMMON_HOURS.map(hr => (
                        <option key={hr} value={hr}>{hr} hrs</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tactile Chair/Box Selection Grid */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block font-sans">Sillón / Box de Atención</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {AVAILABLE_BOXES.map(box => {
                      const isSelected = formBox === box;
                      // Conflict check
                      const hasConflict = appointments.some(app => 
                        app.date === formDate && 
                        app.time === formTime && 
                        (app.box === box || (!app.box && box === "Sillón 1")) && 
                        app.id !== editingId && 
                        app.status !== "Cancelled"
                      );

                      return (
                        <button
                          key={box}
                          type="button"
                          onClick={() => setFormBox(box)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                            isSelected
                              ? "bg-teal-500/10 border-teal-500 text-teal-700 dark:text-teal-400 shadow-sm scale-102"
                              : hasConflict
                              ? "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            <span className="text-sm">💺</span>
                          </div>
                          <span className="text-[10px] font-black tracking-tight">{box}</span>
                          
                          {hasConflict && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[8px] px-1 font-bold shadow-xs uppercase tracking-wider scale-95 animate-pulse">
                              Ocupado
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block font-sans">Estado Inicial</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Appointment["status"])}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none dark:text-white focus:border-teal-500/50 font-medium font-sans"
                  >
                    <option value="Pending">● Pendiente por Confirmar</option>
                    <option value="Confirmed">✓ Confirmado (Listo para Box)</option>
                    <option value="Completed">Atendido / Completado</option>
                    <option value="Cancelled">Cancelado / En Espera</option>
                  </select>
                </div>

                {/* Treatment Text description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block font-bold font-sans">Procedimiento Dental</label>
                  <input
                    type="text"
                    placeholder="Ej, Raspado radicular, Sondaje, limpieza..."
                    value={formTreatment}
                    onChange={(e) => setFormTreatment(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none dark:text-white font-semibold placeholder-slate-400 font-sans"
                    required
                  />
                  
                  {/* Presets dropdown inline */}
                  <div className="pt-1.5">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block mb-1">Pre-cargar Plantillas Clínicas Rápidas</span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {CLINICAL_PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormTreatment(p)}
                          className="px-2 py-1 text-[9px] rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 hover:text-teal-600 hover:border-teal-500/30 transition-colors cursor-pointer"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Google Calendar Direct Sync Option */}
                <div className="p-3.5 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 dark:from-teal-500/10 dark:to-emerald-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-xs">
                      <GoogleGLogo className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Sincronizar directamente con Google Calendar</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isGoogleConnected 
                          ? `Se creará y actualizará el evento en tiempo real en ${googleUser?.email}` 
                          : 'Sincronización instantánea con recordatorios clínicos de 24h y 1h.'}
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formSyncWithGoogle}
                      onChange={(e) => {
                        if (!isGoogleConnected && e.target.checked) {
                          handleConnectGoogle();
                        }
                        setFormSyncWithGoogle(e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex gap-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer border-0 shadow-lg shadow-teal-500/10"
                >
                  {editingId ? "Guardar Cambios" : "Guardar Reserva"}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Google Calendar Confirmation Action Modal */}
      <ConfirmCalendarActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        actionType={confirmModal.actionType}
        appointment={confirmModal.appointment}
        totalAppointments={confirmModal.totalAppointments}
        isLoading={isCalendarLoading}
      />

      {/* Google Calendar Import Modal */}
      <GoogleImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        events={googleEvents}
        onImportEvent={handleImportSingleGoogleEvent}
        isLoading={isCalendarLoading}
        onRefresh={handleOpenImportModal}
      />

      {/* WhatsApp Individual Reminder Modal */}
      {whatsappModalState.isOpen && whatsappModalState.patient && (
        <WhatsAppReminderModal
          isOpen={whatsappModalState.isOpen}
          onClose={() => setWhatsappModalState({ isOpen: false, patient: null })}
          patient={whatsappModalState.patient}
          appointment={whatsappModalState.appointment}
          clinicName={clinicName}
          doctorName={doctorName}
          onCommunicationSent={(_newComm, updatedPat) => {
            if (onUpdatePatient) {
              onUpdatePatient(updatedPat);
            }
          }}
        />
      )}

      {/* WhatsApp Batch Reminders Modal */}
      {showBatchWhatsAppModal && (
        <WhatsAppBatchModal
          isOpen={showBatchWhatsAppModal}
          onClose={() => setShowBatchWhatsAppModal(false)}
          appointments={appointments}
          patients={patients}
          clinicName={clinicName}
          doctorName={doctorName}
          onCommunicationsBatchSent={(updatedList) => {
            if (onUpdatePatient) {
              updatedList.forEach(p => onUpdatePatient(p));
            }
          }}
        />
      )}
    </div>
  );
}

const CoffeeAndSmile = () => (
  <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center mb-3.5 border border-slate-200/50 dark:border-slate-800/60 shadow-inner">
    <Coffee className="w-6 h-6 text-slate-400 dark:text-slate-500 animate-bounce" />
  </div>
);
