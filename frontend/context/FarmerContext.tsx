import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMyProfile, createOrUpdateProfile, type AuthUser, type AuthResult } from "@/services/api";

// ==================== Types ====================

export interface FarmerProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  village?: string;
  district?: string;
  state?: string;
  farmName?: string;
  pincode?: string;
  locationPermission?: boolean;
  notificationsEnabled?: boolean;
  onboardingCompleted?: boolean;
  avatarColor?: string;
  avatarInitials?: string;
  createdAt?: string;
  // Legacy compat
  totalLandAcres?: number;
}

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

interface FarmerContextType {
  farmer: FarmerProfile | null;
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /**
   * Called after OTP verify or password login to store tokens and set user.
   * Replaces the old Supabase setSessionFromAuth.
   */
  loginWithJwt: (result: AuthResult) => Promise<void>;
  /** Create or update the farmer profile on the backend. */
  createProfile: (data: {
    name: string;
    phone?: string;
    village?: string;
    district?: string;
    state?: string;
    farmName?: string;
    pincode?: string;
    locationPermission?: boolean;
    notificationsEnabled?: boolean;
    onboardingCompleted?: boolean;
  }) => Promise<void>;
  updateProfile: (updates: Partial<FarmerProfile>) => Promise<void>;
  /** Client-side logout — clears AsyncStorage tokens. */
  logout: () => Promise<void>;
}

const FarmerContext = createContext<FarmerContextType | null>(null);

const AUTH_STORAGE_KEY = "upcheck_auth";

const AVATAR_COLORS = [
  "#16a34a", "#0284c7", "#7c3aed", "#d97706", "#dc2626",
  "#059669", "#2563eb", "#9333ea", "#b45309", "#e11d48",
  "#0891b2", "#ea580c", "#65a30d",
];

function pickAvatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] ?? AVATAR_COLORS[0]!;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function FarmerProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from SecureStore
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
        if (!raw || !mounted) return;
        const stored: StoredAuth = JSON.parse(raw);
        if (!stored.accessToken) return;

        // Validate token by fetching user profile
        const me = await getMyProfile(stored.accessToken);
        if (!mounted) return;
        setUser(me);
        setAccessToken(stored.accessToken);

        // Build a FarmerProfile from the user data
        setFarmer(userToFarmerProfile(me));
      } catch {
        // Token expired or invalid — clear storage
        await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function userToFarmerProfile(u: AuthUser): FarmerProfile {
    const name = u.name || u.email?.split("@")[0] || "Farmer";
    return {
      id: u.id,
      name,
      phone: u.phone ?? undefined,
      village: u.village ?? undefined,
      district: u.district ?? undefined,
      state: u.state ?? undefined,
      farmName: u.farmName ?? undefined,
      avatarColor: u.avatarColor ?? pickAvatarColor(name),
      avatarInitials: u.avatarInitials ?? getInitials(name),
      createdAt: u.createdAt,
    };
  }

  /**
   * Store JWT tokens and update user state.
   * Called right after a successful login or OTP verify.
   */
  const loginWithJwt = useCallback(async (result: AuthResult) => {
    const stored: StoredAuth = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: result.user.id,
    };
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(stored));
    setAccessToken(result.accessToken);
    setUser(result.user);
    setFarmer(userToFarmerProfile(result.user));
  }, []);

  const createProfile = useCallback(async (data: {
    name: string;
    phone?: string;
    village?: string;
    district?: string;
    state?: string;
    farmName?: string;
    pincode?: string;
    locationPermission?: boolean;
    notificationsEnabled?: boolean;
    onboardingCompleted?: boolean;
  }) => {
    const token = accessToken;
    const avatarColor = pickAvatarColor(data.name);
    const avatarInitials = getInitials(data.name);

    const profileData: Partial<FarmerProfile> = {
      name: data.name.trim(),
      phone: data.phone,
      village: data.village?.trim(),
      district: data.district?.trim(),
      state: data.state ?? "Tamil Nadu",
      farmName: data.farmName?.trim() || undefined,
      pincode: data.pincode,
      locationPermission: data.locationPermission,
      notificationsEnabled: data.notificationsEnabled,
      onboardingCompleted: data.onboardingCompleted,
      avatarColor,
      avatarInitials,
    };

    if (token) {
      const saved = await createOrUpdateProfile(token, profileData);
      setFarmer((prev) => ({ ...prev, ...profileData, ...saved } as FarmerProfile));
    } else {
      // Shouldn't happen in normal flow, but handle gracefully
      const newFarmer: FarmerProfile = {
        id: user?.id ?? Date.now().toString(),
        createdAt: new Date().toISOString(),
        ...profileData,
        name: profileData.name ?? "",
      };
      setFarmer(newFarmer);
    }
  }, [accessToken, user]);

  const updateProfile = useCallback(async (updates: Partial<FarmerProfile>) => {
    if (!farmer) return;
    const updated = { ...farmer, ...updates };
    if (accessToken) {
      await createOrUpdateProfile(accessToken, updated);
    }
    setFarmer(updated);
  }, [farmer, accessToken]);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    setFarmer(null);
    setUser(null);
    setAccessToken(null);
  }, []);

  return (
    <FarmerContext.Provider value={{
      farmer,
      user,
      accessToken,
      isAuthenticated: !!user,
      isLoading,
      loginWithJwt,
      createProfile,
      updateProfile,
      logout,
    }}>
      {children}
    </FarmerContext.Provider>
  );
}

export function useFarmer() {
  const ctx = useContext(FarmerContext);
  if (!ctx) throw new Error("useFarmer must be used within FarmerProvider");
  return ctx;
}
