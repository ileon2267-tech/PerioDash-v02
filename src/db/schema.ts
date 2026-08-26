import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table (authenticated clinicians/staff via Firebase Auth)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  displayName: text("display_name"),
  role: text("role").default("dentist"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patients table for relational queries and backups
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull(), // Owner/Clinician Firebase UID
  externalId: text("external_id"),
  name: text("name").notNull(),
  rut: text("rut"),
  age: integer("age"),
  email: text("email"),
  phone: text("phone"),
  medicalAlert: text("medical_alert"),
  status: text("status").default("en_tratamiento"),
  bopPercentage: integer("bop_percentage"),
  plaquePercentage: integer("plaque_percentage"),
  clinicalData: jsonb("clinical_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointments table for relational chair scheduling & analytics
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull(), // Clinician Firebase UID
  patientId: text("patient_id"),
  patientName: text("patient_name").notNull(),
  date: text("date").notNull(), // Format YYYY-MM-DD
  time: text("time").notNull(), // Format HH:MM
  duration: integer("duration").default(45),
  type: text("type").notNull(),
  status: text("status").default("Confirmed"),
  box: text("box"),
  dentist: text("dentist"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs table for HIPAA/GDPR compliance
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull(),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  userEmail: text("user_email"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  patients: many(patients),
  appointments: many(appointments),
  auditLogs: many(auditLogs),
}));

export const patientsRelations = relations(patients, ({ one }) => ({
  author: one(users, {
    fields: [patients.uid],
    references: [users.uid],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  author: one(users, {
    fields: [appointments.uid],
    references: [users.uid],
  }),
}));
