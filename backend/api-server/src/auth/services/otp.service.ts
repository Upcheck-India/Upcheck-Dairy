import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { OtpRepository } from "../repositories/otp.repository";
import { EmailService } from "../../notifications/email.service";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

@Injectable()
export class OtpService {
  constructor(
    @Inject(OtpRepository) private otpRepository: OtpRepository,
    @Inject(EmailService) private emailService: EmailService
  ) {}

  async generateAndSendOtp(email: string): Promise<void> {
    // randomInt, not Math.random: an OTP is a login credential. V8's PRNG is
    // not cryptographic and its internal state can be recovered from a run of
    // outputs — and an attacker can harvest outputs by requesting codes for an
    // address they own, then predict the next code issued to someone else.
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const saltRounds = 10;
    const otpHash = await bcrypt.hash(rawOtp, saltRounds);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Supersede any code still live for this address, so a resend replaces the
    // previous code instead of adding a second accepted one.
    await this.otpRepository.invalidateActiveForEmail(email);

    await this.otpRepository.create({
      email,
      otpHash,
      expiresAt,
    });

    const success = await this.emailService.sendOtpEmail(email, rawOtp);
    if (!success) {
      throw new BadRequestException("Failed to send OTP email. Please try again.");
    }
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const activeOtps = await this.otpRepository.findActiveOtps(email);

    for (const record of activeOtps) {
      const match = await bcrypt.compare(otp, record.otpHash);
      if (match) {
        await this.otpRepository.markUsed(record.id);
        return true;
      }
    }

    return false;
  }
}
