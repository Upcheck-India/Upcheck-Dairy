import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { SupabaseAuthService } from "./supabase-auth.service";
import { SupabaseAuthController } from "./supabase-auth.controller";
import { SupabaseAuthGuard } from "./guards/supabase-auth.guard";
import { TruecallerService } from "./truecaller.service";
import { TwoFactorService } from "./two-factor.service";

@Module({
  controllers: [SupabaseAuthController],
  providers: [
    SupabaseAuthService,
    SupabaseAuthGuard,
    TruecallerService,
    TwoFactorService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [SupabaseAuthService, SupabaseAuthGuard, TruecallerService, TwoFactorService],
})
export class AuthModule {}
