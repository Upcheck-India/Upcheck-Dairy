import { Controller, Post, Get, Body, Inject } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { Public, GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";
import { Throttle } from "@nestjs/throttler";
import {
  SendOtpDto,
  VerifyOtpDto,
  RegisterDto,
  LoginDto,
  RefreshDto,
  ResetPasswordDto,
  Login2faDto,
} from "../dto";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  /** Step 1 of OTP-only login: send a code to the email */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("send-otp")
  async sendOtp(@Body() body: SendOtpDto) {
    return this.authService.requestOtp(body.email.trim().toLowerCase());
  }

  /** Step 2 of OTP-only login: verify the code and get tokens */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("verify-otp")
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtpAndLogin(body.email.trim().toLowerCase(), body.otp);
  }

  /**
   * Register with email + password.
   * Creates the account and immediately sends an OTP to verify email.
   * Frontend should navigate to the OTP screen after this call.
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("register")
  async register(@Body() body: RegisterDto) {
    const name =
      body.name?.trim() ||
      [body.firstName?.trim(), body.lastName?.trim()].filter(Boolean).join(" ") ||
      "Farmer";
    return this.authService.register(body.email.trim().toLowerCase(), body.password, name);
  }

  /** Standard email + password login — returns tokens directly */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("login")
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email.trim().toLowerCase(), body.password);
  }

  /** Exchange a refresh token for a new access token */
  @Public()
  @Post("refresh")
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.userId, body.refreshToken);
  }

  /** Return the currently authenticated farmer (requires Bearer token) */
  @Get("me")
  async getMe(@GetUser() user: Farmer) {
    return user;
  }

  /** Reset password using email, OTP, and new password */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("reset-password")
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.email.trim().toLowerCase(),
      body.otp.trim(),
      body.newPassword
    );
  }

  /** Verify TOTP code (2FA) */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("verify-2fa")
  async verify2fa(@Body() body: Login2faDto) {
    return this.authService.verify2fa(body.tempToken, body.token);
  }
}
