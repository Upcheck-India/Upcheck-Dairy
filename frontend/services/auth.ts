/**
 * Auth service — thin wrapper around api.ts and the Supabase client.
 * Use the functions here when you need a header for authenticated requests.
 */
import { supabase } from "../lib/supabase";

const getApiBase = (): string => {
  return process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";
};

export async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

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

export async function fetchProfile(): Promise<FarmerProfile | null> {
  const headers = await getAuthHeader();
  if (!headers.Authorization) return null;

  const base = getApiBase();
  const response = await fetch(`${base}/farm/profile`, {
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch profile");

  return response.json();
}

export async function createOrUpdateProfile(profile: Partial<FarmerProfile>): Promise<FarmerProfile> {
  const headers = await getAuthHeader();
  const base = getApiBase();

  const response = await fetch(`${base}/farm/profile`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) throw new Error("Failed to save profile");

  return response.json();
}
