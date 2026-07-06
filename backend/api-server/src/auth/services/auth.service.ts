import { Injectable, Inject, ConflictException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { UserRepository } from "../repositories/user.repository";
import { OtpService } from "./otp.service";
import { TokenService } from "./token.service";
import { RedisService } from "../../redis/redis.service";
import { JwtService } from "@nestjs/jwt";
import { authenticator } from "otplib";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import type { Farmer } from "@workspace/db";

@Injectable()
export class AuthService {
  constructor(
    @Inject(UserRepository) private userRepository: UserRepository,
    @Inject(OtpService) private otpService: OtpService,
    @Inject(TokenService) private tokenService: TokenService,
    @Inject(RedisService) private redisService: RedisService,
    @Inject(JwtService) private jwtService: JwtService
  ) {}

  private async checkLockout(email: string): Promise<void> {
    const lockoutKey = `auth:lockout:${email}`;
    const isLocked = await this.redisService.get(lockoutKey);
    if (isLocked) {
      throw new BadRequestException("Too many authentication attempts. This account is locked out for 15 minutes.");
    }
  }

  private async handleFailedAttempt(email: string): Promise<void> {
    const attemptsKey = `auth:failed_attempts:${email}`;
    const currentAttemptsStr = await this.redisService.get(attemptsKey);
    const currentAttempts = currentAttemptsStr ? parseInt(currentAttemptsStr, 10) : 0;
    const newAttempts = currentAttempts + 1;

    if (newAttempts >= 5) {
      const lockoutKey = `auth:lockout:${email}`;
      await this.redisService.set(lockoutKey, "1", "EX", 900); // 15 minutes lockout
      await this.redisService.del(attemptsKey);
      throw new BadRequestException("Too many authentication attempts. This account is locked out for 15 minutes.");
    } else {
      await this.redisService.set(attemptsKey, newAttempts.toString(), "EX", 900);
    }
  }

  private async clearFailedAttempts(email: string): Promise<void> {
    const attemptsKey = `auth:failed_attempts:${email}`;
    await this.redisService.del(attemptsKey);
  }

  async requestOtp(email: string): Promise<{ message: string }> {
    await this.otpService.generateAndSendOtp(email);
    return { message: "A login code has been sent to your email." };
  }

  async verifyOtpAndLogin(email: string, code: string): Promise<{ user: Farmer; accessToken: string; refreshToken: string; requires2fa?: boolean; tempToken?: string }> {
    await this.checkLockout(email);

    const isValid = await this.otpService.verifyOtp(email, code);
    if (!isValid) {
      await this.handleFailedAttempt(email);
      throw new UnauthorizedException("Invalid or expired verification code");
    }

    let user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Auto-create user for new email
      const name = email.split("@")[0] || "Farmer";
      user = await this.userRepository.create({
        id: crypto.randomUUID(),
        email,
        name,
        authProvider: "email",
        emailVerified: true,
        phoneVerified: false,
        is2faEnabled: false,
      });
    } else if (!user.emailVerified) {
      user = await this.userRepository.update(user.id, { emailVerified: true });
    }

    await this.clearFailedAttempts(email);

    if (user.is2faEnabled) {
      const tempToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email, is2faTemp: true }, { expiresIn: "5m" });
      return { user, accessToken: "", refreshToken: "", requires2fa: true, tempToken };
    }

    const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email });
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async register(email: string, password: string, name: string): Promise<{ message: string }> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      if (existing.emailVerified) {
        return { message: "Account created. Please check your email for a verification code." };
      }
      
      const passwordHash = await bcrypt.hash(password, 10);
      await this.userRepository.update(existing.id, {
        name,
        passwordHash,
        authProvider: "email",
      });
      await this.otpService.generateAndSendOtp(email);
      return { message: "Account created. Please check your email for a verification code." };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.userRepository.create({
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash,
      authProvider: "email",
      emailVerified: false,
      phoneVerified: false,
      is2faEnabled: false,
    });

    await this.otpService.generateAndSendOtp(email);
    return { message: "Account created. Please check your email for a verification code." };
  }

  async login(email: string, password: string): Promise<{ user: Farmer; accessToken: string; refreshToken: string; requires2fa?: boolean; tempToken?: string }> {
    await this.checkLockout(email);

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      await this.handleFailedAttempt(email);
      throw new UnauthorizedException("Invalid email or password");
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      await this.handleFailedAttempt(email);
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException("Email not verified");
    }

    await this.clearFailedAttempts(email);

    if (user.is2faEnabled) {
      const tempToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email, is2faTemp: true }, { expiresIn: "5m" });
      return { user, accessToken: "", refreshToken: "", requires2fa: true, tempToken };
    }

    const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email });
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async verify2fa(tempToken: string, token: string): Promise<{ user: Farmer; accessToken: string; refreshToken: string }> {
    try {
      const decoded = this.jwtService.verify(tempToken);
      if (!decoded.is2faTemp) {
        throw new BadRequestException("Invalid session token");
      }

      const email = decoded.email;
      await this.checkLockout(email);

      const user = await this.userRepository.findById(decoded.sub);
      if (!user) {
        throw new BadRequestException("User not found");
      }

      if (!user.totpSecret) {
        throw new BadRequestException("2FA is not enabled for this user");
      }

      const isValid = authenticator.verify({ token, secret: user.totpSecret });
      if (!isValid) {
        await this.handleFailedAttempt(email);
        throw new UnauthorizedException("Invalid 2FA code");
      }

      await this.clearFailedAttempts(email);

      const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email });
      const refreshToken = await this.tokenService.generateRefreshToken(user.id);

      return { user, accessToken, refreshToken };
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) {
        throw err;
      }
      throw new UnauthorizedException("Session expired or invalid");
    }
  }

  async refresh(userId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    await this.tokenService.verifyAndConsumeRefreshToken(userId, refreshToken);

    const newAccessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email });
    const newRefreshToken = await this.tokenService.generateRefreshToken(user.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const isValid = await this.otpService.verifyOtp(email, otp);
    if (!isValid) {
      throw new UnauthorizedException("Invalid or expired verification code");
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, { passwordHash });
    await this.tokenService.revokeAllUserTokens(user.id);

    return { message: "Password reset successfully" };
  }
}
