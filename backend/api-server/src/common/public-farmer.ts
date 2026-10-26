import type { Farmer } from "@workspace/db";

/**
 * A farmer row with the server-only secrets removed.
 *
 * `UserRepository` selects whole rows, so a `Farmer` carries the bcrypt hash
 * and the TOTP seed. Neither may cross the network: the TOTP secret in
 * particular is all an attacker needs to mint valid 2FA codes indefinitely,
 * which would make 2FA decorative. Every endpoint that returns a farmer must
 * pass it through here first.
 */
export type PublicFarmer = Omit<Farmer, "passwordHash" | "totpSecret">;

export function toPublicFarmer(farmer: Farmer): PublicFarmer {
  const { passwordHash, totpSecret, ...rest } = farmer;
  return rest;
}
