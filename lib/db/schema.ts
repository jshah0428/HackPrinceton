import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientName: varchar("patient_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull().unique(),
  trustedContactEmail: varchar("trusted_contact_email", {
    length: 255,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const medicalHistory = pgTable("medical_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  documentType: varchar("document_type", { length: 100 }).notNull(), // e.g., "blood_test", "lab_report", "prescription", etc.
  metadata: jsonb("metadata"), // Additional info like file name, upload source, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patientsRelations = relations(patients, ({ many }) => ({
  medicalHistory: many(medicalHistory),
}));

export const medicalHistoryRelations = relations(medicalHistory, ({ one }) => ({
  patient: one(patients, {
    fields: [medicalHistory.patientId],
    references: [patients.id],
  }),
}));

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type MedicalHistory = typeof medicalHistory.$inferSelect;
export type NewMedicalHistory = typeof medicalHistory.$inferInsert;
