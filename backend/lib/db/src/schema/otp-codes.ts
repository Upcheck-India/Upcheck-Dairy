import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({
  id: true,
  createdAt: true,
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
