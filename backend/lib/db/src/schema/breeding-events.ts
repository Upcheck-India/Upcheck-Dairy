import { pgTable, text, serial, integer, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
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
  /** The dam — the animal this event happened to. */
  animalId: integer("animal_id").notNull().references(() => animals.id),
  eventType: breedingEventType("event_type").notNull(),
  date: timestamp("date").notNull(),
  note: text("note"),
  /**
   * The sire, when he is an animal on this farm. Null for artificial
   * insemination or an outside bull, where only `bullName` is known — so the
   * two fields complement rather than duplicate each other.
   */
  sireId: integer("sire_id").references(() => animals.id),
  /** Free-text sire label, for AI straws and bulls not kept on the farm. */
  bullName: text("bull_name"),
  expectedCalvingDate: timestamp("expected_calving_date"),
  calvingGender: text("calving_gender"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    animalIdIdx: index("breeding_events_animal_id_idx").on(table.animalId),
    sireIdIdx: index("breeding_events_sire_id_idx").on(table.sireId),
  };
});

export const insertBreedingEventSchema = createInsertSchema(breedingEvents).omit({
  id: true,
  createdAt: true,
});

export type BreedingEvent = typeof breedingEvents.$inferSelect;
export type InsertBreedingEvent = z.infer<typeof insertBreedingEventSchema>;
