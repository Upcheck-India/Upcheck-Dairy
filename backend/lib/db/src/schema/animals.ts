import { pgTable, text, serial, uuid, integer, boolean, decimal, timestamp, varchar, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmers } from "./farmers";
import { farms } from "./farms";

export const animalType = pgEnum("animal_type", ["cow", "buffalo", "calf"]);
export const healthStatus = pgEnum("health_status", ["healthy", "attention", "critical"]);
export const cowBreed = pgEnum("cow_breed", [
  "HF (Holstein Friesian)", "Jersey", "Gir", "Sahiwal", "Tharparkar",
  "Kangayam", "Umblachery", "Bargur", "Ongole", "Kankrej", "Rathi", "Mixed/Crossbred",
]);
export const buffaloBreed = pgEnum("buffalo_breed", [
  "Murrah", "Surti", "Mehsana", "Jaffarabadi", "Toda (Nilgiris)",
  "Pandharpuri", "Nagpuri", "Mixed",
]);

export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  farmId: uuid("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: animalType("type").notNull(),
  breed: text("breed").notNull(),
  tagNumber: text("tag_number"),
  photoUri: text("photo_uri"),
  healthStatus: healthStatus("health_status").notNull().default("healthy"),
  notes: text("notes"),
  birthDate: timestamp("birth_date"),
  nextVaccinationDate: timestamp("next_vaccination_date"),
  nextDeliveryDate: timestamp("next_delivery_date"),
  lactationNumber: integer("lactation_number"),
  lastCalvingDate: timestamp("last_calving_date"),
  expectedCalvingDate: timestamp("expected_calving_date"),
  isPregnant: boolean("is_pregnant").default(false),
  bodyConditionScore: decimal("body_condition_score", { precision: 3, scale: 1 }),
  weightKg: decimal("weight_kg", { precision: 5, scale: 1 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAnimalSchema = createInsertSchema(animals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Animal = typeof animals.$inferSelect;
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
