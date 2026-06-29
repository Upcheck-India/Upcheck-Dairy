import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Farm } from "../models/Farm";
import { farmRepository } from "../api/FarmRepository";
import { apiClient } from "../../../core/api/ApiClient";
import { eventBus } from "../../../core/events/EventBus";
import { EVENTS } from "../../../core/constants";
import { useFarmer } from "@/context/FarmerContext";

interface FarmContextType {
  loading: boolean;
  farmsLoaded: boolean;
  farms: Farm[];
  activeFarm: Farm | null;
  switchFarm: (id: string) => Promise<void>;
  refreshFarms: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | null>(null);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated } = useFarmer();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [farmsLoaded, setFarmsLoaded] = useState<boolean>(false);

  const loadFarmsState = useCallback(async (token: string) => {
    setLoading(true);
    try {
      apiClient.configure({ token });
      const loadedFarms = await farmRepository.fetch();
      setFarms(loadedFarms);

      const persistedId = await farmRepository.getActiveFarmId();
      let resolvedFarm: Farm | null = null;

      if (loadedFarms.length > 0) {
        resolvedFarm = loadedFarms.find(f => f.id === persistedId) || loadedFarms[0]!;
      }

      setActiveFarm(resolvedFarm);
      apiClient.configure({ farmId: resolvedFarm?.id || null });
      setFarmsLoaded(true);

      if (resolvedFarm) {
        eventBus.emit(EVENTS.FARM_CHANGED, resolvedFarm);
      }
    } catch (e) {
      console.error("[FarmProvider] Error loading farms:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      loadFarmsState(accessToken);
    } else {
      apiClient.reset();
      setFarms([]);
      setActiveFarm(null);
      setFarmsLoaded(false);
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, loadFarmsState]);

  const switchFarm = async (id: string) => {
    const targetFarm = farms.find(f => f.id === id);
    if (!targetFarm) return;

    setLoading(true);
    try {
      await farmRepository.setActiveFarmId(id);
      setActiveFarm(targetFarm);
      apiClient.configure({ farmId: id });
      eventBus.emit(EVENTS.FARM_CHANGED, targetFarm);
    } finally {
      setLoading(false);
    }
  };

  const refreshFarms = async () => {
    if (accessToken) {
      await loadFarmsState(accessToken);
    }
  };

  return (
    <FarmContext.Provider value={{
      loading,
      farmsLoaded,
      farms,
      activeFarm,
      switchFarm,
      refreshFarms,
    }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarmContext() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error("useFarmContext must be used within FarmProvider");
  return ctx;
}
