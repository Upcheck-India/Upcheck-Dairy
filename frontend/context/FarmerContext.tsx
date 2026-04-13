import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  avatarColor: string;
  createdAt: string;
  farmName?: string;
  totalLandAcres?: number;
}

interface FarmerContextType {
  farmer: FarmerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  createProfile: (data: {
    phone: string;
    name: string;
    village?: string;
    district?: string;
    state?: string;
    farmName?: string;
  }) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<"found" | "not_found">;
  hasProfileForPhone: (phone: string) => Promise<boolean>;
  updateProfile: (updates: Partial<FarmerProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const FarmerContext = createContext<FarmerContextType | null>(null);

const FARMER_KEY = "thulirafarm_farmer_profile";
const AVATAR_COLORS = [
  "#16a34a", "#0284c7", "#7c3aed", "#d97706", "#dc2626",
  "#059669", "#2563eb", "#9333ea", "#b45309", "#e11d48",
  "#0891b2", "#ea580c", "#65a30d",
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
        try { setFarmer(JSON.parse(data)); } catch { /* ignore */ }
      }
      setIsLoading(false);
    });
  }, []);

  const hasProfileForPhone = useCallback(async (phone: string): Promise<boolean> => {
    const data = await AsyncStorage.getItem(FARMER_KEY);
    if (!data) return false;
    try {
      const stored: FarmerProfile = JSON.parse(data);
      return stored.phone === phone;
    } catch { return false; }
  }, []);

  const loginWithPhone = useCallback(async (phone: string): Promise<"found" | "not_found"> => {
    const data = await AsyncStorage.getItem(FARMER_KEY);
    if (!data) return "not_found";
    try {
      const stored: FarmerProfile = JSON.parse(data);
      if (stored.phone === phone) {
        setFarmer(stored);
        return "found";
      }
    } catch { /* ignore */ }
    return "not_found";
  }, []);

  const createProfile = useCallback(async (data: {
    phone: string; name: string; village?: string;
    district?: string; state?: string; farmName?: string;
  }) => {
    const newFarmer: FarmerProfile = {
      id: Date.now().toString(),
      name: data.name.trim(),
      phone: data.phone,
      village: data.village?.trim() ?? "",
      district: data.district?.trim() ?? "",
      state: data.state ?? "Tamil Nadu",
      farmName: data.farmName?.trim() || undefined,
      avatarColor: pickAvatarColor(data.name),
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(FARMER_KEY, JSON.stringify(newFarmer));
    setFarmer(newFarmer);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<FarmerProfile>) => {
    if (!farmer) return;
    const updated = { ...farmer, ...updates };
    await AsyncStorage.setItem(FARMER_KEY, JSON.stringify(updated));
    setFarmer(updated);
  }, [farmer]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(FARMER_KEY);
    } catch { /* ignore storage errors */ }
    setFarmer(null);
  }, []);

  return (
    <FarmerContext.Provider value={{
      farmer, isAuthenticated: !!farmer, isLoading,
      createProfile, loginWithPhone, hasProfileForPhone, updateProfile, logout,
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
