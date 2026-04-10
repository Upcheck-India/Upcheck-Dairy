import { pgTable, text, serial, integer, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { animals } from "./animals";

export const vaccineType = pgEnum("vaccine_type", [
  "FMD",
  "HS",
  "BQ",
  "Brucellosis",
  "Theileriosis",
  "Anthrax",
  "PPR",
  "Other",
]);

export const vaccinations = pgTable("vaccinations", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id),
  vaccineName: text("vaccine_name").notNull(),
  vaccineType: vaccineType("vaccine_type").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  administeredDate: timestamp("administered_date"),
  batchNo: text("batch_no"),
  administeredBy: text("administered_by"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  nextDueDate: timestamp("next_due_date"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVaccinationSchema = createInsertSchema(vaccinations).omit({
  id: true,
  createdAt: true,
});

export type Vaccination = typeof vaccinations.$inferSelect;
export type InsertVaccination = z.infer<typeof insertVaccinationSchema>;
