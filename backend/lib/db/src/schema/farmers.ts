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
  state: text("state"),
  pincode: varchar("pincode", { length: 10 }),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  locationPermission: boolean("location_permission").default(false).notNull(),
  notificationPermission: boolean("notification_permission").default(false).notNull(),
  avatarInitials: text("avatar_initials"),
  /** Profile picture URL from the OAuth provider; initials are the fallback. */
  avatarUrl: text("avatar_url"),
  language: text("language").default("ta"),
  email: varchar("email", { length: 255 }).unique(),
  authProvider: varchar("auth_provider", { length: 20 }).default("phone"),
  /**
   * Google's `sub` claim — the stable per-account identifier. Unlike email it
   * never changes, so it survives a user renaming their Gmail address and
   * keeps two people who have swapped an address from colliding.
   */
  googleId: varchar("google_id", { length: 255 }).unique(),
  is2faEnabled: boolean("is_2fa_enabled").default(false).notNull(),
  totpSecret: text("totp_secret"),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFarmerSchema = createInsertSchema(farmers).omit({
  createdAt: true,
  updatedAt: true,
});

export type Farmer = typeof farmers.$inferSelect;
export type InsertFarmer = z.infer<typeof insertFarmerSchema>;
