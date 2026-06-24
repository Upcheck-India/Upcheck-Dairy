import { Injectable, Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly brevoApiKey: string | undefined;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.brevoApiKey = this.configService.get<string>("BREVO_API_KEY");
    this.senderEmail = this.configService.get<string>("BREVO_SENDER_EMAIL") || this.configService.get<string>("SMTP_SENDER_EMAIL") || "admin@upcheck.in";
    this.senderName = this.configService.get<string>("BREVO_SENDER_NAME") || this.configService.get<string>("SMTP_SENDER_NAME") || "Upcheck";
  }

  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!this.brevoApiKey) {
      this.logger.warn(`BREVO_API_KEY is not configured. Logging email instead:\nTo: ${to}\nSubject: ${subject}\nContent: ${htmlContent}`);
      return true;
    }

    try {
      const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: { name: this.senderName, email: this.senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent,
        },
        {
          headers: {
            accept: "application/json",
            "api-key": this.brevoApiKey,
            "content-type": "application/json",
          },
        },
      );

      return response.status === 201 || response.status === 200;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async sendOtpEmail(to: string, otpCode: string): Promise<boolean> {
    const subject = "Your Upcheck Verification Code";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #16a34a; text-align: center;">Upcheck — Email Verification</h2>
        <p>Hello,</p>
        <p>Use the following one-time code to verify your email. This code is valid for <strong>5 minutes</strong>:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; border: 2px dashed #16a34a; padding: 12px 28px; border-radius: 8px; background-color: #f0fdf4;">
            ${otpCode}
          </span>
        </div>
        <p style="color: #64748b; font-size: 14px;">If you did not request this code, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 12px;">🌱 Upcheck — Smart Dairy Management</p>
      </div>
    `;
    return this.sendEmail(to, subject, htmlContent);
  }
}
