import { db } from "./index.ts";
import { users } from "./schema.ts";
import { eq } from "drizzle-orm";

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName ? { displayName } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error: any) {
    console.warn("Notice: Cloud SQL getOrCreateUser unavailable (fallback active):", error?.message || error);
    return {
      id: 1,
      uid,
      email,
      displayName: displayName || null,
      role: "user" as const,
      createdAt: new Date(),
    };
  }
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error: any) {
    console.warn("Notice: Cloud SQL getUsers query unavailable (database in standby):", error?.message || error);
    return [];
  }
}
