import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { animals } from "./animals";

export const milkingSession = pgEnum("milking_session", ["morning", "evening"]);

export const milkEntries = pgTable("milk_entries", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id),
  session: milkingSession("session").notNull(),
  quantity: decimal("quantity", { precision: 6, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  fat: decimal("fat", { precision: 4, scale: 2 }),
  snf: decimal("snf", { precision: 4, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMilkEntrySchema = createInsertSchema(milkEntries).omit({
  id: true,
  createdAt: true,
});

export type MilkEntry = typeof milkEntries.$inferSelect;
export type InsertMilkEntry = z.infer<typeof insertMilkEntrySchema>;
