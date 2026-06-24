import { Controller, Post, Get, Body, Inject } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { Public, GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  /** Step 1 of OTP-only login: send a code to the email */
  @Public()
  @Post("send-otp")
  async sendOtp(@Body() body: { email: string }) {
    return this.authService.requestOtp(body.email.trim().toLowerCase());
  }

  /** Step 2 of OTP-only login: verify the code and get tokens */
  @Public()
  @Post("verify-otp")
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtpAndLogin(body.email.trim().toLowerCase(), body.otp);
  }

  /**
   * Register with email + password.
   * Creates the account and immediately sends an OTP to verify email.
   * Frontend should navigate to the OTP screen after this call.
   */
  @Public()
  @Post("register")
  async register(
    @Body() body: { email: string; password: string; name?: string; firstName?: string; lastName?: string }
  ) {
    const name =
      body.name?.trim() ||
      [body.firstName?.trim(), body.lastName?.trim()].filter(Boolean).join(" ") ||
      "Farmer";
    return this.authService.register(body.email.trim().toLowerCase(), body.password, name);
  }

  /** Standard email + password login — returns tokens directly */
  @Public()
  @Post("login")
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email.trim().toLowerCase(), body.password);
  }

  /** Exchange a refresh token for a new access token */
  @Public()
  @Post("refresh")
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refresh(body.userId, body.refreshToken);
  }

  /** Return the currently authenticated farmer (requires Bearer token) */
  @Get("me")
  async getMe(@GetUser() user: Farmer) {
    return user;
  }
}
