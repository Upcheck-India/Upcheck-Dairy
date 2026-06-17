import { Controller, Get, Post, Body, UseGuards, Req, BadRequestException, UnauthorizedException, ValidationPipe, HttpCode, HttpStatus, Catch, ExceptionFilter, ArgumentsHost, UseFilters, Inject } from "@nestjs/common";
import { randomUUID } from "crypto";
import { SupabaseAuthService } from "./supabase-auth.service";
import { TruecallerService, VerifiedTruecallerProfile } from "./truecaller.service";
import { TwoFactorService } from "./two-factor.service";
import { SupabaseAuthGuard } from "./guards/supabase-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/auth.decorators";
import { TruecallerAuthDto } from "./dto/truecaller-auth.dto";
import { TruecallerOAuthExchangeDto } from "./dto/truecaller-oauth-exchange.dto";
import { Enable2faDto } from "./dto/enable-2fa.dto";
import { Disable2faDto } from "./dto/disable-2fa.dto";
import { Login2faDto } from "./dto/login-2fa.dto";
import { LoginOtpRequestDto, LoginOtpVerifyDto } from "./dto/login-otp.dto";
import { RedisService } from "../redis/redis.service";
import type { User } from "@supabase/supabase-js";

const TWO_FA_TEMP_PREFIX = "auth:2fa:temp:";
const TWO_FA_TEMP_TTL_SECONDS = 300;

const truecallerValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: false,
  transform: true,
  exceptionFactory: () =>
    new UnauthorizedException({
      success: false,
      message: "Invalid request",
    }),
});

@Catch(BadRequestException)
export class TruecallerInvalidRequestFilter implements ExceptionFilter {
  catch(_exception: BadRequestException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();
    response.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: "Invalid request",
    });
  }
}

@Controller("auth/supabase")
export class SupabaseAuthController {
  constructor(
    @Inject(SupabaseAuthService) private supabaseAuthService: SupabaseAuthService,
    @Inject(TruecallerService) private truecallerService: TruecallerService,
    @Inject(TwoFactorService) private twoFactorService: TwoFactorService,
    @Inject(RedisService) private redisService: RedisService,
  ) {}

  // ==================== Email/Password Auth ====================

  @Public()
  @Post("signup")
  async signup(@Body() body: { email: string; password: string; firstName?: string; lastName?: string; username?: string }) {
    const { email, password, firstName, lastName, username } = body;

    if (!email || !password) {
      throw new BadRequestException("Email and password are required");
    }

    const result = await this.supabaseAuthService.signUp(email, password, {
      firstName,
      lastName,
      username,
    });

    return {
      message: "Registration successful. Please check your email for verification.",
      user: result.user,
      session: result.session,
    };
  }

  @Public()
  @Post("signin")
  async signin(@Body() body: { email: string; password: string }) {
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestException("Email and password are required");
    }

    const result = await this.supabaseAuthService.signIn(email, password);

    if (result.user && (await this.twoFactorService.isEnabled(result.user.id))) {
      const tempToken = randomUUID();
      await this.redisService.set(
        `${TWO_FA_TEMP_PREFIX}${tempToken}`,
        JSON.stringify({ userId: result.user.id, session: result.session }),
        "EX",
        TWO_FA_TEMP_TTL_SECONDS,
      );
      return { requires2FA: true, tempToken };
    }

    return {
      message: "Login successful",
      user: result.user,
      session: result.session,
    };
  }

  // ==================== Passwordless email OTP login ====================

  @Public()
  @Post("login-otp/request")
  @HttpCode(HttpStatus.OK)
  async requestLoginOtp(@Body() body: LoginOtpRequestDto) {
    return this.supabaseAuthService.sendEmailOtp(body.email);
  }

  @Public()
  @Post("login-otp/verify")
  @HttpCode(HttpStatus.OK)
  async verifyLoginOtp(@Body() body: LoginOtpVerifyDto) {
    const result = await this.supabaseAuthService.verifyEmailOtp(body.email, body.otp);
    return { message: "Login successful", user: result.user, session: result.session };
  }

  // ==================== Two-factor authentication (TOTP) ====================

  @Public()
  @Post("2fa/login")
  @HttpCode(HttpStatus.OK)
  async twoFactorLogin(@Body() body: Login2faDto) {
    const raw = await this.redisService.get(`${TWO_FA_TEMP_PREFIX}${body.tempToken}`);
    if (!raw) {
      throw new UnauthorizedException("2FA challenge expired or invalid. Please sign in again.");
    }
    const { userId, session } = JSON.parse(raw);
    const ok = await this.twoFactorService.verifyCode(userId, body.token);
    if (!ok) {
      throw new UnauthorizedException("Invalid verification code");
    }
    await this.redisService.del(`${TWO_FA_TEMP_PREFIX}${body.tempToken}`);
    return { message: "Login successful", session };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("2fa/setup")
  async twoFactorSetup(@CurrentUser() user: any) {
    return this.twoFactorService.setup(user.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("2fa/enable")
  async twoFactorEnable(@CurrentUser() user: any, @Body() body: Enable2faDto) {
    return this.twoFactorService.enable(user.id, body.token);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("2fa/disable")
  async twoFactorDisable(@CurrentUser() user: any, @Body() body: Disable2faDto) {
    return this.twoFactorService.disable(user.id, body.token);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get("2fa/status")
  async twoFactorStatus(@CurrentUser() user: any) {
    return this.twoFactorService.status(user.id);
  }

  // ==================== OAuth ====================

  @Public()
  @Post("oauth/google")
  async googleOAuth(@Body() body: { idToken: string }) {
    const { idToken } = body;

    if (!idToken) {
      throw new BadRequestException("ID token is required");
    }

    const result = await this.supabaseAuthService.signInWithIdToken("google", idToken);

    return {
      message: "Google authentication successful",
      user: result.user,
      session: result.session,
    };
  }

  @Public()
  @Post("oauth/truecaller")
  @HttpCode(HttpStatus.OK)
  @UseFilters(TruecallerInvalidRequestFilter)
  async truecallerOAuth(
    @Body(truecallerValidationPipe) body: TruecallerAuthDto,
  ) {
    const {
      payload,
      signature,
      signatureAlgorithm,
      requestNonce,
      accessToken,
      phoneNumber,
    } = body;

    let verifiedProfile: VerifiedTruecallerProfile;
    if (payload) {
      verifiedProfile = await this.truecallerService.verifySignedPayload({
        payload,
        signature: signature ?? "",
        signatureAlgorithm: signatureAlgorithm ?? "",
        requestNonce: requestNonce ?? "",
      });
    } else if (accessToken) {
      verifiedProfile = await this.truecallerService.verifyAccessToken(
        accessToken,
        phoneNumber,
      );
    } else {
      throw new UnauthorizedException({
        success: false,
        message: "Invalid request",
      });
    }

    const result = await this.supabaseAuthService.signInWithTruecaller({
      phoneNumber: verifiedProfile.phoneNumber,
      firstName: verifiedProfile.firstName || "User",
      lastName: verifiedProfile.lastName,
      email: verifiedProfile.email,
      avatarUrl: verifiedProfile.avatarUrl,
    });

    return {
      message: "Truecaller authentication successful",
      user: result.user,
      session: result.session,
    };
  }

  @Public()
  @Post("oauth/truecaller/exchange")
  @HttpCode(HttpStatus.OK)
  @UseFilters(TruecallerInvalidRequestFilter)
  async truecallerOAuthExchange(
    @Body(truecallerValidationPipe) body: TruecallerOAuthExchangeDto,
  ) {
    const verifiedProfile = await this.truecallerService.verifyOAuthCode(
      body.authorizationCode,
      body.codeVerifier,
    );

    const result = await this.supabaseAuthService.signInWithTruecaller({
      phoneNumber: verifiedProfile.phoneNumber,
      firstName: verifiedProfile.firstName || "User",
      lastName: verifiedProfile.lastName,
      email: verifiedProfile.email,
      avatarUrl: verifiedProfile.avatarUrl,
    });

    return {
      message: "Truecaller authentication successful",
      user: result.user,
      session: result.session,
    };
  }

  // ==================== Session Management ====================

  @Public()
  @Post("refresh")
  async refresh(@Body() body: { refreshToken: string }) {
    const { refreshToken } = body;

    if (!refreshToken) {
      throw new BadRequestException("Refresh token is required");
    }

    const result = await this.supabaseAuthService.refreshSession(refreshToken);

    return {
      message: "Session refreshed",
      user: result.user,
      session: result.session,
    };
  }

  @Post("signout")
  @UseGuards(SupabaseAuthGuard)
  async signout(@Req() request: any) {
    const token = request.headers.authorization?.substring(7);

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    return await this.supabaseAuthService.signOut(token);
  }

  // ==================== User Management ====================

  @Get("me")
  @UseGuards(SupabaseAuthGuard)
  async getCurrentUser(@CurrentUser() user: User) {
    return {
      user,
    };
  }

  @Post("update")
  @UseGuards(SupabaseAuthGuard)
  async updateUser(
    @CurrentUser() user: User,
    @Body() body: { email?: string; password?: string; data?: any }
  ) {
    const updatedUser = await this.supabaseAuthService.updateUser(user.id, body);

    return {
      message: "User updated successfully",
      user: updatedUser,
    };
  }

  // ==================== Password Management ====================

  @Public()
  @Post("forgot-password")
  async forgotPassword(@Body() body: { email: string }) {
    const { email } = body;

    if (!email) {
      throw new BadRequestException("Email is required");
    }

    return await this.supabaseAuthService.sendPasswordResetEmail(email);
  }

  @Post("update-password")
  @UseGuards(SupabaseAuthGuard)
  async updatePassword(
    @Req() request: any,
    @Body() body: { newPassword: string }
  ) {
    const token = request.headers.authorization?.substring(7);
    const { newPassword } = body;

    if (!newPassword) {
      throw new BadRequestException("New password is required");
    }

    return await this.supabaseAuthService.updatePassword(token, newPassword);
  }

  // ==================== Email Verification ====================

  @Public()
  @Post("resend-verification")
  async resendVerification(@Body() body: { email: string }) {
    const { email } = body;

    if (!email) {
      throw new BadRequestException("Email is required");
    }

    return await this.supabaseAuthService.sendVerificationEmail(email);
  }
}
