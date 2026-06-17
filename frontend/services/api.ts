const getApiBase = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return "http://localhost:3000/api";
};

// ==================== Types ====================

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: Record<string, any>;
  created_at?: string;
}

export interface AuthResult {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  message?: string;
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

/** Request an email OTP (passwordless login). */
export async function requestEmailOtp(email: string): Promise<{ message: string }> {
  const base = getApiBase();
  const response = await fetch(`${base}/auth/supabase/login-otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json() as { message?: string; error?: string };
  if (!response.ok) throw new Error(data.error ?? `Failed to send OTP: ${response.status}`);
  return { message: data.message ?? "OTP sent" };
}

/** Verify an email OTP. Returns session + user on success. */
export async function verifyEmailOtp(email: string, otp: string): Promise<AuthResult> {
  const base = getApiBase();
  const response = await fetch(`${base}/auth/supabase/login-otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json() as AuthResult & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `OTP verification failed: ${response.status}`);
  return data;
}

/** Sign up with email + password. */
export async function signUpWithEmail(
  email: string,
  password: string,
  meta?: { firstName?: string; lastName?: string; username?: string }
): Promise<AuthResult> {
  const base = getApiBase();
  const response = await fetch(`${base}/auth/supabase/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, ...meta }),
  });
  const data = await response.json() as AuthResult & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `Sign up failed: ${response.status}`);
  return data;
}

/** Sign in with email + password. May return requires2FA + tempToken. */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult & { requires2FA?: boolean; tempToken?: string }> {
  const base = getApiBase();
  const response = await fetch(`${base}/auth/supabase/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json() as AuthResult & { requires2FA?: boolean; tempToken?: string; error?: string };
  if (!response.ok) throw new Error(data.error ?? `Sign in failed: ${response.status}`);
  return data;
}

/** Refresh the session using a refresh token. */
export async function refreshSession(refreshToken: string): Promise<AuthResult> {
  const base = getApiBase();
  const response = await fetch(`${base}/auth/supabase/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await response.json() as AuthResult & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `Session refresh failed: ${response.status}`);
  return data;
}

/** Sign out (invalidates the server session). */
export async function signOut(accessToken: string): Promise<void> {
  const base = getApiBase();
  await fetch(`${base}/auth/supabase/signout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/** Get the currently authenticated user from the server. */
export async function getMe(accessToken: string): Promise<SupabaseUser> {
  const base = getApiBase();
  const response = await fetch(`${base}/auth/supabase/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json() as { user: SupabaseUser; error?: string };
  if (!response.ok) throw new Error(data.error ?? `Failed to fetch user: ${response.status}`);
  return data.user;
}

/**
 * Sign in with Google via Supabase OAuth.
 * Uses the backend's /api/auth/supabase/oauth/google endpoint.
 * Pass the idToken obtained from Google Sign-In on the device.
 */
export async function signInWithGoogle(idToken?: string): Promise<AuthResult> {
  if (idToken) {
    // Native Google Sign-In path: exchange idToken on backend
    const base = getApiBase();
    const response = await fetch(`${base}/auth/supabase/oauth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const data = await response.json() as AuthResult & { error?: string };
    if (!response.ok) throw new Error(data.error ?? `Google sign-in failed: ${response.status}`);
    return data;
  }
  // Web OAuth flow via Supabase directly (no native SDK)
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { skipBrowserRedirect: true },
  });
  if (error) throw new Error(error.message);
  // In native Expo, open the URL in a browser
  const { default: WebBrowser } = await import("expo-web-browser");
  if (data.url) {
    await WebBrowser.openBrowserAsync(data.url);
  }
  // Session will be picked up by the supabase.auth.onAuthStateChange listener
  const { data: { session } } = await supabase.auth.getSession();
  return { user: session?.user ?? null, session: session as any };
}

/** Send a password reset email. */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const base = getApiBase();
  const response = await fetch(`${base}/auth/supabase/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json() as { message?: string; error?: string };
  if (!response.ok) throw new Error(data.error ?? `Failed to send reset email: ${response.status}`);
  return { message: data.message ?? "Reset email sent" };
}

/**
 * Verify a TOTP 2FA code after initial sign-in.
 * tempToken is the short-lived token returned by signInWithEmail when requires2FA is true.
 */
export async function verify2fa(tempToken: string, token: string): Promise<{ session: AuthResult["session"] }> {
  const base = getApiBase();
  const response = await fetch(`${base}/auth/supabase/2fa/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tempToken, token }),
  });
  const data = await response.json() as { session: AuthResult["session"]; error?: string };
  if (!response.ok) throw new Error(data.error ?? `2FA verification failed: ${response.status}`);
  return data;
}

// ==================== Farm / Profile API ====================

export interface FarmerProfile {
  id: string;
  name: string;
  phone?: string;
  farmName?: string;
  village?: string;
  district?: string;
  state?: string;
  avatarInitials?: string;
  avatarColor?: string;
  createdAt?: string;
}

export async function fetchProfile(accessToken: string): Promise<FarmerProfile | null> {
  const base = getApiBase();
  const response = await fetch(`${base}/farm/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json() as Promise<FarmerProfile>;
}

export async function createOrUpdateProfile(
  accessToken: string,
  profile: Partial<FarmerProfile>
): Promise<FarmerProfile> {
  const base = getApiBase();
  const response = await fetch(`${base}/farm/profile`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });
  if (!response.ok) throw new Error("Failed to save profile");
  return response.json() as Promise<FarmerProfile>;
}

// ==================== Diagnostics ====================

export async function diagnoseSymptoms(request: DiagnoseRequest): Promise<DiagnoseResponse> {
  const base = getApiBase();
  const response = await fetch(`${base}/farm/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Diagnosis failed: ${response.status}`);
  }
  return response.json() as Promise<DiagnoseResponse>;
}

export async function transcribeAudio(audioUri: string, mimeType?: string): Promise<string> {
  const base = getApiBase();
  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    type: mimeType ?? "audio/m4a",
    name: "recording.m4a",
  } as any);
  const response = await fetch(`${base}/farm/transcribe`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.status}`);
  }
  const data = await response.json() as { transcript: string };
  return data.transcript;
}

export async function chatWithGauGuru(
  message: string,
  history: ChatMessage[],
  language: string
): Promise<{ response: string }> {
  const base = getApiBase();
  const response = await fetch(`${base}/farm/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, language }),
  });
  const data = await response.json() as { response: string; error?: string };
  if (!response.ok) throw new Error(data.error ?? "Chat failed");
  return data;
}

export async function calculateRation(params: {
  animalType: string; breed: string; weightKg: number;
  milkProductionL: number; language: string;
}): Promise<RationResult> {
  const base = getApiBase();
  const response = await fetch(`${base}/farm/ration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await response.json() as RationResult & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Ration calculation failed");
  return data;
}

export async function parseVoiceCommand(request: VoiceCommandRequest): Promise<VoiceCommandResponse> {
  const base = getApiBase();
  const response = await fetch(`${base}/farm/voice-command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Voice command failed: ${response.status}`);
  }
  return response.json() as Promise<VoiceCommandResponse>;
}

// Legacy aliases kept for pages that haven't migrated yet
export const sendOtp = requestEmailOtp;
export const verifyOtp = (phone: string, otp: string) => verifyEmailOtp(phone, otp);
