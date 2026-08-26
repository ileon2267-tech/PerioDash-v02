import { Patient, Appointment, PatientCommunication } from "../types";
import { recordHipaaAudit } from "../utils/hipaaAudit";

export type WhatsAppTemplateId = 
  | "recordatorio_estandar"
  | "confirmacion_rapida"
  | "instrucciones_prequirurgicas"
  | "mantenimiento_periodontal"
  | "reprogramacion_aviso"
  | "seguimiento_postoperatorio";

export interface WhatsAppTemplateConfig {
  id: WhatsAppTemplateId;
  title: string;
  category: "recordatorio" | "confirmacion" | "indicaciones" | "seguimiento";
  badge: string;
  badgeColor: string;
  description: string;
  renderText: (params: {
    patient: Patient;
    appointment?: Appointment;
    clinicName: string;
    doctorName: string;
    customNote?: string;
  }) => string;
}

export interface WhatsAppSendResult {
  success: boolean;
  method: "twilio" | "wa_me_ready" | "twilio_failed_fallback_ready";
  provider: "twilio_api" | "wa_me_direct";
  messageSid?: string;
  waMeUrl: string;
  message: string;
  error?: string;
}

export function createFallbackPatient(id: string, name: string, phone: string = ""): Patient {
  return {
    id,
    name,
    phone,
    email: "",
    birthdate: "1990-01-01",
    notes: "",
    createdAt: new Date().toISOString().split("T")[0],
    status: "en_tratamiento",
    odontogram: {},
    periodontogram: {},
    oLeary: {},
    xRays: [],
    treatmentPlan: {
      procedures: [],
      financing: { months: 1, downPayment: 0, interestRate: 0 }
    },
    evolutions: [],
    communications: [],
    anamnesis: {
      hta: false,
      diabetes: false,
      tabaquismo: 0,
      alergias: "",
      dolorActual: "ninguno",
      notasSistemicas: ""
    }
  };
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplateConfig[] = [
  {
    id: "recordatorio_estandar",
    title: "Recordatorio Estándar de Cita",
    category: "recordatorio",
    badge: "Más Utilizado",
    badgeColor: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
    description: "Mensaje cordial de recordatorio con fecha, hora, doctor y solicitud de confirmación.",
    renderText: ({ patient, appointment, clinicName, doctorName, customNote }) => {
      const dateStr = appointment?.date || "fecha programada";
      const timeStr = appointment?.time || "hora acordada";
      const treatment = appointment?.treatment || "Control y Evaluación Odontológica";
      const doctor = doctorName || "Cirujano Dentista";
      const clinic = clinicName || "PerioClinic Pro";

      let text = `🦷 *${clinic} - Recordatorio de Cita Odontológica*\n\n` +
        `Hola *${patient.name}*, te recordamos tu próxima atención clínica:\n\n` +
        `📅 *Fecha:* ${dateStr}\n` +
        `⏰ *Hora:* ${timeStr} hrs\n` +
        `🩺 *Procedimiento:* ${treatment}\n` +
        `👨‍⚕️ *Profesional:* ${doctor}\n\n` +
        `📍 *Ubicación:* ${clinic}\n\n` +
        `👉 *Por favor responde este mensaje con un "CONFIRMO"* para asegurar tu horario en agenda o avísanos con anticipación si necesitas reprogramar.\n\n` +
        `¡Te esperamos para cuidar de tu salud bucodental! ✨`;

      if (customNote && customNote.trim()) {
        text += `\n\n📌 *Nota de la clínica:* ${customNote.trim()}`;
      }
      return text;
    }
  },
  {
    id: "confirmacion_rapida",
    title: "Confirmación Rápida con 1 Clic",
    category: "confirmacion",
    badge: "Respuesta Inmediata",
    badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    description: "Formato ágil para confirmar asistencia con números clave y política de puntualidad.",
    renderText: ({ patient, appointment, clinicName, doctorName }) => {
      const dateStr = appointment?.date || "tu cita agendada";
      const timeStr = appointment?.time || "la hora prevista";
      const clinic = clinicName || "PerioClinic Pro";

      return `👋 Hola *${patient.name}*!\n\n` +
        `En *${clinic}* estamos preparando todo para tu atención del *${dateStr}* a las *${timeStr} hrs*.\n\n` +
        `Por favor confirma tu disponibilidad seleccionando una opción:\n` +
        `1️⃣ *CONFIRMAR ASISTENCIA*\n` +
        `2️⃣ *SOLICITAR REPROGRAMACIÓN*\n\n` +
        `⏱️ _Recomendamos llegar 10 minutos antes para tu ingreso y actualización de antecedentes clínicos._`;
    }
  },
  {
    id: "instrucciones_prequirurgicas",
    title: "Instrucciones Pre-Tratamiento / Cirugía",
    category: "indicaciones",
    badge: "Seguridad Quirúrgica",
    badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    description: "Protocolo de preparación para raspado subgingival, cirugía periodontal, implantes o endodoncia.",
    renderText: ({ patient, appointment, clinicName, doctorName, customNote }) => {
      const dateStr = appointment?.date || "tu fecha quirúrgica";
      const timeStr = appointment?.time || "hora citada";
      const treatment = appointment?.treatment || "Procedimiento Quirúrgico / Periodontal";
      const clinic = clinicName || "PerioClinic Pro";

      let text = `⚠️ *Instrucciones Previas a tu Procedimiento - ${clinic}*\n\n` +
        `Estimado/a *${patient.name}*, para tu atención de *${treatment}* programada para el *${dateStr} a las ${timeStr} hrs*, te solicitamos tener en cuenta:\n\n` +
        `1. 🥪 *Alimentación:* Ingerir una comida ligera previa (no acudir en ayunas salvo sedación indicada).\n` +
        `2. 💊 *Medicamentos:* Tomar tu medicación habitual (antihipertensivos, etc.) salvo indicación médica expresa.\n` +
        `3. 👕 *Vestimenta:* Acudir con ropa cómoda y holgada.\n` +
        `4. 🚗 *Acompañante:* Se sugiere venir acompañado/a si se administrará anestesia local profunda o sedación.\n` +
        `5. 🪥 *Higiene:* Realizar un cepillado dental minucioso antes de asistir.\n\n` +
        `Ante cualquier síntoma febril o duda previa, escríbenos de inmediato.`;

      if (customNote && customNote.trim()) {
        text += `\n\n📌 *Indicación especial:* ${customNote.trim()}`;
      }
      return text;
    }
  },
  {
    id: "mantenimiento_periodontal",
    title: "Control de Mantenimiento Periodontal (SPT)",
    category: "recordatorio",
    badge: "Salud Periodontal",
    badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    description: "Recordatorio semestral de terapia periodontal de soporte para prevenir recidivas y sangrado.",
    renderText: ({ patient, appointment, clinicName }) => {
      const dateStr = appointment?.date || "próximos días";
      const timeStr = appointment?.time || "hora agendada";
      const clinic = clinicName || "PerioClinic Pro";

      return `🌿 *Control de Salud de Encías - ${clinic}*\n\n` +
        `Hola *${patient.name}*, te recordamos que el control periódico de soporte periodontal es fundamental para mantener tus encías desinflamadas, libres de sangrado y proteger el hueso de soporte.\n\n` +
        `📅 Tu sesión de mantenimiento y pulido está reservada para el *${dateStr} a las ${timeStr} hrs*.\n\n` +
        `¡Sigamos cuidando tu sonrisa juntos! Escríbenos para confirmar tu asistencia.`;
    }
  },
  {
    id: "reprogramacion_aviso",
    title: "Aviso de Modificación / Reagendamiento",
    category: "indicaciones",
    badge: "Gestión de Horario",
    badgeColor: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
    description: "Aviso informativo cuando se actualiza el horario o sillón de la cita.",
    renderText: ({ patient, appointment, clinicName, doctorName, customNote }) => {
      const dateStr = appointment?.date || "nueva fecha";
      const timeStr = appointment?.time || "nuevo horario";
      const clinic = clinicName || "PerioClinic Pro";

      let text = `🔄 *Actualización de Agenda - ${clinic}*\n\n` +
        `Estimado/a *${patient.name}*, te informamos que tu cita con el/la *${doctorName || "Doctor/a"}* ha sido actualizada:\n\n` +
        `🗓️ *Nueva Fecha:* ${dateStr}\n` +
        `⏰ *Nuevo Horario:* ${timeStr} hrs\n` +
        `🏢 *Lugar:* ${clinic}\n\n` +
        `Por favor confírmanos si este nuevo horario se acomoda correctamente a tus tiempos.`;

      if (customNote && customNote.trim()) {
        text += `\n\n📌 *Detalle:* ${customNote.trim()}`;
      }
      return text;
    }
  },
  {
    id: "seguimiento_postoperatorio",
    title: "Seguimiento Post-Atención Odontológica",
    category: "seguimiento",
    badge: "Cuidados en Casa",
    badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    description: "Chequeo al día siguiente tras raspado, endodoncia o cirugía dental.",
    renderText: ({ patient, clinicName, customNote }) => {
      const clinic = clinicName || "PerioClinic Pro";

      let text = `🩺 *Control Post-Tratamiento - ${clinic}*\n\n` +
        `Hola *${patient.name}*, ¿cómo te sientes hoy tras tu atención odontológica?\n\n` +
        `Recordatorios de recuperación:\n` +
        `• Mantén la toma de tus medicamentos analgésicos o antibióticos según tu receta.\n` +
        `• Aplica compresas frías locales si presentas leve inflamación.\n` +
        `• Dieta blanda y evita alimentos duros o muy calientes.\n` +
        `• Higiene suave sin lastimar la zona tratada.\n\n` +
        `Si presentas cualquier molestia persistente, dolor agudo o dudas, estamos a tu disposición por esta misma vía.`;

      if (customNote && customNote.trim()) {
        text += `\n\n📌 *Nota del tratante:* ${customNote.trim()}`;
      }
      return text;
    }
  }
];

export async function checkTwilioConfigStatus(): Promise<{
  twilioConfigured: boolean;
  fromNumber: string;
  accountSidMasked?: string | null;
  provider: "twilio_api" | "wa_me_direct";
}> {
  try {
    const res = await fetch("/api/whatsapp/config");
    if (!res.ok) {
      return { twilioConfigured: false, fromNumber: "+14155238886", provider: "wa_me_direct" };
    }
    return await res.json();
  } catch {
    return { twilioConfigured: false, fromNumber: "+14155238886", provider: "wa_me_direct" };
  }
}

export async function sendWhatsAppReminder(params: {
  patient: Patient;
  appointment?: Appointment;
  message: string;
  templateType: string;
  forceDirectLink?: boolean;
}): Promise<WhatsAppSendResult> {
  const { patient, appointment, message, templateType, forceDirectLink } = params;

  try {
    const response = await fetch("/api/whatsapp/send-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: patient.id,
        patientName: patient.name,
        phoneNumber: patient.phone,
        message,
        templateType,
        appointmentId: appointment?.id,
        appointmentDate: appointment?.date,
        appointmentTime: appointment?.time,
        forceDirectLink: Boolean(forceDirectLink)
      })
    });

    const data: WhatsAppSendResult = await response.json();

    // Log HIPAA Audit event
    recordHipaaAudit("COMMUNICATION_SENT", `Envío de recordatorio WhatsApp (${data.provider}) al paciente ${patient.name}. Plantilla: ${templateType}.`, {
      patientId: patient.id,
      patientName: patient.name,
      resource: `WhatsApp Reminder (${templateType})`,
      severity: "info"
    });

    return data;
  } catch (error: any) {
    // Generate direct wa.me fallback on network error
    const digitsOnly = (patient.phone || "").replace(/[^0-9]/g, "");
    const waMeUrl = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
    
    return {
      success: true,
      method: "wa_me_ready",
      provider: "wa_me_direct",
      waMeUrl,
      message: "Red no disponible para API Twilio; enlace directo de WhatsApp generado para envío inmediato.",
      error: error.message || String(error)
    };
  }
}
