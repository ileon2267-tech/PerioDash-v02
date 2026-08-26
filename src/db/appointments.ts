import { db } from "./index.ts";
import { appointments } from "./schema.ts";
import { eq, and } from "drizzle-orm";

export async function getAppointmentsByUid(uid: string) {
  try {
    return await db.select().from(appointments).where(eq(appointments.uid, uid));
  } catch (error) {
    console.error("Database getAppointmentsByUid failed:", error);
    throw new Error("Failed to fetch appointments from relational database.", { cause: error });
  }
}

export async function createAppointment(uid: string, apptData: {
  patientId?: string;
  patientName: string;
  date: string;
  time: string;
  duration?: number;
  type: string;
  status?: string;
  box?: string;
  dentist?: string;
  notes?: string;
}) {
  try {
    const result = await db
      .insert(appointments)
      .values({
        uid,
        patientId: apptData.patientId || null,
        patientName: apptData.patientName,
        date: apptData.date,
        time: apptData.time,
        duration: apptData.duration ?? 45,
        type: apptData.type,
        status: apptData.status || "Confirmed",
        box: apptData.box || null,
        dentist: apptData.dentist || null,
        notes: apptData.notes || null,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database createAppointment failed:", error);
    throw new Error("Failed to record appointment in relational database.", { cause: error });
  }
}

export async function deleteAppointmentById(uid: string, apptId: number) {
  try {
    return await db
      .delete(appointments)
      .where(and(eq(appointments.id, apptId), eq(appointments.uid, uid)))
      .returning();
  } catch (error) {
    console.error("Database deleteAppointmentById failed:", error);
    throw new Error("Failed to delete appointment.", { cause: error });
  }
}
