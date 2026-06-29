import AsyncStorage from "@react-native-async-storage/async-storage";

export const Storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (e) {
      console.error(`[Storage] Error reading key: ${key}`, e);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[Storage] Error writing key: ${key}`, e);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`[Storage] Error removing key: ${key}`, e);
    }
  },

  activeFarm: {
    async save(farmId: string): Promise<void> {
      await Storage.set("thulirfarm:active_farm_id", farmId);
    },
    async load(): Promise<string | null> {
      return Storage.get<string>("thulirfarm:active_farm_id");
    },
    async clear(): Promise<void> {
      await Storage.remove("thulirfarm:active_farm_id");
    }
  }
};
