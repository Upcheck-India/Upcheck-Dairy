import { pgTable, text, serial, uuid, integer, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmers } from "./farmers";
import { farms } from "./farms";

export const inventoryCategory = pgEnum("inventory_category", [
  "feed",
  "medicine",
  "supplement",
  "equipment",
  "other",
]);

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  farmId: uuid("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: inventoryCategory("category").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  minQuantity: decimal("min_quantity", { precision: 10, scale: 2 }).notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }),
  lastUpdated: timestamp("last_updated").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
