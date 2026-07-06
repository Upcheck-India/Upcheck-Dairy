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

  generateAccessToken(payload: { sub: string; email: string | null; is2faTemp?: boolean }, options?: { expiresIn?: any }): string {
    return this.jwtService.sign(payload, { expiresIn: (options?.expiresIn ?? "15m") as any });
  }

  async generateRefreshToken(userId: string): Promise<string> {
    // 1. Generate 40 character hex string
    const rawToken = crypto.randomBytes(20).toString("hex");

    // 2. Hash it
    const tokenHash = await bcrypt.hash(rawToken, 10);

    // 3. Set expiry to 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 4. Save to DB
    await this.refreshTokenRepository.create({
      userId,
      tokenHash,
      expiresAt,
    });

    return rawToken;
  }

  async verifyAndConsumeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const activeTokens = await this.refreshTokenRepository.findActiveTokensForUser(userId);

    for (const record of activeTokens) {
      const match = await bcrypt.compare(rawToken, record.tokenHash);
      if (match) {
        // Token matched, now revoke it (one-time use)
        await this.refreshTokenRepository.revoke(record.id);
        return;
      }
    }

    throw new UnauthorizedException("Invalid or expired refresh token");
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllForUser(userId);
  }
}
