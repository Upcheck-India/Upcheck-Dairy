import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'
import { dairySchema } from './schema'
import {
  Farmer,
  Animal,
  MilkLog,
  HealthEvent,
  BreedingEvent,
  Vaccination,
  IncomeEntry,
  ExpenseEntry,
  Task,
  InventoryItem,
  RateCard,
} from './models'

import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

// MMKV is imported dynamically for React Native compatibility
let storageInstance: any = null
const cache = new Map<string, string>()

// Check if we are running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo'

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require('react-native-mmkv')
    storageInstance = new MMKV()
  } catch (e) {
    console.warn('MMKV failed to load, falling back to AsyncStorage')
  }
}

if (!storageInstance) {
  // In Expo Go or web, MMKV is not available. 
  // We use AsyncStorage with a synchronous cache fallback.
  console.warn('MMKV not available, using AsyncStorage fallback')
  storageInstance = {
    set: (key: string, value: string | boolean | number) => {
      const stringValue = String(value)
      cache.set(key, stringValue)
      AsyncStorage.setItem(key, stringValue).catch(console.error)
    },
    getString: (key: string) => cache.get(key),
    getBool: (key: string) => cache.get(key) === 'true',
    delete: (key: string) => {
      cache.delete(key)
      AsyncStorage.removeItem(key).catch(console.error)
    },
    contains: (key: string) => cache.has(key),
    clearAll: () => {
      cache.clear()
      AsyncStorage.clear().catch(console.error)
    },
  }

  // Hydrate the cache from AsyncStorage on startup
  AsyncStorage.getAllKeys().then((keys) => {
    AsyncStorage.multiGet(keys).then((pairs) => {
      pairs.forEach(([key, value]) => {
        if (value !== null) cache.set(key, value)
      })
    })
  })
}

export const storage = storageInstance

// ─── WatermelonDB Singleton ──────────────────────────────────────────────────
// Expo Go's Fast Refresh re-evaluates modules on every save. WatermelonDB
// throws if you try to create a second Database instance with the same adapter.
// We store both the adapter and instance on `global` to survive hot reloads.
declare const global: Record<string, any>;

if (!global.__wdb_adapter) {
  global.__wdb_adapter = new LokiJSAdapter({
    schema: dairySchema,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
  });
}

if (!global.__wdb_database) {
  global.__wdb_database = new Database({
    adapter: global.__wdb_adapter,
    modelClasses: [
      Farmer,
      Animal,
      MilkLog,
      HealthEvent,
      BreedingEvent,
      Vaccination,
      IncomeEntry,
      ExpenseEntry,
      Task,
      InventoryItem,
      RateCard,
    ],
  });
}

const database: Database = global.__wdb_database;
export default database;

/**
 * Storage keys for MMKV
 */
export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: 'auth_token',
  AUTH_PHONE: 'auth_phone',

  // Settings
  LANGUAGE: 'language',
  COOPERATIVE_CODE: 'cooperative_code',
  RATE_CARD_VERSION: 'rate_card_version',

  // Sync
  LAST_SYNC_TIME: 'last_sync_time',
  SYNC_IN_PROGRESS: 'sync_in_progress',

  // Feature flags
  ENABLE_BACKGROUND_SYNC: 'enable_background_sync',
  ENABLE_PUSH_NOTIFICATIONS: 'enable_push_notifications',
} as const

/**
 * Quick storage helpers
 */
export const Storage = {
  get: <T>(key: string): T | undefined => {
    const value = storage.getString(key)
    if (!value) return undefined
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof value === 'string') {
      storage.set(key, value)
    } else {
      storage.set(key, JSON.stringify(value))
    }
  },

  remove: (key: string): void => {
    storage.delete(key)
  },

  contains: (key: string): boolean => {
    return storage.contains(key)
  },

  // Boolean helpers
  getBool: (key: string): boolean => {
    return storage.getBool(key)
  },

  setBool: (key: string, value: boolean): void => {
    storage.set(key, value ? 'true' : 'false')
  },
}

/**
 * Clear all data (for logout/reset)
 */
export async function clearAllData(): Promise<void> {
  await database.write(async () => {
    const tables = [
      'farmers',
      'animals',
      'milk_logs',
      'health_events',
      'breeding_events',
      'vaccinations',
      'income_entries',
      'expense_entries',
      'tasks',
      'inventory_items',
      'rate_cards',
    ]
    for (const table of tables) {
      const collection = database.get<any>(table as any)
      const records = await collection.query().fetch()
      for (const record of records) {
        await record.destroyPermanently()
      }
    }
  })

  // Clear MMKV
  storage.clearAll()
}
