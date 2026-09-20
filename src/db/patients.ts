import { db } from "./index.ts";
import { patients } from "./schema.ts";
import { eq, and } from "drizzle-orm";

export async function getPatientsByUid(uid: string) {
  try {
    return await db.select().from(patients).where(eq(patients.uid, uid));
  } catch (error: any) {
    console.warn("Notice: Cloud SQL getPatientsByUid query unavailable (database in standby):", error?.message || error);
    return [];
  }
}

export async function upsertPatient(uid: string, patientData: {
  externalId?: string;
  name: string;
  rut?: string;
  age?: number;
  email?: string;
  phone?: string;
  medicalAlert?: string;
  status?: string;
  bopPercentage?: number;
  plaquePercentage?: number;
  clinicalData?: any;
}) {
  try {
    // 1. Check if patient already exists by externalId or normalized RUT
    let existingId: number | null = null;

    if (patientData.externalId) {
      const existingByExt = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.uid, uid), eq(patients.externalId, patientData.externalId)))
        .limit(1);
      if (existingByExt.length > 0) {
        existingId = existingByExt[0].id;
      }
    }

    if (!existingId && patientData.rut) {
      const existingByRut = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.uid, uid), eq(patients.rut, patientData.rut)))
        .limit(1);
      if (existingByRut.length > 0) {
        existingId = existingByRut[0].id;
      }
    }

    // 2. If exists, update record to avoid duplication
    if (existingId) {
      const updated = await db
        .update(patients)
        .set({
          name: patientData.name,
          rut: patientData.rut || null,
          age: patientData.age || null,
          email: patientData.email || null,
          phone: patientData.phone || null,
          medicalAlert: patientData.medicalAlert || null,
          status: patientData.status || "en_tratamiento",
          bopPercentage: patientData.bopPercentage ?? null,
          plaquePercentage: patientData.plaquePercentage ?? null,
          clinicalData: patientData.clinicalData || null,
          updatedAt: new Date(),
        })
        .where(eq(patients.id, existingId))
        .returning();

      return updated[0];
    }

    // 3. Otherwise insert fresh record
    const result = await db
      .insert(patients)
      .values({
        uid,
        externalId: patientData.externalId || null,
        name: patientData.name,
        rut: patientData.rut || null,
        age: patientData.age || null,
        email: patientData.email || null,
        phone: patientData.phone || null,
        medicalAlert: patientData.medicalAlert || null,
        status: patientData.status || "en_tratamiento",
        bopPercentage: patientData.bopPercentage ?? null,
        plaquePercentage: patientData.plaquePercentage ?? null,
        clinicalData: patientData.clinicalData || null,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database upsertPatient failed:", error);
    throw new Error("Failed to save patient record in relational database.", { cause: error });
  }
}

export async function deletePatientById(uid: string, patientId: number) {
  try {
    return await db
      .delete(patients)
      .where(and(eq(patients.id, patientId), eq(patients.uid, uid)))
      .returning();
  } catch (error) {
    console.error("Database deletePatientById failed:", error);
    throw new Error("Failed to delete patient record.", { cause: error });
  }
}
