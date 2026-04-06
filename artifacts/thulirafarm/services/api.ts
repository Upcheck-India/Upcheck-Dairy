const getApiBase = (): string => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    return `https://${domain}/api-server/api`;
  }
  return "http://localhost:8080/api";
};

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

export interface SendOtpResponse {
  success: boolean;
  message: string;
  demoOtp?: string;
  expiresIn: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
}

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const base = getApiBase();
  const response = await fetch(`${base}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await response.json() as SendOtpResponse & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? `Failed to send OTP: ${response.status}`);
  }
  return data;
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  const base = getApiBase();
  const response = await fetch(`${base}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  const data = await response.json() as VerifyOtpResponse & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? `OTP verification failed: ${response.status}`);
  }
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
