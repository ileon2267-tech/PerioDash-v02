import { Patient, Appointment } from "../types";

/**
 * Generates a collision-resistant unique identifier.
 * Combines timestamp with high-entropy cryptographic/random alphanumeric string.
 */
export function generateUniqueId(prefix: string = "pat"): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

/**
 * Deduplicates an array of Patient objects ensuring that each patient.id is strictly unique.
 * Preserves order and filters out any malformed entries.
 */
export function deduplicatePatients(patients: (Patient | null | undefined)[]): Patient[] {
  if (!Array.isArray(patients)) return [];
  const seenIds = new Set<string>();
  const cleanList: Patient[] = [];

  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    if (!patient || typeof patient !== "object") continue;

    // Ensure valid id
    let id = typeof patient.id === "string" && patient.id.trim() ? patient.id.trim() : "";
    if (!id) {
      id = generateUniqueId("pat");
      patient.id = id;
    }

    if (!seenIds.has(id)) {
      seenIds.add(id);
      cleanList.push(patient);
    }
  }

  return cleanList;
}

/**
 * Deduplicates an array of Appointment objects ensuring that each appointment.id is strictly unique.
 */
export function deduplicateAppointments(appointments: (Appointment | null | undefined)[]): Appointment[] {
  if (!Array.isArray(appointments)) return [];
  const seenIds = new Set<string>();
  const cleanList: Appointment[] = [];

  for (let i = 0; i < appointments.length; i++) {
    const app = appointments[i];
    if (!app || typeof app !== "object") continue;

    let id = typeof app.id === "string" && app.id.trim() ? app.id.trim() : "";
    if (!id) {
      id = generateUniqueId("app");
      app.id = id;
    }

    if (!seenIds.has(id)) {
      seenIds.add(id);
      cleanList.push(app);
    }
  }

  return cleanList;
}
