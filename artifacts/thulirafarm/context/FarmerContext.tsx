import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  pin: string;
  avatarColor: string;
  createdAt: string;
  farmName?: string;
  totalLandAcres?: number;
}

interface FarmerContextType {
  farmer: FarmerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (profile: Omit<FarmerProfile, "id" | "createdAt" | "avatarColor">) => Promise<void>;
  login: (phone: string, pin: string) => Promise<boolean>;
  updateProfile: (updates: Partial<FarmerProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const FarmerContext = createContext<FarmerContextType | null>(null);

const FARMER_KEY = "thulirafarm_farmer_profile";

const AVATAR_COLORS = [
  "#16a34a", "#0284c7", "#7c3aed", "#d97706", "#dc2626",
  "#059669", "#2563eb", "#9333ea", "#b45309", "#e11d48",
];

function pickAvatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] ?? AVATAR_COLORS[0]!;
}

export function FarmerProvider({ children }: { children: React.ReactNode }) {
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(FARMER_KEY).then((data) => {
      if (data) {
        try {
          setFarmer(JSON.parse(data));
        } catch { /* ignore */ }
      }
      setIsLoading(false);
    });
  }, []);

  const signUp = useCallback(async (profile: Omit<FarmerProfile, "id" | "createdAt" | "avatarColor">) => {
    const newFarmer: FarmerProfile = {
      ...profile,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      avatarColor: pickAvatarColor(profile.name),
    };
    await AsyncStorage.setItem(FARMER_KEY, JSON.stringify(newFarmer));
    setFarmer(newFarmer);
  }, []);

  const login = useCallback(async (phone: string, pin: string): Promise<boolean> => {
    const data = await AsyncStorage.getItem(FARMER_KEY);
    if (!data) return false;
    try {
      const stored: FarmerProfile = JSON.parse(data);
      if (stored.phone === phone && stored.pin === pin) {
        setFarmer(stored);
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }, []);

  const updateProfile = useCallback(async (updates: Partial<FarmerProfile>) => {
    if (!farmer) return;
    const updated = { ...farmer, ...updates };
    await AsyncStorage.setItem(FARMER_KEY, JSON.stringify(updated));
    setFarmer(updated);
  }, [farmer]);

  const logout = useCallback(async () => {
    setFarmer(null);
  }, []);

  return (
    <FarmerContext.Provider value={{
      farmer,
      isAuthenticated: !!farmer,
      isLoading,
      signUp,
      login,
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
