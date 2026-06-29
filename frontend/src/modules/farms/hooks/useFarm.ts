import { useFarmContext } from "../context/FarmProvider";

export function useFarm() {
  const context = useFarmContext();
  return {
    loading: context.loading,
    farmsLoaded: context.farmsLoaded,
    farms: context.farms,
    activeFarm: context.activeFarm,
    switchFarm: context.switchFarm,
    refreshFarms: context.refreshFarms,
  };
}
