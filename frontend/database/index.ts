import { Database } from '@nozbe/watermelondb'
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

// MMKV is imported dynamically for React Native compatibility
let storageInstance: any = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MMKV } = require('react-native-mmkv')
  storageInstance = new MMKV()
} catch (e) {
  // In test environments or web, MMKV may not be available
  console.warn('MMKV not available, using fallback storage')
  storageInstance = {
    set: () => {},
    getString: () => undefined,
    getBool: () => false,
    delete: () => {},
    contains: () => false,
    clearAll: () => {},
  }
}

export const storage = storageInstance

// Initialize WatermelonDB
const database = new Database({
  adapter: {
    schema: dairySchema,
  } as any,
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
  ] as any,
})

export default database

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
