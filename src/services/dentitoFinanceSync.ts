import { useState } from 'react';

export const DENTITO_APP_URL = 'https://ais-dev-cpxttxo35jnnfot26kgjrk-419265831857.us-east1.run.app';
export const DENTITO_WEBHOOK_URL = 'https://ais-dev-cpxttxo35jnnfot26kgjrk-419265831857.us-east1.run.app/api/integrations/periodash/sync';

export interface DentitoPeriodontalData {
  patientRut?: string;
  patientName: string;
  diagnosis?: string;
  teethTreated?: string;
  treatmentName?: string;
  durationMinutes?: number;
  totalPrice?: number;
  suppliesEstimate?: number;
  doctorName?: string;
  // Alternative alias keys supported for direct payload passing
  teeth?: string;
  treatment?: string;
  chargedPrice?: number;
  suppliesCost?: number;
  specialistName?: string;
}

export interface DentitoSyncPayload {
  patientRut: string;
  patientName: string;
  diagnosis: string;
  teeth: string;
  treatment: string;
  durationMinutes: number;
  chargedPrice: number;
  suppliesCost: number;
  specialistName: string;
}

/**
 * Normalizes input data into the exact format expected by DentitoFinance webhook
 */
export function formatDentitoPayload(data: DentitoPeriodontalData): DentitoSyncPayload {
  const charged = data.totalPrice ?? data.chargedPrice ?? 0;
  const supplies = data.suppliesEstimate ?? data.suppliesCost ?? Math.round(charged * 0.15);

  return {
    patientRut: data.patientRut || 'Sin RUT',
    patientName: data.patientName || 'Paciente Periodash',
    diagnosis: data.diagnosis || 'Evaluación Periodontal Integral',
    teeth: data.teethTreated || data.teeth || 'Tratamiento Integral',
    treatment: data.treatmentName || data.treatment || 'Procedimiento Clínico',
    durationMinutes: data.durationMinutes || 60,
    chargedPrice: charged,
    suppliesCost: supplies,
    specialistName: data.doctorName || data.specialistName || 'Dra. Carolina Silva',
  };
}

/**
 * En tu proyecto Periodash v02: Ejecuta esta función al terminar o confirmar un tratamiento
 */
export async function syncTreatmentToDentitoFinance(periodontalData: DentitoPeriodontalData) {
  const payload = formatDentitoPayload(periodontalData);

  try {
    let response: Response;
    try {
      // Primary: Direct call to DentitoFinance Webhook
      response = await fetch(DENTITO_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (directErr) {
      console.warn('⚠️ Direct webhook fetch failed, trying local proxy fallback...', directErr);
      // Fallback: Local API proxy to avoid browser CORS/cross-origin session blocks
      response = await fetch('/api/integrations/dentito/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    }

    const contentType = response.headers.get('content-type') || '';
    let result: any;
    if (contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      result = { status: response.status, ok: response.ok, raw: text };
    }

    console.log('✅ Sincronizado con DentitoFinance:', result);
    return { success: true, payload, result };
  } catch (error) {
    console.error('❌ Error al sincronizar con DentitoFinance:', error);
    return { success: false, error: String(error), payload };
  }
}

/**
 * Hook para botón en ficha de Periodash v02
 */
export function useDentitoSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const sendToDentito = async (periodontalRecord: any) => {
    setSyncing(true);
    setSyncError(null);

    // Normalize if needed, ensuring required webhook keys exist
    const payload = formatDentitoPayload(periodontalRecord);

    try {
      let res: Response;
      try {
        res = await fetch(DENTITO_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (directErr) {
        console.warn('Direct fetch attempt threw error, calling proxy fallback...', directErr);
        res = await fetch('/api/integrations/dentito/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      let data: any;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { status: res.status, ok: res.ok, raw: text };
      }

      setLastResult(data);
      console.log('✅ Sincronizado con DentitoFinance:', data);

      // Safe notification feedback
      try {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert('¡Tratamiento enviado al motor financiero de DentitoFinance!');
        }
      } catch {
        // Fallback for sandboxed iframes where alert is restricted
      }

      return data;
    } catch (err: any) {
      console.error('❌ Error al sincronizar con DentitoFinance:', err);
      setSyncError(err.message || 'Error de conexión');
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  return { sendToDentito, syncing, lastResult, syncError };
}
