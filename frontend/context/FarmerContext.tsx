import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMyProfile, createOrUpdateProfile, logoutUser, type AuthUser, type AuthResult } from "@/services/api";
import { tokenStore } from "../src/core/auth/TokenStore";

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
  /** Provider profile picture (Google). Null means fall back to initials. */
  avatarUrl?: string | null;
  /** How the account was originally created: "google", "email", or "phone". */
  authProvider?: string | null;
  /**
   * Whether the account can sign in with Google. Derived from `googleId`
   * rather than `authProvider`, because an account created with a password
   * and later linked to Google keeps authProvider === "email".
   */
  googleLinked?: boolean;
  createdAt?: string;
  // Legacy compat
  totalLandAcres?: number;
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
  }) => Promise<FarmerProfile>;
  updateProfile: (updates: Partial<FarmerProfile>) => Promise<void>;
  /** Revokes the session server-side, then clears it locally. */
  logout: () => Promise<void>;
}

const FarmerContext = createContext<FarmerContextType | null>(null);

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

  // On mount: restore and validate any persisted session.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await tokenStore.hydrate();
        if (!stored?.accessToken || !mounted) return;

        // Validates the session: a stale access token 401s, and getMyProfile
        // refreshes and replays before this resolves. Only a dead refresh
        // token reaches the catch.
        const me = await getMyProfile();
        if (!mounted) return;
        setUser(me);
        setAccessToken(tokenStore.getAccessToken());
        setFarmer(userToFarmerProfile(me));
      } catch {
        // Refresh token spent or revoked — the session is genuinely over.
        await tokenStore.clear();
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Keep React state in step with the token store. Two cases matter: a
  // background refresh swaps the access token, and a refresh that fails
  // clears the session — without this the UI would stay "signed in" while
  // every request 401s.
  useEffect(() => {
    return tokenStore.subscribe((session) => {
      setAccessToken(session?.accessToken ?? null);
      if (!session) {
        setUser(null);
        setFarmer(null);
      }
    });
  }, []);

  function userToFarmerProfile(u: AuthUser): FarmerProfile {
    const name = u.name || u.email?.split("@")[0] || "Farmer";
    return {
      id: u.id,
      name,
      email: u.email ?? undefined,
      phone: u.phone ?? undefined,
      village: u.village ?? undefined,
      district: u.district ?? undefined,
      state: u.state ?? undefined,
      farmName: u.farmName ?? undefined,
      avatarColor: u.avatarColor ?? pickAvatarColor(name),
      avatarInitials: u.avatarInitials ?? getInitials(name),
      avatarUrl: u.avatarUrl ?? null,
      authProvider: u.authProvider ?? null,
      googleLinked: !!u.googleId,
      createdAt: u.createdAt,
      notificationsEnabled: u.notificationsEnabled ?? u.notificationPermission ?? false,
    };
  }

  /**
   * Store JWT tokens and update user state.
   * Called right after a successful login or OTP verify.
   */
  const loginWithJwt = useCallback(async (result: AuthResult) => {
    await tokenStore.set({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: result.user.id,
    });
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
  }): Promise<FarmerProfile> => {
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
      const merged = { ...(farmer ?? {}), ...profileData, ...saved } as FarmerProfile;
      setFarmer(merged);
      return merged;
    }

    // Shouldn't happen in normal flow, but handle gracefully
    const newFarmer: FarmerProfile = {
      id: user?.id ?? Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...profileData,
      name: profileData.name ?? "",
    };
    setFarmer(newFarmer);
    return newFarmer;
  }, [accessToken, user, farmer]);

  const updateProfile = useCallback(async (updates: Partial<FarmerProfile>) => {
    if (!farmer) return;
    const updated = { ...farmer, ...updates };
    if (accessToken) {
      await createOrUpdateProfile(accessToken, updated);
    }
    setFarmer(updated);
  }, [farmer, accessToken]);

  const logout = useCallback(async () => {
    // Best effort: if the network is down we still clear locally rather than
    // trapping the user in a session they asked to end.
    try {
      await logoutUser();
    } catch {
      /* ignore — local sign-out proceeds regardless */
    }
    await tokenStore.clear();
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
