import { db } from "./index.ts";
import { auditLogs } from "./schema.ts";
import { eq, desc } from "drizzle-orm";

export async function insertAuditLog(uid: string, data: {
  action: string;
  resource: string;
  resourceId?: string;
  userEmail?: string;
  details?: string;
}) {
  try {
    const result = await db
      .insert(auditLogs)
      .values({
        uid,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        userEmail: data.userEmail || null,
        details: data.details || null,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database insertAuditLog failed:", error);
    // Don't throw for non-blocking audit failures, return null
    return null;
  }
}

export async function getAuditLogsByUid(uid: string) {
  try {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.uid, uid))
      .orderBy(desc(auditLogs.timestamp))
      .limit(100);
  } catch (error) {
    console.error("Database getAuditLogsByUid failed:", error);
    throw new Error("Failed to fetch audit logs from relational database.", { cause: error });
  }
}
