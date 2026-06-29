import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { HealthEvent } from "../models/HealthEvent";
import { healthRepository } from "../api/HealthRepository";
import { CreateHealthEventRequestDto, UpdateHealthEventRequestDto } from "../types/HealthDto";
import { useFarm } from "../../../modules/farms/hooks/useFarm";

interface HealthContextType {
  loading: boolean;
  error: Error | null;
  healthEvents: HealthEvent[];
  createEvent: (dto: CreateHealthEventRequestDto) => Promise<HealthEvent>;
  updateEvent: (id: number, dto: UpdateHealthEventRequestDto) => Promise<HealthEvent>;
  removeEvent: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const HealthContext = createContext<HealthContextType | null>(null);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const { activeFarm } = useFarm();
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHealth = useCallback(async (farmId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await healthRepository.getHealthEvents(farmId);
      setHealthEvents(data);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e.message || "Failed to load health events"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFarm?.id) {
      fetchHealth(activeFarm.id);
    } else {
      setHealthEvents([]);
    }
  }, [activeFarm?.id, fetchHealth]);

  const createEvent = async (dto: CreateHealthEventRequestDto) => {
    setError(null);
    setLoading(true);
    try {
      const newEvent = await healthRepository.createHealthEvent(dto);
      setHealthEvents(prev => [newEvent, ...prev]);
      return newEvent;
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to create health event");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: number, dto: UpdateHealthEventRequestDto) => {
    setError(null);
    setLoading(true);
    try {
      const updated = await healthRepository.updateHealthEvent(id, dto);
      setHealthEvents(prev => prev.map(h => (Number(h.id) === id ? updated : h)));
      return updated;
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to update health event");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeEvent = async (id: number) => {
    setError(null);
    setLoading(true);
    try {
      await healthRepository.deleteHealthEvent(id);
      setHealthEvents(prev => prev.filter(h => Number(h.id) !== id));
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e.message || "Failed to delete health event");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (activeFarm?.id) {
      await fetchHealth(activeFarm.id);
    }
  };

  return (
    <HealthContext.Provider value={{
      loading,
      error,
      healthEvents,
      createEvent,
      updateEvent,
      removeEvent,
      refresh,
    }}>
      {children}
    </HealthContext.Provider>
  );
}

export function useHealthContext() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error("useHealthContext must be used within HealthProvider");
  return ctx;
}
