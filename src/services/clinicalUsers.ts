import { ClinicalUser } from "../types";
import { safeStorage } from "../utils/safeStorage";

export const DEFAULT_CLINICAL_USERS: ClinicalUser[] = [
  {
    id: "usr-doctor-demo",
    name: "Dr. Alejandro Soto",
    email: "doctor@periodash.com",
    password: "perio",
    profile: "particular",
    role: "odontologo",
    specialty: "Periodoncia e Implantología",
    permissions: ['read_patients', 'write_patients', 'view_ephi', 'edit_ephi'],
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-admin-demo",
    name: "Director Clínico (Admin)",
    email: "admin@periodash.com",
    password: "admin",
    profile: "clinica",
    role: "admin",
    clinicId: "oficina_central",
    permissions: ['read_patients', 'write_patients', 'view_ephi', 'edit_ephi', 'audit_supervision', 'manage_users'],
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-elena-demo",
    name: "Dra. Elena Torres",
    email: "dra.elena@periodash.com",
    password: "elena",
    profile: "clinica",
    role: "supervisor",
    clinicId: "oficina_central",
    isSupervisor: true,
    specialty: "Rehabilitación Oral",
    permissions: ['read_patients', 'write_patients', 'view_ephi', 'edit_ephi', 'audit_supervision'],
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-recep-demo",
    name: "Recepción Clínica",
    email: "recepcion@periodash.com",
    password: "recep",
    profile: "clinica",
    role: "asistente",
    permissions: ['read_patients', 'write_patients'],
    createdAt: new Date().toISOString()
  }
];

export function getStoredClinicalUsers(): ClinicalUser[] {
  const saved = safeStorage.getItem("perioUsuarios");
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as ClinicalUser[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingEmails = new Set(parsed.map(u => u.email.toLowerCase()));
        const merged = [...parsed];
        for (const defU of DEFAULT_CLINICAL_USERS) {
          if (!existingEmails.has(defU.email.toLowerCase())) {
            merged.push(defU);
          }
        }
        return merged;
      }
    } catch (e) {
      // fallback
    }
  }
  return DEFAULT_CLINICAL_USERS;
}

export function findOrRegisterClinicalUserByEmail(email: string, uid?: string): ClinicalUser {
  const users = getStoredClinicalUsers();
  const cleanEmail = email.trim().toLowerCase();
  let found = users.find(u => u.email.toLowerCase() === cleanEmail);
  
  if (!found) {
    found = {
      id: uid || `usr-${Date.now()}`,
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
