import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { OtpRepository } from "../repositories/otp.repository";
import { EmailService } from "../../notifications/email.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class OtpService {
  constructor(
    @Inject(OtpRepository) private otpRepository: OtpRepository,
    @Inject(EmailService) private emailService: EmailService
  ) {}

  async generateAndSendOtp(email: string): Promise<void> {
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const saltRounds = 10;
    const otpHash = await bcrypt.hash(rawOtp, saltRounds);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

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
