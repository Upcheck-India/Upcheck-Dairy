import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFarm } from "@/src/modules/farms/hooks/useFarm";
import { useAnimals } from "@/src/modules/animals/hooks/useAnimals";

export interface Shed {
  id: string;
  name: string;
  desc?: string;
  capacity?: number;
  isDefault?: boolean;
  createdAt?: string;
}

interface ShedContextType {
  sheds: Shed[];
  loading: boolean;
  addShed: (name: string, desc?: string, capacity?: number) => Promise<Shed>;
  updateShed: (id: string, name: string, desc?: string, capacity?: number) => Promise<Shed>;
  deleteShed: (id: string, reassignToShedId?: string) => Promise<void>;
  getShedById: (id: string) => Shed | undefined;
  refreshSheds: () => Promise<void>;
}

const DEFAULT_SHEDS: Shed[] = [
  { id: "shed_1", name: "Shed 1 - Main Shed", desc: "Main housing shed", isDefault: true },
  { id: "shed_2", name: "Shed 2 - North Shed", desc: "North block", isDefault: true },
  { id: "shed_3", name: "Shed 3 - Open Shed", desc: "Open housing", isDefault: true },
  { id: "shed_4", name: "Shed 4 - Calf Pen", desc: "Calf and young stock", isDefault: true },
];

const ShedContext = createContext<ShedContextType | null>(null);

export function ShedProvider({ children }: { children: React.ReactNode }) {
  const { activeFarm } = useFarm();
  const { animals, updateAnimal } = useAnimals();
  const [sheds, setSheds] = useState<Shed[]>(DEFAULT_SHEDS);
  const [loading, setLoading] = useState<boolean>(false);

  const storageKey = useMemo(() => {
    return activeFarm?.id ? `@upcheck_sheds_${activeFarm.id}` : "@upcheck_sheds_default";
  }, [activeFarm?.id]);

  // Load saved sheds from AsyncStorage
  const loadSheds = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed: Shed[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSheds(parsed);
          return;
        }
      }
      // If no stored sheds yet, initialize with default sheds
      setSheds(DEFAULT_SHEDS);
      await AsyncStorage.setItem(storageKey, JSON.stringify(DEFAULT_SHEDS));
    } catch (err) {
      console.warn("Failed to load sheds from storage:", err);
      setSheds(DEFAULT_SHEDS);
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    loadSheds();
  }, [loadSheds]);

  const saveSheds = async (updated: Shed[]) => {
    setSheds(updated);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to save sheds:", err);
    }
  };

  const addShed = useCallback(async (name: string, desc?: string, capacity?: number): Promise<Shed> => {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Shed name cannot be empty");

    const newShed: Shed = {
      id: `shed_custom_${Date.now()}`,
      name: cleanName,
      desc: desc?.trim() || undefined,
      capacity: capacity || 25,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...sheds, newShed];
    await saveSheds(updated);
    return newShed;
  }, [sheds, storageKey]);

  const updateShed = useCallback(async (id: string, name: string, desc?: string, capacity?: number): Promise<Shed> => {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Shed name cannot be empty");

    const existingIndex = sheds.findIndex((s) => s.id === id);
    if (existingIndex === -1) throw new Error("Shed not found");

    const updatedShed: Shed = {
      ...sheds[existingIndex],
      name: cleanName,
      desc: desc !== undefined ? desc.trim() : sheds[existingIndex].desc,
      capacity: capacity !== undefined ? capacity : sheds[existingIndex].capacity,
    };

    const updated = [...sheds];
    updated[existingIndex] = updatedShed;
    await saveSheds(updated);
    return updatedShed;
  }, [sheds, storageKey]);

  const deleteShed = useCallback(async (id: string, reassignToShedId: string = "shed_1") => {
    if (sheds.length <= 1) {
      throw new Error("Cannot delete the only shed. At least one shed must exist.");
    }

    // Check animals in this shed and reassign them
    const affectedAnimals = animals.filter((a) => a.shed === id);
    for (const animal of affectedAnimals) {
      await updateAnimal(Number(animal.id), { shed: reassignToShedId });
    }

    const updated = sheds.filter((s) => s.id !== id);
    await saveSheds(updated);
  }, [sheds, animals, updateAnimal, storageKey]);

  const getShedById = useCallback((id: string) => {
    return sheds.find((s) => s.id === id);
  }, [sheds]);

  const value = useMemo(() => ({
    sheds,
    loading,
    addShed,
    updateShed,
    deleteShed,
    getShedById,
    refreshSheds: loadSheds,
  }), [sheds, loading, addShed, updateShed, deleteShed, getShedById, loadSheds]);

  return <ShedContext.Provider value={value}>{children}</ShedContext.Provider>;
}

export function useSheds() {
  const ctx = useContext(ShedContext);
  if (!ctx) {
    throw new Error("useSheds must be used within a ShedProvider");
  }
  return ctx;
}
