import { pgTable, text, uuid, integer, boolean, decimal, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const farmers = pgTable("farmers", {
  id: uuid("id").primaryKey(),
  phone: varchar("phone", { length: 10 }).unique(),
  name: text("name").notNull(),
  farmName: text("farm_name"),
  village: text("village"),
  district: text("district"),
  avatarInitials: text("avatar_initials"),
  language: text("language").default("ta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFarmerSchema = createInsertSchema(farmers).omit({
  createdAt: true,
  updatedAt: true,
});

export type Farmer = typeof farmers.$inferSelect;
export type InsertFarmer = z.infer<typeof insertFarmerSchema>;
