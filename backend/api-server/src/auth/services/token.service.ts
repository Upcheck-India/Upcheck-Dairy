import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

@Injectable()
export class TokenService {
  constructor(
    @Inject(JwtService) private jwtService: JwtService,
    @Inject(RefreshTokenRepository) private refreshTokenRepository: RefreshTokenRepository
  ) {}

  generateAccessToken(payload: { sub: string; email: string | null }, options?: { expiresIn?: any }): string {
    return this.jwtService.sign(payload, { expiresIn: (options?.expiresIn ?? "15m") as any });
  }

  /** SHA-256 of the raw token — the indexable lookup key, not the verifier. */
  private lookupKey(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  async generateRefreshToken(userId: string): Promise<string> {
    // 160 bits of CSPRNG output, as 40 hex characters.
    const rawToken = crypto.randomBytes(20).toString("hex");

    const tokenHash = await bcrypt.hash(rawToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.refreshTokenRepository.create({
      userId,
      tokenHash,
      tokenLookup: this.lookupKey(rawToken),
      expiresAt,
    });

    return rawToken;
  }

  /**
   * Verify a refresh token and spend it (one-time use).
   *
   * Looks the row up by its indexed SHA-256 so bcrypt runs once. Previously
   * this bcrypt-compared against every live row for the user — ~53 ms each at
   * cost 10, so an account with 22 live tokens burned over a second of CPU per
   * refresh, and the count grew with every login.
   */
  async verifyAndConsumeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const record = await this.refreshTokenRepository.findActiveByLookup(
      userId,
      this.lookupKey(rawToken)
    );

    if (record) {
      // bcrypt still does the verifying; the lookup only narrowed the search.
      const match = await bcrypt.compare(rawToken, record.tokenHash);
      if (match) {
        await this.refreshTokenRepository.revoke(record.id);
        return;
      }
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    // Fall back for tokens issued before token_lookup existed, so the change
    // does not sign those sessions out. This set only shrinks.
    const legacyTokens = await this.refreshTokenRepository.findActiveLegacyTokensForUser(userId);
    for (const legacy of legacyTokens) {
      if (await bcrypt.compare(rawToken, legacy.tokenHash)) {
        await this.refreshTokenRepository.revoke(legacy.id);
        return;
      }
    }

    throw new UnauthorizedException("Invalid or expired refresh token");
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllForUser(userId);
  }
}
