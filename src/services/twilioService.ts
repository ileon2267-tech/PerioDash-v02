import { Patient, Appointment, PatientCommunication } from "../types";
import { recordHipaaAudit } from "../utils/hipaaAudit";
import { 
  WHATSAPP_TEMPLATES, 
  WhatsAppTemplateId, 
  WhatsAppTemplateConfig,
  WhatsAppSendResult,
  createFallbackPatient
} from "./whatsappReminderService";

/**
 * Interface representing Twilio WhatsApp configuration status
 * utilizing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER.
 */
export interface TwilioServiceConfig {
  twilioConfigured: boolean;
  fromNumber: string;
  accountSidMasked?: string | null;
  provider: "twilio_api" | "wa_me_direct";
}

/**
 * Payload parameters for sending a Twilio WhatsApp message
 */
export interface SendTwilioMessageParams {
  to: string;
  message: string;
  patientId?: string;
  patientName?: string;
  appointmentId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  templateType?: string;
  forceDirectLink?: boolean;
}

/**
 * Helper parameters for generating dynamic appointment reminder messages
 */
export interface GenerateReminderMessageParams {
  patientName: string;
  date: string;
  time: string;
  clinicName: string;
  treatment?: string;
  doctorName?: string;
  customNote?: string;
}

/**
 * Helper function that dynamically generates an appointment reminder message
 * including the patient's name, date, time, clinic name, treatment, and doctor.
 */
export function generateAppointmentReminderMessage(params: GenerateReminderMessageParams): string {
  const {
    patientName,
    date,
    time,
    clinicName,
    treatment,
    doctorName,
    customNote
  } = params;

  let formattedDate = date;
  try {
    if (date.includes("-")) {
      const [y, m, d] = date.split("-").map(Number);
      const dObj = new Date(y, m - 1, d);
      formattedDate = dObj.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
  } catch {
    formattedDate = date;
  }

  let text = `👋 Estimado/a *${patientName}*,\n\n`;
  text += `Le recordamos su próxima cita odontológica en *${clinicName}*:\n\n`;
  text += `📅 *Fecha:* ${formattedDate}\n`;
  text += `⏰ *Hora:* ${time} hrs\n`;
  
  if (treatment) {
    text += `🦷 *Tratamiento:* ${treatment}\n`;
  }
  
  if (doctorName) {
    text += `👨‍⚕️ *Profesional:* ${doctorName}\n`;
  }

  if (customNote && customNote.trim()) {
    text += `\n📝 *Indicación:* ${customNote.trim()}\n`;
  }

  text += `\n📍 *Ubicación:* ${clinicName}\n`;
  text += `Por favor, responda a este mensaje con un *SÍ* para confirmar su asistencia o contáctenos si requiere reprogramar.\n\n`;
  text += `_¡Agradecemos su puntualidad y confianza!_`;

  return text;
}

/**
 * Twilio Service for Automated WhatsApp Patient Reminders & Clinical Communications
 * 
 * Features:
 * - Uses TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER on the server layer for authentication.
 * - Dispatches official Twilio WhatsApp API requests with REST basic auth.
 * - Provides automatic fallback to direct WhatsApp (wa.me) links when offline or unconfigured.
 * - Logs all communication events into the HIPAA / PII audit trail.
 */
export const twilioService = {
  /**
   * Check connection status of the Twilio WhatsApp REST API backend
   * (Verifies presence of TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER)
   */
  async checkStatus(): Promise<TwilioServiceConfig> {
    try {
      const res = await fetch("/api/whatsapp/config");
      if (!res.ok) {
        return { 
          twilioConfigured: false, 
          fromNumber: "+14155238886", 
          provider: "wa_me_direct" 
        };
      }
      return await res.json();
    } catch {
      return { 
        twilioConfigured: false, 
        fromNumber: "+14155238886", 
        provider: "wa_me_direct" 
      };
    }
  },

  /**
   * Send a WhatsApp message using Twilio API (or fallback to wa.me)
   */
  async sendMessage(params: SendTwilioMessageParams): Promise<WhatsAppSendResult> {
    const { 
      to, 
      message, 
      patientId, 
      patientName, 
      appointmentId, 
      appointmentDate, 
      appointmentTime, 
      templateType = "custom",
      forceDirectLink = false 
    } = params;

    try {
      const response = await fetch("/api/whatsapp/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientId || "unknown",
          patientName: patientName || "Paciente",
          phoneNumber: to,
          message,
          templateType,
          appointmentId,
          appointmentDate,
          appointmentTime,
          forceDirectLink: Boolean(forceDirectLink)
        })
      });

      const data: WhatsAppSendResult = await response.json();

      // Log HIPAA Audit event
      if (patientId) {
        recordHipaaAudit(
          "COMMUNICATION_SENT",
          `Envío de WhatsApp (${data.provider}) a ${patientName || to}. Plantilla: ${templateType}.`,
          {
            patientId,
            patientName: patientName || "Paciente",
            resource: `Twilio WhatsApp (${templateType})`,
            severity: "info"
          }
        );
      }

      return data;
    } catch (error: any) {
      const digitsOnly = (to || "").replace(/[^0-9]/g, "");
      const waMeUrl = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
      
      return {
        success: true,
        method: "wa_me_ready",
        provider: "wa_me_direct",
        waMeUrl,
        message: "Enlace directo de WhatsApp generado exitosamente para envío inmediato.",
        error: error.message || String(error)
      };
    }
  },

  /**
   * Send an automated WhatsApp reminder specifically for an appointment
   */
  async sendAppointmentReminder(params: {
    patient: Patient;
    appointment: Appointment;
    templateId?: WhatsAppTemplateId;
    clinicName?: string;
    doctorName?: string;
    customNote?: string;
    forceDirectLink?: boolean;
  }): Promise<WhatsAppSendResult> {
    const {
      patient,
      appointment,
      templateId = "recordatorio_estandar",
      clinicName = "PerioClinic Pro",
      doctorName = "Cirujano Dentista",
      customNote = "",
      forceDirectLink = false
    } = params;

    const template = WHATSAPP_TEMPLATES.find(t => t.id === templateId) || WHATSAPP_TEMPLATES[0];
    const message = template.renderText({
      patient,
      appointment,
      clinicName,
      doctorName,
      customNote
    });

    return await this.sendMessage({
      to: patient.phone,
      message,
      patientId: patient.id,
      patientName: patient.name,
      appointmentId: appointment.id,
      appointmentDate: appointment.date,
      appointmentTime: appointment.time,
      templateType: templateId,
      forceDirectLink
    });
  },

  /**
   * Get all predefined clinical WhatsApp templates
   */
  getTemplates(): WhatsAppTemplateConfig[] {
    return WHATSAPP_TEMPLATES;
  },

  /**
   * Generate a direct WhatsApp web/mobile URL (wa.me)
   */
  getDirectWhatsAppUrl(params: {
    phone: string;
    message: string;
  }): string {
    const cleanDigits = (params.phone || "").replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(params.message)}`;
  },

  /**
   * Helper to dynamically format an appointment reminder text with patient, date, time, clinicName, etc.
   */
  generateReminderMessage: generateAppointmentReminderMessage,

  /**
   * Helper to create fallback patient when patient is not in local state
   */
  createFallbackPatient
};

/**
 * Top-level standalone function to send WhatsApp messages using the Twilio API
 * Authenticated via TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER
 */
export async function sendTwilioWhatsAppMessage(
  params: SendTwilioMessageParams
): Promise<WhatsAppSendResult> {
  return await twilioService.sendMessage(params);
}

export default twilioService;
export {
  WHATSAPP_TEMPLATES,
  generateAppointmentReminderMessage as buildAppointmentReminderMessage,
  type WhatsAppTemplateId,
  type WhatsAppTemplateConfig,
  type WhatsAppSendResult
};
