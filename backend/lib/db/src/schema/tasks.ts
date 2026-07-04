import { pgTable, text, serial, uuid, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { animals } from "./animals";
import { farmers } from "./farmers";

export const taskType = pgEnum("task_type", [
  "milk",
  "feed",
  "health",
  "clean",
  "other",
  "breeding",
  "vaccination",
]);

export const taskPriority = pgEnum("task_priority", [
  "low",
  "normal",
  "high",
  "critical",
]);

import { farms } from "./farms";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  farmId: uuid("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  animalId: integer("animal_id").references(() => animals.id),
  title: text("title").notNull(),
  time: text("time").notNull(),
  session: text("session").notNull(),
  completed: boolean("completed").notNull().default(false),
  date: timestamp("date").notNull(),
  type: taskType("type").notNull(),
  priority: taskPriority("priority").notNull().default("normal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
