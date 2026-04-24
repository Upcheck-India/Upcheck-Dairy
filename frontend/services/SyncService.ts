/**
 * Background Sync Service
 *
 * Handles automatic synchronization of local WatermelonDB data
 * with the backend API. Features:
 * - Exponential backoff retry logic
 * - Batch processing for efficiency
 * - Network status detection
 * - Progress tracking via events
 */

import NetInfo from '@react-native-community/netinfo'
import Constants from 'expo-constants'
import database, { Storage, STORAGE_KEYS } from '../database'
import type MilkLog from '../database/models/MilkLog'
import type HealthEvent from '../database/models/HealthEvent'
import type BreedingEvent from '../database/models/BreedingEvent'
import type Vaccination from '../database/models/Vaccination'
import type IncomeEntry from '../database/models/IncomeEntry'
import type ExpenseEntry from '../database/models/ExpenseEntry'

// Sync configuration
const MAX_RETRY_ATTEMPTS = 5
const BASE_RETRY_DELAY_MS = 2000
const MAX_RETRY_DELAY_MS = 128000 // 2 minutes
const BATCH_SIZE = 50

// API base URL (use environment variable in production)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '/api'

/**
 * Sync event types for progress tracking
 */
export type SyncEventType =
  | 'sync_started'
  | 'sync_progress'
  | 'sync_completed'
  | 'sync_failed'
  | 'batch_started'
  | 'batch_completed'
  | 'item_synced'
  | 'item_failed'

export interface SyncEvent {
  type: SyncEventType
  table?: string
  synced?: number
  total?: number
  error?: string
  timestamp: number
}

/**
 * Sync listeners for UI updates
 */
type SyncListener = (event: SyncEvent) => void
const syncListeners: SyncListener[] = []

export function addSyncListener(listener: SyncListener): () => void {
  syncListeners.push(listener)
  return () => {
    const index = syncListeners.indexOf(listener)
    if (index > -1) syncListeners.splice(index, 1)
  }
}

function emitEvent(event: SyncEvent): void {
  syncListeners.forEach(listener => listener(event))
}

/**
 * Check if network is available
 */
async function isNetworkAvailable(): Promise<boolean> {
  const state = await NetInfo.fetch()
  return state.isConnected ?? false
}

/**
 * Calculate retry delay with exponential backoff
 */
function getRetryDelay(attempt: number): number {
  const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt)
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1)
  return Math.min(Math.round(delay + jitter), MAX_RETRY_DELAY_MS)
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('429')
    )
  }
  return true
}

/**
 * Sync a single table
 */
async function syncTable(
  tableName: string,
  getPending: () => Promise<any[]>,
  syncItem: (item: any) => Promise<void>,
  markSynced: (item: any) => Promise<void>,
  markFailed: (item: any) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  const pending = await getPending()
  if (pending.length === 0) {
    return { synced: 0, failed: 0 }
  }

  emitEvent({
    type: 'batch_started',
    table: tableName,
    total: pending.length,
    timestamp: Date.now(),
  })

  let synced = 0
  let failed = 0

  // Process in batches
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE)

    for (const item of batch) {
      try {
        await syncItem(item)
        await markSynced(item)
        synced++

        emitEvent({
          type: 'item_synced',
          table: tableName,
          synced: synced + failed,
          total: pending.length,
          timestamp: Date.now(),
        })
      } catch (error) {
        const syncAttempts = item.syncAttempts || 0
        if (isRetryableError(error) && syncAttempts < MAX_RETRY_ATTEMPTS) {
          // Reset for retry
          await item.update((u: any) => {
            u.syncAttempts = syncAttempts + 1
          })
          failed++
        } else {
          await markFailed(item)
          failed++

          emitEvent({
            type: 'item_failed',
            table: tableName,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          })
        }
      }
    }
  }

  emitEvent({
    type: 'batch_completed',
    table: tableName,
    synced,
    total: pending.length,
    timestamp: Date.now(),
  })

  return { synced, failed }
}

/**
 * Main sync function
 */
export async function performSync(): Promise<{
  success: boolean
  synced: number
  failed: number
  error?: string
}> {
  // Check network
  const hasNetwork = await isNetworkAvailable()
  if (!hasNetwork) {
    return {
      success: false,
      synced: 0,
      failed: 0,
      error: 'No network connection',
    }
  }

  // Check if already syncing
  if (Storage.getBool(STORAGE_KEYS.SYNC_IN_PROGRESS)) {
    return {
      success: false,
      synced: 0,
      failed: 0,
      error: 'Sync already in progress',
    }
  }

  Storage.setBool(STORAGE_KEYS.SYNC_IN_PROGRESS, true)

  emitEvent({
    type: 'sync_started',
    timestamp: Date.now(),
  })

  let totalSynced = 0
  let totalFailed = 0

  try {
    // Sync milk logs
    const milkLogsCollection = database.get<any>('milk_logs')
    const milkResult = await syncTable(
      'milk_logs',
      () => milkLogsCollection.query().fetch(),
      async (item) => {
        await fetch(`${API_BASE_URL}/farm/milk-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animalId: item.animalId,
            date: item.date,
            shift: item.shift,
            quantityLiters: item.quantityLiters,
            fatPercent: item.fatPercent,
            snfPercent: item.snfPercent,
          }),
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.apiSyncStatus = 'synced'
          u.syncAttempts = 0
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.apiSyncStatus = 'failed'
        })
      }
    )
    totalSynced += milkResult.synced
    totalFailed += milkResult.failed

    // Sync health events
    const healthEventsCollection = database.get<any>('health_events')
    const healthResult = await syncTable(
      'health_events',
      () => healthEventsCollection.query().fetch(),
      async (item) => {
        await fetch(`${API_BASE_URL}/farm/health-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animalId: item.animalId,
            date: item.date,
            type: item.type,
            description: item.description,
            cost: item.cost,
          }),
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.syncStatus = 'synced'
          u.syncAttempts = 0
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.syncStatus = 'failed'
        })
      }
    )
    totalSynced += healthResult.synced
    totalFailed += healthResult.failed

    // Sync breeding events
    const breedingEventsCollection = database.get<any>('breeding_events')
    const breedingResult = await syncTable(
      'breeding_events',
      () => breedingEventsCollection.query().fetch(),
      async (item) => {
        await fetch(`${API_BASE_URL}/farm/breeding-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animalId: item.animalId,
            eventType: item.eventType,
            eventDate: item.eventDate,
            note: item.note,
          }),
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.syncStatus = 'synced'
          u.syncAttempts = 0
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.syncStatus = 'failed'
        })
      }
    )
    totalSynced += breedingResult.synced
    totalFailed += breedingResult.failed

    // Sync vaccinations
    const vaccinationsCollection = database.get<any>('vaccinations')
    const vaccinationResult = await syncTable(
      'vaccinations',
      () => vaccinationsCollection.query().fetch(),
      async (item) => {
        await fetch(`${API_BASE_URL}/farm/vaccinations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animalId: item.animalId,
            vaccineName: item.vaccineName,
            vaccineType: item.vaccineType,
            scheduledDate: item.scheduledDate,
            administeredDate: item.administeredDate,
            cost: item.cost,
          }),
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.syncStatus = 'synced'
          u.syncAttempts = 0
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.syncStatus = 'failed'
        })
      }
    )
    totalSynced += vaccinationResult.synced
    totalFailed += vaccinationResult.failed

    // Sync income entries
    const incomeCollection = database.get<any>('income_entries')
    const incomeResult = await syncTable(
      'income_entries',
      () => incomeCollection.query().fetch(),
      async (item) => {
        await fetch(`${API_BASE_URL}/farm/income`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: item.date,
            buyer: item.buyer,
            quantitySold: item.quantitySold,
            ratePerLitre: item.ratePerLitre,
            totalReceived: item.totalReceived,
          }),
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.syncStatus = 'synced'
          u.syncAttempts = 0
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.syncStatus = 'failed'
        })
      }
    )
    totalSynced += incomeResult.synced
    totalFailed += incomeResult.failed

    // Sync expense entries
    const expenseCollection = database.get<any>('expense_entries')
    const expenseResult = await syncTable(
      'expense_entries',
      () => expenseCollection.query().fetch(),
      async (item) => {
        await fetch(`${API_BASE_URL}/farm/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: item.date,
            category: item.category,
            description: item.description,
            amount: item.amount,
          }),
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.syncStatus = 'synced'
          u.syncAttempts = 0
        })
      },
      async (item) => {
        await item.update((u: any) => {
          u.syncStatus = 'failed'
        })
      }
    )
    totalSynced += expenseResult.synced
    totalFailed += expenseResult.failed

    // Update last sync time
    Storage.set(STORAGE_KEYS.LAST_SYNC_TIME, Date.now())

    emitEvent({
      type: 'sync_completed',
      synced: totalSynced,
      timestamp: Date.now(),
    })

    return {
      success: true,
      synced: totalSynced,
      failed: totalFailed,
    }
  } catch (error) {
    emitEvent({
      type: 'sync_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    })

    return {
      success: false,
      synced: totalSynced,
      failed: totalFailed,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  } finally {
    Storage.setBool(STORAGE_KEYS.SYNC_IN_PROGRESS, false)
  }
}

/**
 * Initialize background fetch
 * Call this once at app startup
 */
export async function initBackgroundSync(): Promise<void> {
  if (Constants.appOwnership === 'expo') {
    console.log('[BackgroundSync] Running in Expo Go. Background fetch is disabled.')
    return
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BackgroundFetch = require('react-native-background-fetch')
    
    // Configure Background Fetch
    BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // minutes
        stopOnTerminate: false,
        startOnBoot: true,
      },
      async (taskId: string) => {
        console.log(`[BackgroundFetch] taskId: ${taskId}`)

        // Perform sync
        const result = await performSync()

        // Finish the task
        BackgroundFetch.finish(taskId)

        console.log(
          `[BackgroundSync] Completed: ${result.synced} synced, ${result.failed} failed`
        )
      },
      (error: string) => {
        console.log('[BackgroundFetch] Error:', error)
      }
    )

    // Start background fetch
    BackgroundFetch.start()

    console.log('[BackgroundSync] Initialized')
  } catch (e) {
    console.warn('BackgroundFetch not available in this environment (likely Expo Go). Background sync will not run.')
  }
}

/**
 * Manually trigger sync
 */
export async function triggerManualSync(): Promise<{
  success: boolean
  synced: number
  failed: number
  error?: string
}> {
  return performSync()
}

/**
 * Get last sync time
 */
export function getLastSyncTime(): number | undefined {
  return Storage.get<number>(STORAGE_KEYS.LAST_SYNC_TIME)
}

/**
 * Get sync status for UI
 */
export function getSyncStatus(): {
  isSyncing: boolean
  lastSyncTime?: number
  pendingCount: number
} {
  return {
    isSyncing: Storage.getBool(STORAGE_KEYS.SYNC_IN_PROGRESS),
    lastSyncTime: Storage.get(STORAGE_KEYS.LAST_SYNC_TIME),
    pendingCount: 0, // Would need to query database for actual count
  }
}
