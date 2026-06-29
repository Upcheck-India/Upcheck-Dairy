import { useMilkContext } from "../context/MilkProvider";

export function useMilk() {
  const context = useMilkContext();
  return {
    loading: context.loading,
    error: context.error,
    milkEntries: context.milkEntries,
    createMilk: context.createMilk,
    updateMilk: context.updateMilk,
    removeMilk: context.removeMilk,
    refresh: context.refresh,
  };
}
