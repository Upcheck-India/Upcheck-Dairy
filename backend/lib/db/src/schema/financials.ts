import { pgTable, text, serial, uuid, decimal, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmers } from "./farmers";
import { farms } from "./farms";

export const expenseCategory = pgEnum("expense_category", [
  "feed",
  "medicine",
  "labor",
  "equipment",
  "other",
]);

export const incomeEntries = pgTable("income_entries", {
  id: serial("id").primaryKey(),
  farmId: uuid("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  buyer: text("buyer").notNull(),
  quantitySold: decimal("quantity_sold", { precision: 6, scale: 2 }).notNull(),
  ratePerLitre: decimal("rate_per_litre", { precision: 6, scale: 2 }).notNull(),
  totalExpected: decimal("total_expected", { precision: 10, scale: 2 }).notNull(),
  totalReceived: decimal("total_received", { precision: 10, scale: 2 }).notNull(),
  fatPercentage: decimal("fat_percentage", { precision: 4, scale: 2 }),
  snfPercentage: decimal("snf_percentage", { precision: 4, scale: 2 }),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    farmIdIdx: index("income_entries_farm_id_idx").on(table.farmId),
  };
});

export const insertIncomeEntrySchema = createInsertSchema(incomeEntries).omit({
  id: true,
  createdAt: true,
});

export type IncomeEntry = typeof incomeEntries.$inferSelect;
export type InsertIncomeEntry = z.infer<typeof insertIncomeEntrySchema>;

export const expenseEntries = pgTable("expense_entries", {
  id: serial("id").primaryKey(),
  farmId: uuid("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  category: expenseCategory("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    farmIdIdx: index("expense_entries_farm_id_idx").on(table.farmId),
  };
});

export const insertExpenseEntrySchema = createInsertSchema(expenseEntries).omit({
  id: true,
  createdAt: true,
});

export type ExpenseEntry = typeof expenseEntries.$inferSelect;
export type InsertExpenseEntry = z.infer<typeof insertExpenseEntrySchema>;
