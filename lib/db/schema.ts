import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientName: varchar("patient_name", { length: 255 }).notNull(),
  trustedContactEmail: varchar("trusted_contact_email", {
    length: 255,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
