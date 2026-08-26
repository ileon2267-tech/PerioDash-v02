import { db } from "./index.ts";
import { patients } from "./schema.ts";
import { eq, and } from "drizzle-orm";

export async function getPatientsByUid(uid: string) {
  try {
    return await db.select().from(patients).where(eq(patients.uid, uid));
  } catch (error) {
    console.error("Database getPatientsByUid failed:", error);
    throw new Error("Failed to fetch patients from relational database.", { cause: error });
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
