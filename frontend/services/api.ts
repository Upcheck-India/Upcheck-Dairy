const getApiBase = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return "http://localhost:3000/api";
};

async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  fallbackMsg = "Request failed"
): Promise<T> {
  const response = await fetch(url, options);
  if (response.status === 204) {
    return {} as T;
  }
  const text = await response.text();
  const isHtml = text.trim().startsWith("<");

  if (!response.ok) {
    if (isHtml) {
      throw new Error(`${fallbackMsg} (${response.status} ${response.statusText}): Server returned HTML instead of JSON.`);
    }
    try {
      const data = JSON.parse(text);
      throw new Error(data?.error ?? data?.message ?? `${fallbackMsg} (${response.status})`);
    } catch (e: any) {
      if (e.message && !e.message.startsWith("JSON") && e.message !== `${fallbackMsg} (${response.status})`) {
        throw e;
      }
      throw new Error(`${fallbackMsg} (${response.status})`);
    }
  }

  if (isHtml) {
    throw new Error(`${fallbackMsg}: Expected JSON response but received HTML.`);
  }

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${fallbackMsg}: Invalid JSON response from server.`);
  }
}


// ==================== Types ====================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  name: string;
  phone?: string | null;
  farmName?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  emailVerified?: boolean;
  avatarColor?: string | null;
  avatarInitials?: string | null;
  createdAt?: string;
  notificationPermission?: boolean;
  notificationsEnabled?: boolean;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface DiagnoseRequest {
  symptoms: string[];
  customNote?: string;
  animalName?: string;
  animalType?: string;
}

export interface DiagnoseResponse {
  summary: string;
  summaryTamil: string;
  possibleCauses: string[];
  immediateActions: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  medicine: string | null;
  tamilAdvice: string;
  homeRemedy: string | null;
  nextSteps: string;
  callVetImmediately: boolean;
}

export interface VoiceCommandRequest {
  transcript: string;
  animals?: Array<{ id: string; name: string; type: string }>;
}

export interface VoiceCommandResponse {
  action: "log_milk" | "report_problem" | "add_expense" | "navigate" | "unknown";
  confidence: number;
  params: {
    animalId?: string | null;
    animalName?: string | null;
    quantity?: number | null;
    session?: "morning" | "evening" | null;
    symptom?: string | null;
    expenseCategory?: string | null;
    expenseAmount?: number | null;
    expenseDescription?: string | null;
    tab?: "animals" | "help" | "money" | "today" | null;
  };
  confirmationText: string;
  confirmationTamil: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RationResult {
  summary: string;
  summaryLocal: string;
  greenFodder: { quantity: string; examples: string };
  dryFodder: { quantity: string; examples: string };
  concentrate: { quantity: string; composition: string };
  mineralMix: string;
  water: string;
  totalCost: string;
  tips: string[];
}

// ==================== Auth API ====================

/**
 * Register a new account with email + password.
 * Backend creates the account and sends an OTP to the email.
 * Navigate to the OTP screen after this call.
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
): Promise<{ message: string }> {
  const base = getApiBase();
  const data = await safeFetchJson<{ message?: string; error?: string }>(
    `${base}/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    },
    "Registration failed"
  );
  return { message: data.message ?? "OTP sent to your email" };
}

/**
 * Standard email + password login.
 * Returns tokens + user on success.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  const base = getApiBase();
  return safeFetchJson<AuthResult>(
    `${base}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
    "Login failed"
  );
}

/**
 * Send an OTP to the given email (passwordless login step 1, or resend).
 */
export async function sendOtpCode(email: string): Promise<{ message: string }> {
  const base = getApiBase();
  const data = await safeFetchJson<{ message?: string }>(
    `${base}/auth/send-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
    "Failed to send OTP"
  );
  return { message: data.message ?? "OTP sent" };
}

/**
 * Verify an OTP code for an email.
 * Returns tokens + user — works for both register flow and passwordless login.
 */
export async function verifyOtpCode(email: string, otp: string): Promise<AuthResult> {
  const base = getApiBase();
  return safeFetchJson<AuthResult>(
    `${base}/auth/verify-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    },
    "OTP verification failed"
  );
}

/**
 * Refresh tokens using a refresh token.
 */
export async function refreshAccessToken(
  userId: string,
  refreshToken: string,
): Promise<AuthTokens> {
  const base = getApiBase();
  return safeFetchJson<AuthTokens>(
    `${base}/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, refreshToken }),
    },
    "Token refresh failed"
  );
}

/**
 * Get the currently authenticated user profile.
 */
export async function getMyProfile(accessToken: string): Promise<AuthUser> {
  const base = getApiBase();
  return safeFetchJson<AuthUser>(
    `${base}/auth/me`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    "Failed to fetch profile"
  );
}

// ==================== Farm / Profile API ====================

export interface FarmerProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  farmName?: string;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  locationPermission?: boolean;
  notificationsEnabled?: boolean;
  onboardingCompleted?: boolean;
  avatarInitials?: string;
  avatarColor?: string;
  createdAt?: string;
  totalLandAcres?: number;
}

export async function fetchProfile(accessToken: string): Promise<FarmerProfile | null> {
  const base = getApiBase();
  try {
    return await safeFetchJson<FarmerProfile>(
      `${base}/farm/profile`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
      "Failed to fetch profile"
    );
  } catch (err: any) {
    if (err.message && err.message.includes("404")) return null;
    throw err;
  }
}

export async function createOrUpdateProfile(
  accessToken: string,
  profile: Partial<FarmerProfile>
): Promise<FarmerProfile> {
  const base = getApiBase();
  return safeFetchJson<FarmerProfile>(
    `${base}/farm/profile`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    },
    "Failed to save profile"
  );
}

// ==================== Diagnostics ====================

export async function diagnoseSymptoms(request: DiagnoseRequest): Promise<DiagnoseResponse> {
  const base = getApiBase();
  return safeFetchJson<DiagnoseResponse>(
    `${base}/farm/diagnose`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    "Diagnosis failed"
  );
}

export async function transcribeAudio(audioUri: string, mimeType?: string): Promise<string> {
  const base = getApiBase();
  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    type: mimeType ?? "audio/m4a",
    name: "recording.m4a",
  } as any);
  const data = await safeFetchJson<{ transcript: string }>(
    `${base}/farm/transcribe`,
    {
      method: "POST",
      body: formData,
    },
    "Transcription failed"
  );
  return data.transcript;
}

export async function chatWithGauGuru(
  message: string,
  history: ChatMessage[],
  language: string
): Promise<{ response: string }> {
  const base = getApiBase();
  return safeFetchJson<{ response: string }>(
    `${base}/farm/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, language }),
    },
    "Chat failed"
  );
}

export async function calculateRation(params: {
  animalType: string; breed: string; weightKg: number;
  milkProductionL: number; language: string;
}): Promise<RationResult> {
  const base = getApiBase();
  return safeFetchJson<RationResult>(
    `${base}/farm/ration`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
    "Ration calculation failed"
  );
}

export async function parseVoiceCommand(request: VoiceCommandRequest): Promise<VoiceCommandResponse> {
  const base = getApiBase();
  return safeFetchJson<VoiceCommandResponse>(
    `${base}/farm/voice-command`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    "Voice command failed"
  );
}

// ==================== Misc Auth ====================

/**
 * Send a password reset email via OTP.
 * Uses the same send-otp endpoint — user gets an OTP, uses it to set a new password.
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  return sendOtpCode(email);
}

/**
 * Reset password using email, OTP code, and new password.
 */
export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ message: string }> {
  const base = getApiBase();
  const data = await safeFetchJson<{ message?: string }>(
    `${base}/auth/reset-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword }),
    },
    "Failed to reset password"
  );
  return { message: data.message ?? "Password reset successfully" };
}

export async function verify2fa(tempToken: string, token: string): Promise<{ user: any; accessToken: string; refreshToken: string }> {
  const base = getApiBase();
  return safeFetchJson<{ user: any; accessToken: string; refreshToken: string }>(
    `${base}/auth/verify-2fa`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tempToken, token }),
    },
    "2FA verification failed"
  );
}

// ==================== Legacy aliases ====================
// Kept so existing screens that haven't migrated yet don't break

/** @deprecated Use sendOtpCode instead */
export const sendOtp = sendOtpCode;
/** @deprecated Use verifyOtpCode instead */
export const verifyOtp = (email: string, otp: string) => verifyOtpCode(email, otp);
/** @deprecated Use loginUser instead */
export const signInWithEmail = (email: string, password: string) => loginUser(email, password) as any;
/** @deprecated Use registerUser instead */
export const signUpWithEmail = (email: string, password: string, meta?: any) =>
  registerUser(email, password, [meta?.firstName, meta?.lastName].filter(Boolean).join(" ") || "Farmer") as any;
/** @deprecated OTP-based; use sendOtpCode + verifyOtpCode instead */
export const requestEmailOtp = sendOtpCode;
/** @deprecated Use verifyOtpCode instead */
export const verifyEmailOtp = verifyOtpCode;
/** @deprecated No-op; logout is client-side now */
export const signOut = async (_accessToken: string) => {};
/** @deprecated Use getMyProfile instead */
export const getMe = getMyProfile;
