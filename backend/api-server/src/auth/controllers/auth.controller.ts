import { Controller, Post, Get, Body, Req, UseGuards, Inject, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { Public, GetUser } from "../../common/decorators/auth.decorators";
import type { Farmer } from "@workspace/db";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @Public()
  @Post("send-otp")
  async sendOtp(@Body() body: { email: string }) {
    return this.authService.requestOtp(body.email);
  }

  @Public()
  @Post("verify-otp")
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtpAndLogin(body.email, body.otp);
  }

  @Public()
  @Post("register")
  async register(@Body() body: { email: string; passwordHash: string; name: string }) {
    // Note: React app submits password, we map it to passwordHash parameter for registration
    return this.authService.register(body.email, body.passwordHash, body.name);
  }

  @Public()
  @Post("login")
  async login(@Body() body: { email: string; passwordHash: string }) {
    return this.authService.login(body.email, body.passwordHash);
  }

  @Public()
  @Post("refresh")
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refresh(body.userId, body.refreshToken);
  }

  @Get("me")
  async getMe(@GetUser() user: Farmer) {
    return user;
  }
}
