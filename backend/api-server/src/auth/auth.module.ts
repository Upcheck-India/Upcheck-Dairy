import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { OtpService } from "./services/otp.service";
import { TokenService } from "./services/token.service";
import { UserRepository } from "./repositories/user.repository";
import { OtpRepository } from "./repositories/otp.repository";
import { RefreshTokenRepository } from "./repositories/refresh-token.repository";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET")!,
        signOptions: { expiresIn: "7d" },
      }),
    }),
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    TokenService,
    UserRepository,
    OtpRepository,
    RefreshTokenRepository,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, UserRepository, TokenService],
})
export class AuthModule {}
