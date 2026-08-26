/**
 * PerioDash v15 Pro - Firestore Read Stream Interceptor & DoS Query Guard
 * Complies with HIPAA Security Rule § 164.312(b) Audit Controls & (e)(1) Transmission Security.
 * 
 * Intercepts, profiles, and analyzes all Firestore read streams and document requests in real time.
 * Detects Denial of Service (DoS) query floods, automated ePHI scraping, and cryptographic tampering.
 */

import { recordHipaaAudit } from "./hipaaAudit";

export type ThreatType = 
  | "BURST_DOS_ATTACK" 
  | "SCRAPING_EXFILTRATION" 
  | "DECRYPTION_TAMPERING_ATTACK" 
  | "HIGH_FREQUENCY_ANOMALY";

export interface FirestoreReadEvent {
  id: string;
  timestamp: number;
  collection: string;
  operation: "SNAPSHOT_LISTEN" | "DOC_GET" | "COLLECTION_QUERY";
  docCount: number;
  isEncrypted: boolean;
  error?: string;
}

export interface FirestoreThreatIncident {
  id: string;
  threatType: ThreatType;
  title: string;
  severity: "critical" | "warning";
  detectedAt: string;
  details: string;
  affectedCollection: string;
  queryBurstRate: number; // queries in short window
  mitigationStatus: "CONTAINED" | "ACTIVE_THROTTLING" | "INVESTIGATING" | "DISMISSED";
  recommendation: string;
  rawMetrics: {
    readsIn3s: number;
    readsIn60s: number;
    totalDocsInBurst: number;
  };
}

export interface FirestoreQueryMetrics {
  totalReadsIntercepted: number;
  readsLast3s: number;
  readsLast60s: number;
  peakBurstQps: number;
  activeThreatCount: number;
  isThrottlingActive: boolean;
  lastReadTimestamp: string | null;
  threats: FirestoreThreatIncident[];
}

const THREAT_STORAGE_KEY = "perio_firestore_threat_incidents";
const READ_WINDOW_3S = 3000;
const READ_WINDOW_60S = 60000;

// Security Thresholds
const BURST_QUERY_THRESHOLD_3S = 12; // > 12 reads in 3 seconds = DoS trigger
const MINUTE_QUERY_THRESHOLD_60S = 40; // > 40 reads in 60s = Scraping / Query flood trigger
const DECRYPTION_FAILURES_THRESHOLD = 3; // > 3 decryption failures = Tamper trigger

// In-memory sliding window history
const readHistory: FirestoreReadEvent[] = [];
let decryptionFailureTimestamps: number[] = [];
let totalReadsCount = 0;
let peakBurst = 0;
let isThrottled = false;

// Load persisted incidents from local storage
function loadStoredThreats(): FirestoreThreatIncident[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(THREAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error reading stored Firestore threat incidents:", e);
  }
  return [];
}

function saveStoredThreats(threats: FirestoreThreatIncident[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THREAT_STORAGE_KEY, JSON.stringify(threats.slice(0, 100)));
  } catch (e) {
    console.error("Error saving Firestore threat incidents:", e);
  }
}

let activeThreats: FirestoreThreatIncident[] = loadStoredThreats();

// Listeners for UI state reactivity
type ThreatListener = (metrics: FirestoreQueryMetrics) => void;
const threatListeners: Set<ThreatListener> = new Set();

export function subscribeToFirestoreThreats(listener: ThreatListener): () => void {
  threatListeners.add(listener);
  // Immediate trigger with current state
  listener(getFirestoreMetrics());
  return () => {
    threatListeners.delete(listener);
  };
}

function notifyThreatListeners() {
  const metrics = getFirestoreMetrics();
  threatListeners.forEach(fn => {
    try {
      fn(metrics);
    } catch (err) {
      console.warn("Threat listener error:", err);
    }
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("firestore_threat_updated", { detail: metrics }));
  }
}

/**
 * Intercepts a Firestore read execution and analyzes traffic patterns for DoS / anomalies.
 */
export function interceptFirestoreRead(
  collectionName: string,
  operation: "SNAPSHOT_LISTEN" | "DOC_GET" | "COLLECTION_QUERY" = "SNAPSHOT_LISTEN",
  docCount = 1,
  options?: { isEncrypted?: boolean; error?: string }
): void {
  const now = Date.now();
  totalReadsCount += docCount;

  const event: FirestoreReadEvent = {
    id: `read-${now}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now,
    collection: collectionName,
    operation,
    docCount,
    isEncrypted: options?.isEncrypted ?? true,
    error: options?.error,
  };

  readHistory.push(event);

  // Clean events older than 60s to prevent memory leaks
  const cutoff = now - READ_WINDOW_60S;
  while (readHistory.length > 0 && readHistory[0].timestamp < cutoff) {
    readHistory.shift();
  }

  // Count reads in rolling windows
  const readsIn3s = readHistory.filter(r => r.timestamp >= now - READ_WINDOW_3S).length;
  const readsIn60s = readHistory.length;
  const totalDocsInBurst = readHistory
    .filter(r => r.timestamp >= now - READ_WINDOW_3S)
    .reduce((acc, curr) => acc + curr.docCount, 0);

  if (readsIn3s > peakBurst) {
    peakBurst = readsIn3s;
  }

  // Check 1: Burst DoS Query Flood
  if (readsIn3s >= BURST_QUERY_THRESHOLD_3S) {
    triggerThreatIncident({
      threatType: "BURST_DOS_ATTACK",
      title: "Ráfaga Anómala de Consultas (Posible Ataque DoS)",
      severity: "critical",
      details: `Se detectaron ${readsIn3s} consultas consecutivas a la colección '${collectionName}' en menos de 3.0 segundos (${totalDocsInBurst} documentos solicitados). El volumen excede el umbral humano normal.`,
      affectedCollection: collectionName,
      queryBurstRate: readsIn3s,
      recommendation: "El interceptor activó limitación preventiva (Throttling). Se aconseja verificar la terminal o IP del cliente solicitante.",
      rawMetrics: { readsIn3s, readsIn60s, totalDocsInBurst },
    });
  }
  // Check 2: High Frequency Scraping Query Pattern
  else if (readsIn60s >= MINUTE_QUERY_THRESHOLD_60S) {
    triggerThreatIncident({
      threatType: "SCRAPING_EXFILTRATION",
      title: "Patrón de Extracción Masiva / Scraping de Expedientes",
      severity: "warning",
      details: `Frecuencia elevada de lectura acumulada: ${readsIn60s} consultas en los últimos 60 segundos hacia '${collectionName}'.`,
      affectedCollection: collectionName,
      queryBurstRate: readsIn60s,
      recommendation: "Monitorear sesión del profesional y verificar si se está ejecutando un bot o script no autorizado en la terminal.",
      rawMetrics: { readsIn3s, readsIn60s, totalDocsInBurst },
    });
  }

  notifyThreatListeners();
}

/**
 * Intercepts and tracks cryptographic decryption failures on ePHI reads.
 */
export function interceptDecryptionAnomaly(collectionName: string, docId: string, errorMsg: string): void {
  const now = Date.now();
  decryptionFailureTimestamps.push(now);

  // Clean older than 30s
  decryptionFailureTimestamps = decryptionFailureTimestamps.filter(t => t >= now - 30000);

  if (decryptionFailureTimestamps.length >= DECRYPTION_FAILURES_THRESHOLD) {
    triggerThreatIncident({
      threatType: "DECRYPTION_TAMPERING_ATTACK",
      title: "Intento de Violación Criptográfica / Manipulación ePHI",
      severity: "critical",
      details: `Se detectaron ${decryptionFailureTimestamps.length} fallos repetidos al descifrar registros en '${collectionName}' (Doc ID: ${docId}). Causa reportada: ${errorMsg}.`,
      affectedCollection: collectionName,
      queryBurstRate: decryptionFailureTimestamps.length,
      recommendation: "Bloqueo preventivo de clave. Posible ataque de inyección o intento de fuerza bruta con frase maestra incorrecta.",
      rawMetrics: { readsIn3s: decryptionFailureTimestamps.length, readsIn60s: decryptionFailureTimestamps.length, totalDocsInBurst: 0 },
    });
  }
}

function triggerThreatIncident(params: Omit<FirestoreThreatIncident, "id" | "detectedAt" | "mitigationStatus">) {
  const nowStr = new Date().toISOString();
  
  // Prevent duplicate spam within 8 seconds for the same threat type and collection
  const existingRecent = activeThreats.find(
    t => t.threatType === params.threatType && 
         t.affectedCollection === params.affectedCollection &&
         (Date.now() - new Date(t.detectedAt).getTime() < 8000)
  );

  if (existingRecent) {
    return;
  }

  isThrottled = true;

  const newIncident: FirestoreThreatIncident = {
    id: `threat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    detectedAt: nowStr,
    mitigationStatus: "ACTIVE_THROTTLING",
    ...params,
  };

  activeThreats = [newIncident, ...activeThreats];
  saveStoredThreats(activeThreats);

  // Record into immutable HIPAA Audit Trail with CRITICAL level
  recordHipaaAudit("SECURITY_ALERT", `[INTERCEPTOR FIRESTORE] ${newIncident.title} en colección '${newIncident.affectedCollection}': ${newIncident.details}`, {
    severity: newIncident.severity,
    resource: `Firestore / ${newIncident.affectedCollection}`,
    sensitiveData: {
      incidentId: newIncident.id,
      threatType: newIncident.threatType,
      burstRate: newIncident.queryBurstRate,
      metrics: newIncident.rawMetrics,
    },
  }).catch(err => {
    console.warn("Could not log threat to audit trail:", err);
  });

  // Auto restore throttling after 15 seconds
  setTimeout(() => {
    isThrottled = false;
    notifyThreatListeners();
  }, 15000);

  notifyThreatListeners();
}

/**
 * Returns the current live metrics and active threat incidents.
 */
export function getFirestoreMetrics(): FirestoreQueryMetrics {
  const now = Date.now();
  const readsLast3s = readHistory.filter(r => r.timestamp >= now - READ_WINDOW_3S).length;
  const readsLast60s = readHistory.length;

  return {
    totalReadsIntercepted: totalReadsCount,
    readsLast3s,
    readsLast60s,
    peakBurstQps: peakBurst,
    activeThreatCount: activeThreats.filter(t => t.mitigationStatus !== "DISMISSED").length,
    isThrottlingActive: isThrottled,
    lastReadTimestamp: readHistory.length > 0 ? new Date(readHistory[readHistory.length - 1].timestamp).toISOString() : null,
    threats: activeThreats,
  };
}

/**
 * Dismisses or acknowledges a detected threat incident.
 */
export function dismissFirestoreThreat(threatId: string): void {
  activeThreats = activeThreats.map(t => {
    if (t.id === threatId) {
      return { ...t, mitigationStatus: "DISMISSED" };
    }
    return t;
  });
  saveStoredThreats(activeThreats);
  notifyThreatListeners();
}

/**
 * Clears all threat incidents from history.
 */
export function clearAllFirestoreThreats(): void {
  activeThreats = [];
  saveStoredThreats([]);
  isThrottled = false;
  notifyThreatListeners();
}

/**
 * Diagnostic Tool: Simulates an attack or anomalous query burst to verify interceptor response.
 */
export function simulateSuspiciousQueryAttack(
  type: "burst_dos" | "scraping" | "decryption_tamper"
): { message: string; simulatedCount: number } {
  if (type === "burst_dos") {
    // Generate 18 rapid queries in 400ms
    for (let i = 0; i < 16; i++) {
      interceptFirestoreRead("patients", "DOC_GET", 1);
    }
    return {
      message: "Simulada ráfaga DoS de 16 consultas masivas instantáneas.",
      simulatedCount: 16,
    };
  } else if (type === "scraping") {
    for (let i = 0; i < 45; i++) {
      interceptFirestoreRead("appointments", "COLLECTION_QUERY", 2);
    }
    return {
      message: "Simulado patrón de recolección masiva de citas (45 queries).",
      simulatedCount: 45,
    };
  } else {
    for (let i = 0; i < 4; i++) {
      interceptDecryptionAnomaly("patients", `pat-tamper-test-${i}`, "Tag authentication failure (AES-GCM checksum mismatch)");
    }
    return {
      message: "Simulado ataque de manipulación criptográfica ePHI (4 fallos consecutivos).",
      simulatedCount: 4,
    };
  }
}
