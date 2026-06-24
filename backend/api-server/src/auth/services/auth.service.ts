import { Injectable, Inject, ConflictException, UnauthorizedException } from "@nestjs/common";
import { UserRepository } from "../repositories/user.repository";
import { OtpService } from "./otp.service";
import { TokenService } from "./token.service";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import type { Farmer } from "@workspace/db";

@Injectable()
export class AuthService {
  constructor(
    @Inject(UserRepository) private userRepository: UserRepository,
    @Inject(OtpService) private otpService: OtpService,
    @Inject(TokenService) private tokenService: TokenService
  ) {}

  async requestOtp(email: string): Promise<{ message: string }> {
    await this.otpService.generateAndSendOtp(email);
    return { message: "A login code has been sent to your email." };
  }

  async verifyOtpAndLogin(email: string, code: string): Promise<{ user: Farmer; accessToken: string; refreshToken: string }> {
    const isValid = await this.otpService.verifyOtp(email, code);
    if (!isValid) {
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
    }

    const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email });
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async register(email: string, password: string, name: string): Promise<Farmer> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return this.userRepository.create({
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash,
      authProvider: "email",
      emailVerified: false,
      phoneVerified: false,
      is2faEnabled: false,
    });
  }

  async login(email: string, password: string): Promise<{ user: Farmer; accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email });
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
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
}
