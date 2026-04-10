import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { animals } from "./animals";

export const breedingEventType = pgEnum("breeding_event_type", [
  "heat",
  "insemination",
  "pregnancy_confirmed",
  "dry_off",
  "calving",
  "abort",
]);

export const breedingEvents = pgTable("breeding_events", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id),
  eventType: breedingEventType("event_type").notNull(),
  date: timestamp("date").notNull(),
  note: text("note"),
  bullName: text("bull_name"),
  expectedCalvingDate: timestamp("expected_calving_date"),
  calvingGender: text("calving_gender"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBreedingEventSchema = createInsertSchema(breedingEvents).omit({
  id: true,
  createdAt: true,
});

export type BreedingEvent = typeof breedingEvents.$inferSelect;
export type InsertBreedingEvent = z.infer<typeof insertBreedingEventSchema>;
