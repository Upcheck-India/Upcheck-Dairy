import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpEntry>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanExpired() {
  const now = Date.now();
  for (const [phone, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) otpStore.delete(phone);
  }
}

router.post("/send-otp", (req, res) => {
  const { phone } = req.body as { phone?: string };

  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  cleanExpired();

  const otp = generateOtp();
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });

  logger.info({ phone: phone.slice(-4), otp }, "OTP generated");

  // In production: integrate with MSG91 / Fast2SMS / Twilio here
  // Example: await sendSms(phone, `Your ThulirFarm OTP is ${otp}. Valid for 5 minutes.`)

  return res.json({
    success: true,
    message: "OTP sent",
    // NOTE: Remove demoOtp in production — for development testing only
    demoOtp: otp,
    expiresIn: 300,
  });
});

router.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body as { phone?: string; otp?: string };

  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone and OTP are required" });
  }

  const entry = otpStore.get(phone);

  if (!entry) {
    return res.status(400).json({ error: "OTP not found or expired. Please request a new OTP." });
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ error: "OTP has expired. Please request a new OTP." });
  }

  entry.attempts += 1;

  if (entry.attempts > 5) {
    otpStore.delete(phone);
    return res.status(429).json({ error: "Too many attempts. Please request a new OTP." });
  }

  if (entry.otp !== otp) {
    return res.status(400).json({
      error: "Incorrect OTP",
      attemptsLeft: 5 - entry.attempts,
    });
  }

  otpStore.delete(phone);

  logger.info({ phone: phone.slice(-4) }, "OTP verified successfully");

  return res.json({ success: true, verified: true });
});

export default router;
