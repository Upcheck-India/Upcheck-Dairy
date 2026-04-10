import { pgTable, text, serial, integer, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { animals } from "./animals";

export const healthEventType = pgEnum("health_event_type", [
  "vaccination",
  "treatment",
  "observation",
  "diagnosis",
]);

export const healthEvents = pgTable("health_events", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id),
  date: timestamp("date").notNull(),
  type: healthEventType("type").notNull(),
  description: text("description").notNull(),
  veterinarianName: text("veterinarian_name"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHealthEventSchema = createInsertSchema(healthEvents).omit({
  id: true,
  createdAt: true,
});

export type HealthEvent = typeof healthEvents.$inferSelect;
export type InsertHealthEvent = z.infer<typeof insertHealthEventSchema>;
