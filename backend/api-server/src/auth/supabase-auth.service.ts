import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import * as crypto from "crypto";

@Injectable()
export class SupabaseAuthService {
  private supabase: SupabaseClient;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const supabaseUrl = this.configService.get("SUPABASE_URL");
    const supabaseAnonKey = this.configService.get("SUPABASE_ANON_KEY");
    const supabaseKey = this.configService.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseKey) {
      throw new Error(
        `Missing Supabase env vars.\n` +
        `SUPABASE_URL: ${!!supabaseUrl}\n` +
        `SUPABASE_ANON_KEY: ${!!supabaseAnonKey}\n` +
        `SUPABASE_SERVICE_ROLE_KEY: ${!!supabaseKey}`,
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // ==================== Email/Password Auth ====================

  async signUp(email: string, password: string, metadata?: { firstName?: string; lastName?: string; username?: string }) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new ConflictException("Email already registered");
      }
      throw new BadRequestException(error.message);
    }

    // Insert user into our DB (farmers table) if signUp doesn't trigger a trigger
    // Normally, Supabase has a trigger to create a public.farmers row on auth.users insert.
    // If not, we can insert it here or let it be handled by a Supabase trigger.
    const newAuthUserId = data.user?.id;
    if (newAuthUserId) {
      const fullName = `${metadata?.firstName ?? ""} ${metadata?.lastName ?? ""}`.trim() || "Farmer";
      try {
        const { error: dbError } = await this.supabase.from("farmers").insert({
          id: newAuthUserId,
          email: email,
          phone: null, // User registered with email
          name: fullName,
          auth_provider: "email",
          phone_verified: false,
          email_verified: false,
        });
        if (dbError && !dbError.message.includes("duplicate key")) {
          // If insert fails (and not due to duplicate check), log it but don't fail sign up
          console.error("Failed to insert farmer record on email signup:", dbError);
        }
      } catch (dbErr) {
        console.error("Error inserting farmer record on email signup:", dbErr);
      }
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  // ==================== Passwordless email OTP ====================

  async sendEmailOtp(email: string) {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      throw new BadRequestException(error.message);
    }
    return { message: "A login code has been sent to your email." };
  }

  async verifyEmailOtp(email: string, token: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) {
      throw new UnauthorizedException(error.message);
    }
    return { user: data.user, session: data.session };
  }

  // ==================== OAuth ====================

  async signInWithIdToken(provider: "google", idToken: string) {
    const { data, error } = await this.supabase.auth.signInWithIdToken({
      provider,
      token: idToken,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Provision or verify user in the database
    const newAuthUserId = data.user?.id;
    if (newAuthUserId && data.user) {
      const email = data.user.email;
      const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || "Farmer";
      try {
        const { error: dbError } = await this.supabase.from("farmers").insert({
          id: newAuthUserId,
          email: email,
          phone: null,
          name: fullName,
          auth_provider: "google",
          phone_verified: false,
          email_verified: true,
        });
        if (dbError && !dbError.message.includes("duplicate key")) {
          console.error("Failed to insert farmer record on google login:", dbError);
        }
      } catch (dbErr) {
        console.error("Error inserting farmer record on google login:", dbErr);
      }
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  // ==================== Token Validation ====================

  async verifyAccessToken(token: string): Promise<User> {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    return data.user;
  }

  // ==================== Session Management ====================

  async refreshSession(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async signOut(accessToken: string) {
    const { error } = await this.supabase.auth.admin.signOut(accessToken);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: "Signed out successfully" };
  }

  // ==================== User Management ====================

  async updateUser(userId: string, updates: { email?: string; password?: string; data?: any }) {
    const { data, error } = await this.supabase.auth.admin.updateUserById(userId, updates);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data.user;
  }

  async getUserById(userId: string) {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data.user;
  }

  async deleteUser(userId: string) {
    const { error } = await this.supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Delete farmer from local DB
    await this.supabase.from("farmers").delete().eq("id", userId);

    return { message: "User deleted successfully" };
  }

  // ==================== Password Management ====================

  async sendPasswordResetEmail(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${this.configService.get("FRONTEND_URL")}/reset-password`,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: "Password reset email sent" };
  }

  async updatePassword(accessToken: string, newPassword: string) {
    const user = await this.verifyAccessToken(accessToken);

    const { error } = await this.supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: "Password updated successfully" };
  }

  // ==================== Email Verification ====================

  async sendVerificationEmail(email: string) {
    const { error } = await this.supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: "Verification email sent" };
  }

  // ==================== Truecaller Auth ====================

  async signInWithTruecaller(profile: {
    phoneNumber: string;
    firstName: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
  }) {
    // 1. Check if user exists by phone number in farmers table
    const { data: existingUser, error: lookupError } = await this.supabase
      .from("farmers")
      .select("*")
      .eq("phone", profile.phoneNumber)
      .single();

    if (existingUser) {
      // 2a. Existing user - update phone_verified and auth_provider
      await this.supabase
        .from("farmers")
        .update({ phone_verified: true, auth_provider: "truecaller" })
        .eq("id", existingUser.id);

      return this.createSessionForUser(existingUser.id, profile);
    }

    // 2b. New user - check if email exists in farmers table
    if (profile.email) {
      const { data: emailUser } = await this.supabase
        .from("farmers")
        .select("*")
        .eq("email", profile.email)
        .single();

      if (emailUser) {
        // Link phone to existing email user
        await this.supabase
          .from("farmers")
          .update({
            phone: profile.phoneNumber,
            phone_verified: true,
            auth_provider: "truecaller",
          })
          .eq("id", emailUser.id);

        return this.createSessionForUser(emailUser.id, profile);
      }
    }

    // 3. Create new auth user
    const tempEmail = profile.email || `${profile.phoneNumber.replace(/[^0-9]/g, "")}@truecaller.temp`;

    const { data: newUser, error: createError } = await this.supabase.auth.admin.createUser({
      email: tempEmail,
      phone: profile.phoneNumber,
      password: crypto.randomUUID(),
      email_confirm: !!profile.email,
      phone_confirm: true,
      user_metadata: {
        first_name: profile.firstName,
        last_name: profile.lastName,
        avatar_url: profile.avatarUrl,
        provider: "truecaller",
        phone_verified: true,
      },
    });

    if (createError) {
      throw new BadRequestException(createError.message);
    }

    const newAuthUserId = newUser.user.id;
    const fullName = `${profile.firstName} ${profile.lastName || ""}`.trim();

    try {
      // Create user record in farmers table
      const { error: dbError } = await this.supabase.from("farmers").insert({
        id: newAuthUserId,
        email: profile.email || null,
        phone: profile.phoneNumber,
        name: fullName,
        auth_provider: "truecaller",
        phone_verified: true,
        email_verified: !!profile.email,
      });

      if (dbError) {
        throw new BadRequestException(dbError.message);
      }

      return {
        user: newUser.user,
        session: null as any,
      };
    } catch (insertErr) {
      try {
        await this.supabase.auth.admin.deleteUser(newAuthUserId);
      } catch {
        // Ignored
      }
      throw insertErr;
    }
  }

  private async createSessionForUser(
    userId: string,
    profile: { firstName: string; lastName?: string; avatarUrl?: string },
  ) {
    const { data, error } = await this.supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        first_name: profile.firstName,
        last_name: profile.lastName,
        avatar_url: profile.avatarUrl,
        provider: "truecaller",
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const userEmail = data.user.email ?? "";
    if (!userEmail) {
      throw new BadRequestException("User email is required to create session");
    }

    const { data: linkData, error: linkError } = await this.supabase.auth.admin.generateLink({
      type: "magiclink",
      email: userEmail,
    });

    if (linkError) {
      throw new BadRequestException(linkError.message);
    }

    return {
      user: data.user,
      session: linkData.properties?.action_link ? null : linkData,
    };
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
