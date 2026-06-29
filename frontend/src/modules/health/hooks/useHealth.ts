import { useHealthContext } from "../context/HealthProvider";

export function useHealth() {
  const context = useHealthContext();
  return {
    loading: context.loading,
    error: context.error,
    healthEvents: context.healthEvents,
    createEvent: context.createEvent,
    updateEvent: context.updateEvent,
    removeEvent: context.removeEvent,
    refresh: context.refresh,
  };
}
