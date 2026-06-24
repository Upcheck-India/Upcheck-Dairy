import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmers } from "./farmers";

export const farms = pgTable("farms", {
  id: uuid("id").primaryKey(),
  ownerFarmerId: uuid("owner_farmer_id").notNull().references(() => farmers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFarmSchema = createInsertSchema(farms).omit({
  createdAt: true,
  updatedAt: true,
});

export type Farm = typeof farms.$inferSelect;
export type InsertFarm = z.infer<typeof insertFarmSchema>;
