import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { signOut as apiSignOut, fetchProfile, createOrUpdateProfile } from "@/services/api";

// ==================== Types ====================

export interface FarmerProfile {
  id: string;
  name: string;
  phone?: string;
  village?: string;
  district?: string;
  state?: string;
  farmName?: string;
  avatarColor?: string;
  avatarInitials?: string;
  createdAt?: string;
  // Legacy compat
  totalLandAcres?: number;
}

interface FarmerContextType {
  farmer: FarmerProfile | null;
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Call after OTP verify to set the session from the backend response. */
  setSessionFromAuth: (session: Session) => Promise<void>;
  /** Create or update the farmer profile on the backend. */
  createProfile: (data: {
    name: string;
    phone?: string;
    village?: string;
    district?: string;
    state?: string;
    farmName?: string;
  }) => Promise<void>;
  updateProfile: (updates: Partial<FarmerProfile>) => Promise<void>;
  logout: () => Promise<void>;
  // Legacy helpers kept for compatibility with old OTP pages
  loginWithPhone: (phone: string) => Promise<"found" | "not_found">;
  hasProfileForPhone: (phone: string) => Promise<boolean>;
}

const FarmerContext = createContext<FarmerContextType | null>(null);

const LEGACY_FARMER_KEY = "thulirafarm_farmer_profile";

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from Supabase on mount and listen for changes
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        await loadFarmerProfile(s.access_token);
      } else {
        // Fallback: check legacy AsyncStorage profile
        await loadLegacyProfile();
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await loadFarmerProfile(s.access_token);
      } else {
        setFarmer(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadFarmerProfile = async (accessToken: string) => {
    try {
      const profile = await fetchProfile(accessToken);
      if (profile) {
        setFarmer(profile);
      }
    } catch {
      // Profile may not exist yet; that's OK
    }
  };

  const loadLegacyProfile = async () => {
    try {
      const data = await AsyncStorage.getItem(LEGACY_FARMER_KEY);
      if (data) {
        const stored: FarmerProfile = JSON.parse(data);
        setFarmer(stored);
      }
    } catch { /* ignore */ }
  };

  /**
   * Called after OTP verification / sign-in to set the Supabase session.
   * Supabase SDK will persist it automatically via AsyncStorage.
   */
  const setSessionFromAuth = useCallback(async (newSession: Session) => {
    const { error } = await supabase.auth.setSession({
      access_token: newSession.access_token,
      refresh_token: newSession.refresh_token,
    });
    if (!error) {
      setSession(newSession);
      setUser(newSession.user);
      await loadFarmerProfile(newSession.access_token);
    }
  }, []);

  const createProfile = useCallback(async (data: {
    name: string;
    phone?: string;
    village?: string;
    district?: string;
    state?: string;
    farmName?: string;
  }) => {
    const accessToken = session?.access_token;
    const avatarColor = pickAvatarColor(data.name);
    const avatarInitials = getInitials(data.name);

    const profileData: Partial<FarmerProfile> = {
      name: data.name.trim(),
      phone: data.phone,
      village: data.village?.trim(),
      district: data.district?.trim(),
      state: data.state ?? "Tamil Nadu",
      farmName: data.farmName?.trim() || undefined,
      avatarColor,
      avatarInitials,
    };

    if (accessToken) {
      // Save to backend
      const saved = await createOrUpdateProfile(accessToken, profileData);
      setFarmer({ ...profileData, ...saved });
    } else {
      // Fallback: save locally (legacy mode)
      const newFarmer: FarmerProfile = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        ...profileData,
        name: profileData.name ?? "",
      };
      await AsyncStorage.setItem(LEGACY_FARMER_KEY, JSON.stringify(newFarmer));
      setFarmer(newFarmer);
    }
  }, [session]);

  const updateProfile = useCallback(async (updates: Partial<FarmerProfile>) => {
    if (!farmer) return;
    const updated = { ...farmer, ...updates };
    const accessToken = session?.access_token;
    if (accessToken) {
      await createOrUpdateProfile(accessToken, updated);
    } else {
      await AsyncStorage.setItem(LEGACY_FARMER_KEY, JSON.stringify(updated));
    }
    setFarmer(updated);
  }, [farmer, session]);

  const logout = useCallback(async () => {
    try {
      if (session?.access_token) {
        await apiSignOut(session.access_token);
      }
    } catch { /* ignore signout errors */ }
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(LEGACY_FARMER_KEY);
    setFarmer(null);
    setUser(null);
    setSession(null);
  }, [session]);

  // ==================== Legacy compat ====================

  const hasProfileForPhone = useCallback(async (phone: string): Promise<boolean> => {
    const data = await AsyncStorage.getItem(LEGACY_FARMER_KEY);
    if (!data) return false;
    try {
      const stored: FarmerProfile = JSON.parse(data);
      return stored.phone === phone;
    } catch { return false; }
  }, []);

  const loginWithPhone = useCallback(async (phone: string): Promise<"found" | "not_found"> => {
    // With Supabase auth, phone login is handled via OTP verify.
    // This legacy stub checks if we already have a profile for this phone in storage.
    const found = await hasProfileForPhone(phone);
    if (found) {
      const data = await AsyncStorage.getItem(LEGACY_FARMER_KEY);
      if (data) {
        try { setFarmer(JSON.parse(data)); } catch { /* ignore */ }
      }
      return "found";
    }
    return "not_found";
  }, [hasProfileForPhone]);

  return (
    <FarmerContext.Provider value={{
      farmer,
      user,
      session,
      isAuthenticated: !!user || !!farmer,
      isLoading,
      setSessionFromAuth,
      createProfile,
      updateProfile,
      logout,
      loginWithPhone,
      hasProfileForPhone,
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
