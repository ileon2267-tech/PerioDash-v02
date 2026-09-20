/**
 * Gmail Service for PerioDash
 * OAuth 2.0 Integration with Google Identity Services (GSI) & Gmail REST API v1
 */

import { safeStorage } from "../utils/safeStorage";

const CLIENT_ID = "419265831857-410aon0ug7fofnfgk26k4t4evn1u0264.apps.googleusercontent.com";
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify"
].join(" ");

export interface GmailUserProfile {
  emailAddress: string;
  messagesTotal?: number;
  threadsTotal?: number;
  historyId?: string;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  bodyHtml?: string;
  bodyText?: string;
  isUnread?: boolean;
  internalDate?: string;
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  contentBase64: string;
}

// In-memory cache for the access token (Never store access tokens in localStorage/storage for security)
let cachedToken: string | null = null;
let tokenExpiration: number = 0;
let tokenClient: any = null;

// Clean up any legacy tokens from storage on load
try {
  safeStorage.removeItem("perio_gmail_token");
  safeStorage.removeItem("perio_gmail_token_exp");
} catch {}

export function isGmailConnected(): boolean {
  if (!cachedToken) return false;
  return Date.now() < tokenExpiration;
}

export function getGmailToken(): string | null {
  if (isGmailConnected()) {
    return cachedToken;
  }
  return null;
}

export function disconnectGmail(): void {
  cachedToken = null;
  tokenExpiration = 0;
  safeStorage.removeItem("perio_gmail_token");
  safeStorage.removeItem("perio_gmail_token_exp");
  safeStorage.removeItem("perio_gmail_user_email");
}

const ensureGsiLoaded = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  if ((window as any).google?.accounts?.oauth2) return true;
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};

export async function initGmailAuth(forcePrompt = false): Promise<string> {
  await ensureGsiLoaded();
  return new Promise((resolve, reject) => {
    if (isGmailConnected() && !forcePrompt) {
      resolve(cachedToken!);
      return;
    }

    const checkGsi = () => {
      const google = (window as any).google;
      if (!google || !google.accounts || !google.accounts.oauth2) {
        return false;
      }
      return true;
    };

    if (!checkGsi()) {
      reject(new Error("Google Identity Services SDK no disponible. Verifique su conexión a internet."));
      return;
    }

    try {
      const google = (window as any).google;
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: GMAIL_SCOPES,
        prompt: forcePrompt ? "consent" : "",
        callback: (response: any) => {
          if (response.error !== undefined) {
            reject(response);
            return;
          }
          const token = response.access_token;
          const expiresIn = response.expires_in || 3599;
          cachedToken = token;
          tokenExpiration = Date.now() + expiresIn * 1000;
          
          getGmailProfile(token)
            .then(profile => {
              if (profile?.emailAddress) {
                safeStorage.setItem("perio_gmail_user_email", profile.emailAddress);
              }
            })
            .catch(() => {});

          resolve(token);
        },
      });

      tokenClient.requestAccessToken({ prompt: forcePrompt ? "consent" : "" });
    } catch (err) {
      reject(err);
    }
  });
}

export async function getGmailProfile(customToken?: string): Promise<GmailUserProfile | null> {
  const token = customToken || getGmailToken();
  if (!token) return null;

  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        disconnectGmail();
      }
      throw new Error(`Error en API Gmail (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Error fetching Gmail profile:", e);
    return null;
  }
}

function utf8ToBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildMimeMessage(
  from: string,
  to: string,
  subject: string,
  bodyText: string,
  bodyHtml?: string,
  attachments: EmailAttachment[] = []
): string {
  const boundary = `====_PerioDash_Boundary_${Date.now()}_====`;
  const cleanSubject = subject.replace(/[\r\n]/g, " ");

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(cleanSubject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
  ];

  let body = headers.join("\r\n");

  const altBoundary = `====_PerioDash_Alt_${Date.now()}_====`;
  body += `--${boundary}\r\n`;
  body += `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n\r\n`;

  body += `--${altBoundary}\r\n`;
  body += `Content-Type: text/plain; charset=UTF-8\r\n`;
  body += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
  body += `${bodyText}\r\n\r\n`;

  if (bodyHtml) {
    body += `--${altBoundary}\r\n`;
    body += `Content-Type: text/html; charset=UTF-8\r\n`;
    body += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    body += `${bodyHtml}\r\n\r\n`;
  }

  body += `--${altBoundary}--\r\n\r\n`;

  for (const att of attachments) {
    body += `--${boundary}\r\n`;
    body += `Content-Type: ${att.mimeType}; name="${att.filename}"\r\n`;
    body += `Content-Disposition: attachment; filename="${att.filename}"\r\n`;
    body += `Content-Transfer-Encoding: base64\r\n\r\n`;
    body += `${att.contentBase64}\r\n\r\n`;
  }

  body += `--${boundary}--`;
  return body;
}

export async function sendGmailMessage(
  to: string,
  subject: string,
  bodyText: string,
  bodyHtml?: string,
  attachments: EmailAttachment[] = []
): Promise<{ id: string; threadId: string }> {
  const token = await initGmailAuth();
  const userEmail = safeStorage.getItem("perio_gmail_user_email") || "me";

  const rawMime = buildMimeMessage(userEmail, to, subject, bodyText, bodyHtml, attachments);
  const base64UrlEncoded = utf8ToBase64Url(rawMime);

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: base64UrlEncoded,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      disconnectGmail();
    }
    throw new Error(errData?.error?.message || `Error al enviar correo vía Gmail (${res.status})`);
  }

  return await res.json();
}

function decodeBase64Url(input: string): string {
  try {
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return "";
  }
}

function extractBodyFromPayload(payload: any): { html: string; text: string } {
  let html = "";
  let text = "";

  if (!payload) return { html, text };

  if (payload.body && payload.body.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === "text/html") {
      html = decoded;
    } else if (payload.mimeType === "text/plain") {
      text = decoded;
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const partResult = extractBodyFromPayload(part);
      if (partResult.html && !html) html = partResult.html;
      if (partResult.text && !text) text = partResult.text;
    }
  }

  return { html, text };
}

export async function fetchGmailMessages(query = "", maxResults = 15): Promise<GmailMessage[]> {
  const token = await initGmailAuth();

  const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  if (query) url.searchParams.set("q", query);
  url.searchParams.set("maxResults", maxResults.toString());

  const listRes = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!listRes.ok) {
    if (listRes.status === 401) disconnectGmail();
    throw new Error(`Error al listar correos (${listRes.status})`);
  }

  const listData = await listRes.json();
  const rawList: Array<{ id: string; threadId: string }> = listData.messages || [];

  if (rawList.length === 0) return [];

  const detailPromises = rawList.slice(0, maxResults).map(async (item) => {
    try {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!detailRes.ok) return null;
      const detail = await detailRes.json();

      const headers: GmailMessageHeader[] = detail.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      const body = extractBodyFromPayload(detail.payload);

      const msg: GmailMessage = {
        id: detail.id,
        threadId: detail.threadId,
        labelIds: detail.labelIds || [],
        snippet: detail.snippet || "",
        from: getHeader("From"),
        to: getHeader("To"),
        subject: getHeader("Subject") || "(Sin asunto)",
        date: getHeader("Date"),
        internalDate: detail.internalDate,
        isUnread: (detail.labelIds || []).includes("UNREAD"),
        bodyHtml: body.html,
        bodyText: body.text || detail.snippet,
      };

      return msg;
    } catch {
      return null;
    }
  });

  const resolved = await Promise.all(detailPromises);
  return resolved.filter((m): m is GmailMessage => m !== null);
}

export const CLINICAL_EMAIL_TEMPLATES = {
  prescription: (patientName: string, doctorName: string, clinicName: string, medsSummary: string, indications: string) => ({
    subject: `Receta Odontológica y Plan Farmacológico - ${patientName}`,
    bodyText: `Estimado(a) ${patientName}:\n\nAdjuntamos la indicación farmacológica emitida por ${doctorName} en ${clinicName}.\n\nMedicamentos:\n${medsSummary}\n\nInstrucciones:\n${indications}\n\nAnte cualquier consulta o reacción adversa, contáctenos de inmediato.\n\nAtentamente,\n${doctorName}\n${clinicName}`,
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0d9488, #059669); padding: 18px; border-radius: 8px; color: #ffffff; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">${clinicName}</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Receta Digital y Prescripción Odontológica</p>
        </div>
        <p style="font-size: 15px; margin-bottom: 15px;">Estimado(a) <strong>${patientName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #475569;">A continuación se detalla su indicación farmacológica prescrita por <strong>${doctorName}</strong>:</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #0d9488; padding: 14px; border-radius: 6px; margin: 18px 0;">
          <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 14px;">Medicamentos Prescritos:</h4>
          <div style="font-size: 13px; white-space: pre-line; color: #334155;">${medsSummary}</div>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; margin: 18px 0;">
          <h4 style="margin: 0 0 6px 0; color: #15803d; font-size: 13px;">Instrucciones Clínicas:</h4>
          <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.4;">${indications}</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          Mensaje confidencial emitido a través del sistema clínico PerioDash.<br/>
          Cumple con estándares de privacidad y seguridad de datos de salud (HIPAA / GDPR).
        </p>
      </div>
    `,
  }),

  appointmentReminder: (patientName: string, dateStr: string, timeStr: string, doctorName: string, clinicName: string, reason: string) => ({
    subject: `Recordatorio de Cita Odontológica - ${clinicName}`,
    bodyText: `Hola ${patientName}:\n\nTe recordamos tu próxima cita odontológica:\n\nFecha: ${dateStr}\nHora: ${timeStr}\nEspecialista: ${doctorName}\nMotivo: ${reason}\n\nPor favor confirmar o avisar con anticipación en caso de requerir reagendar.\n\n${clinicName}`,
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0f766e, #047857); padding: 16px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px;">${clinicName}</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Confirmación de Cita Clínica</p>
        </div>
        <p style="font-size: 15px;">Hola <strong>${patientName}</strong>,</p>
        <p style="font-size: 14px; color: #475569;">Le recordamos los datos de su próxima sesión odontológica:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #64748b;">📅 Fecha:</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #64748b;">⏰ Hora:</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${timeStr}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #64748b;">👨‍⚕️ Profesional:</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; color: #64748b;">🦷 Procedimiento:</td>
            <td style="padding: 10px; font-weight: bold; color: #0d9488;">${reason}</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; padding: 14px; border-radius: 8px; font-size: 13px; color: #64748b; text-align: center;">
          Si necesita reprogramar o tiene alguna duda previa, comuníquese con nuestra recepción.
        </div>
      </div>
    `,
  }),

  postOpInstructions: (patientName: string, procedureName: string, doctorName: string, clinicName: string) => ({
    subject: `Instrucciones y Cuidados Postoperatorios - ${procedureName}`,
    bodyText: `Estimado(a) ${patientName}:\n\nEsperamos que se encuentre bien tras su procedimiento de ${procedureName}.\n\nCuidados clave:\n1. Morder la gasa firmemente por 30-45 minutos si corresponde.\n2. No enjuagarse la boca ni escupir con fuerza las primeras 24 hrs.\n3. Dieta blanda y fría/tibia.\n4. Aplicar frío local intermitente.\n5. Tomar los medicamentos según su receta.\n\n${doctorName} - ${clinicName}`,
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0d9488, #0284c7); padding: 18px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 19px;">Cuidados Post-Tratamiento</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Procedimiento: ${procedureName}</p>
        </div>
        <p style="font-size: 15px;">Estimado(a) <strong>${patientName}</strong>,</p>
        <p style="font-size: 14px; color: #475569;">Para garantizar una recuperación óptima y prevenir complicaciones, siga estas indicaciones:</p>
        
        <ol style="font-size: 14px; color: #334155; line-height: 1.6; padding-left: 20px;">
          <li><strong>Higiene y coágulo:</strong> No escupa, no use bombilla ni se enjuague enérgicamente durante las primeras 24 horas.</li>
          <li><strong>Alimentación:</strong> Prefiera alimentos blandos y fríos o a temperatura ambiente. Evite comidas calientes, picantes o duras.</li>
          <li><strong>Inflamación:</strong> Aplique compresas frías en la zona externa por intervalos de 15 minutos.</li>
          <li><strong>Reposo:</strong> Evite actividad física extenuante y exposición directa al sol.</li>
          <li><strong>Medicación:</strong> Tome los analgésicos/antibióticos prescritos puntualmente en el horario indicado.</li>
        </ol>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px; margin-top: 18px;">
          <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: bold;">
            🚨 Ante dolor severo que no cede, sangrado continuo o fiebre, contáctenos inmediatamente.
          </p>
        </div>
      </div>
    `,
  }),

  treatmentQuote: (patientName: string, doctorName: string, clinicName: string, totalBudget: string, itemsList: string) => ({
    subject: `Presupuesto y Plan de Tratamiento Periodontal - ${patientName}`,
    bodyText: `Estimado(a) ${patientName}:\n\nLe enviamos el presupuesto detallado de su plan de tratamiento elaborado por ${doctorName}.\n\nDetalle:\n${itemsList}\n\nTotal Estimado: ${totalBudget}\n\nQuedamos a su disposición para resolver dudas.\n\n${clinicName}`,
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #047857, #0d9488); padding: 18px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px;">${clinicName}</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Plan de Tratamiento y Presupuesto Odontológico</p>
        </div>
        <p style="font-size: 15px;">Estimado(a) <strong>${patientName}</strong>,</p>
        <p style="font-size: 14px; color: #475569;">A continuación le presentamos el presupuesto de los procedimientos recomendados:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 18px 0;">
          <div style="font-size: 14px; color: #334155; white-space: pre-line;">${itemsList}</div>
          <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 14px 0;" />
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #0f172a;">
            <span>Inversión Total Estimada:</span>
            <span style="color: #047857;">${totalBudget}</span>
          </div>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          * Contamos con opciones de pago en cuotas y convenios. Validez de presupuesto: 30 días.
        </p>
      </div>
    `,
  })
};
