import { pgTable, text, serial, uuid, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmers } from "./farmers";

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => farmers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  /**
   * SHA-256 of the raw token, for lookup only.
   *
   * `tokenHash` is bcrypt, which is deliberately slow and unindexable, so
   * finding a token meant comparing it against every live row for the user —
   * growing with each login until a refresh cost seconds of CPU. This column
   * finds the row by index so bcrypt runs exactly once.
   *
   * Safe to store: the raw token is 160 bits of CSPRNG output, so its SHA-256
   * is not reversible by brute force. bcrypt stays as the verifying hash.
   *
   * Nullable for rows created before this column existed; those still fall
   * back to the scan.
   */
  tokenLookup: varchar("token_lookup", { length: 64 }),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("refresh_tokens_user_id_idx").on(table.userId),
    tokenLookupIdx: index("refresh_tokens_token_lookup_idx").on(table.tokenLookup),
  };
});

export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({
  id: true,
  createdAt: true,
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
