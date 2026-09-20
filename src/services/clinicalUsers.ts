import { ClinicalUser } from "../types";
import { safeStorage } from "../utils/safeStorage";

/**
 * PerioDash Security Hardening - FASE 1: Paso 1.1
 * ELIMINACIÓN TOTAL DE CREDENCIALES HARDCODEADAS Y LOGIN LOCAL.
 * 
 * Ningún usuario clínico ni credencial mock/demo reside en el código fuente.
 * La única fuente de identidad y autenticación es Firebase Auth.
 */
export const DEFAULT_CLINICAL_USERS: ClinicalUser[] = [];

/**
 * Obtiene el perfil del usuario autenticado en Firebase desde la sesión protegida.
 */
export function getStoredClinicalUsers(): ClinicalUser[] {
  const saved = safeStorage.getItem("perioUsuarios");
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as ClinicalUser[];
      if (Array.isArray(parsed)) {
        // Filtrar cualquier rezago de usuarios demo hardcodeados previos
        return parsed.filter(u => !u.id.includes("-demo") && !u.email.endsWith("@periodash.com"));
      }
    } catch {
      // fallback a lista vacía
    }
  }
  return [];
}

/**
 * Resuelve o construye el perfil de usuario clínico vinculado directamente
 * al UID y Claims de Firebase Auth autenticado.
 */
export function findOrRegisterClinicalUserByEmail(email: string, uid?: string): ClinicalUser {
  const users = getStoredClinicalUsers();
  const cleanEmail = email.trim().toLowerCase();
  let found = users.find(u => u.email.toLowerCase() === cleanEmail);
  
  if (!found) {
    found = {
      id: uid || `auth-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      profile: "particular",
      role: "odontologo",
      specialty: "Odontología General",
      permissions: ['read_patients', 'write_patients', 'view_ephi', 'edit_ephi'],
      createdAt: new Date().toISOString()
    };
    const updated = [...users, found];
    safeStorage.setItem("perioUsuarios", JSON.stringify(updated));
  }
  return found;
}
