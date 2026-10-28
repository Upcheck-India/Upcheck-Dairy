import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  name: string;
  googleId: string;
  /** Profile picture URL. Absent if the account has no photo set. */
  avatarUrl: string | null;
}

/**
 * Verifies Google ID tokens minted for the mobile app.
 *
 * The client never tells us who it is — it hands over the signed ID token it
 * received from Google Sign-In and we validate the signature, issuer and
 * audience here. The audience list holds every OAuth client ID the app can
 * sign in with (web / iOS / Android), because the `aud` claim varies by the
 * platform the token was issued on.
 */
@Injectable()
export class GoogleAuthService {
  private readonly client: OAuth2Client;
  private readonly audiences: string[];

  constructor(@Inject(ConfigService) configService: ConfigService) {
    this.client = new OAuth2Client();
    this.audiences = [
      configService.get<string>("GOOGLE_CLIENT_ID_WEB"),
      configService.get<string>("GOOGLE_CLIENT_ID_IOS"),
      configService.get<string>("GOOGLE_CLIENT_ID_ANDROID"),
    ].filter((id): id is string => !!id && id.trim().length > 0);
  }

  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    if (this.audiences.length === 0) {
      throw new UnauthorizedException("Google sign-in is not configured on the server");
    }

    // Checked here rather than left to the DTO: the server runs under tsx,
    // whose esbuild transform drops `emitDecoratorMetadata`, so Nest's global
    // ValidationPipe has no metatype to validate against and silently passes
    // every body through. Until that is fixed this route validates its own input.
    if (typeof idToken !== "string" || idToken.trim().length === 0) {
      throw new UnauthorizedException("Invalid Google token");
    }

    let payload;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.audiences,
      });
      payload = ticket.getPayload();
    } catch {
      // Deliberately opaque: signature, expiry and audience failures all look
      // the same to the caller so a probing client learns nothing.
      throw new UnauthorizedException("Invalid Google token");
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException("Invalid Google token");
    }

    return {
      email: payload.email.toLowerCase(),
      emailVerified: payload.email_verified ?? false,
      name: payload.name?.trim() || payload.email.split("@")[0]!,
      googleId: payload.sub,
      avatarUrl: payload.picture ?? null,
    };
  }
}
