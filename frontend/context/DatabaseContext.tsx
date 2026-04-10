/**
 * Database Context Provider
 *
 * Provides WatermelonDB database instance and common queries
 * to the React component tree.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { Q } from '@nozbe/watermelondb'
import database, { Storage, STORAGE_KEYS } from '../database'
import type Farmer from '../database/models/Farmer'
import type Animal from '../database/models/Animal'
import type MilkLog from '../database/models/MilkLog'
import type { ApiSyncStatus } from '../database/models/MilkLog'

interface DatabaseContextType {
  // Database instance
  db: typeof database

  // Farmer
  currentFarmer: Farmer | null
  updateFarmer: (updates: Partial<Farmer>) => Promise<void>

  // Animals
  animals: Animal[]
  addAnimal: (animal: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateAnimal: (id: string, updates: Partial<Animal>) => Promise<void>
  deleteAnimal: (id: string) => Promise<void>
  getAnimal: (id: string) => Promise<Animal | undefined>

  // Milk logs
  addMilkLog: (log: Omit<MilkLog, 'id' | 'createdAt' | 'apiSyncStatus' | 'syncAttempts'>) => Promise<void>
  getAnimalMilkLogs: (animalId: string) => Promise<MilkLog[]>
  getPendingSyncLogs: () => Promise<MilkLog[]>

  // Sync
  syncStatus: 'synced' | 'pending' | 'offline'
  pendingSyncCount: number

  // Loading state
  isLoaded: boolean
}

const DatabaseContext = createContext<DatabaseContextType | null>(null)

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [currentFarmer, setCurrentFarmer] = useState<Farmer | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('synced')
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  // Load current farmer on mount
  useEffect(() => {
    const loadFarmer = async () => {
      try {
        const farmers = database.get<Farmer>('farmers')
        const allFarmers = await farmers.query().fetch()
        if (allFarmers.length > 0) {
          setCurrentFarmer(allFarmers[0])
        }
      } catch (error) {
        console.error('[DatabaseProvider] Error loading farmer:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    loadFarmer()
  }, [])

  // Watch for pending sync items
  useEffect(() => {
    const milkLogs = database.get<MilkLog>('milk_logs')
    const subscription = milkLogs
      .query(Q.where('api_sync_status', 'pending'))
      .observeCount()
      .subscribe(count => {
        setPendingSyncCount(count)
        setSyncStatus(count > 0 ? 'pending' : 'synced')
      })

    return () => subscription.unsubscribe()
  }, [])

  const updateFarmer = async (updates: Partial<Farmer>) => {
    if (!currentFarmer) return

    await database.write(async () => {
      await currentFarmer.update((f: any) => {
        Object.entries(updates).forEach(([key, value]) => {
          f[key] = value
        })
        f.updatedAt = Date.now()
      })
    })
  }

  const addAnimal = async (animalData: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const animals = database.get<Animal>('animals')
    await database.write(async () => {
      await animals.create((a: any) => {
        Object.assign(a, animalData)
        a.createdAt = Date.now()
        a.updatedAt = Date.now()
      })
    })
  }

  const updateAnimal = async (id: string, updates: Partial<Animal>) => {
    const animals = database.get<Animal>('animals')
    const animal = await animals.find(id)
    if (!animal) return

    await database.write(async () => {
      await animal.update((a: any) => {
        Object.entries(updates).forEach(([key, value]) => {
          a[key] = value
        })
        a.updatedAt = Date.now()
      })
    })
  }

  const deleteAnimal = async (id: string) => {
    const animals = database.get<Animal>('animals')
    const animal = await animals.find(id)
    if (!animal) return

    await database.write(async () => {
      await animal.destroyPermanently()
    })
  }

  const getAnimal = (id: string) => {
    const animals = database.get<Animal>('animals')
    return animals.find(id)
  }

  const addMilkLog = async (logData: Omit<MilkLog, 'id' | 'createdAt' | 'apiSyncStatus' | 'syncAttempts'>) => {
    const milkLogs = database.get<MilkLog>('milk_logs')
    await database.write(async () => {
      await milkLogs.create((l: any) => {
        Object.assign(l, logData)
        l.createdAt = Date.now()
        l.apiSyncStatus = 'pending'
        l.syncAttempts = 0
      })
    })
  }

  const getAnimalMilkLogs = (animalId: string) => {
    const milkLogs = database.get<MilkLog>('milk_logs')
    return milkLogs.query(
      Q.where('animal_id', animalId),
      Q.sortBy('date', Q.desc)
    ).fetch()
  }

  const getPendingSyncLogs = () => {
    const milkLogs = database.get<MilkLog>('milk_logs')
    return milkLogs.query(Q.where('api_sync_status', 'pending')).fetch()
  }

  return (
    <DatabaseContext.Provider
      value={{
        db: database,
        currentFarmer,
        updateFarmer,
        animals: [], // Use useObservable for actual data
        addAnimal,
        updateAnimal,
        deleteAnimal,
        getAnimal,
        addMilkLog,
        getAnimalMilkLogs,
        getPendingSyncLogs,
        syncStatus,
        pendingSyncCount,
        isLoaded,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider')
  }
  return context
}

/**
 * Hook to observe animals - returns synchronous array
 * Note: For real-time updates, use watermelondb's observe() directly
 */
export function useAnimals(farmerId?: string): Animal[] {
  const [animals, setAnimals] = useState<Animal[]>([])
  const db = useDatabase().db

  useEffect(() => {
    const animals = db.get<Animal>('animals')
    const query = farmerId
      ? animals.query(Q.where('farmer_id', farmerId))
      : animals.query()

    query.fetch().then(setAnimals)

    // Subscribe to changes
    const subscription = query.observe().subscribe({
      next: (result) => setAnimals(result),
      error: (err) => console.error('[useAnimals] Error:', err),
    })

    return () => subscription.unsubscribe()
  }, [db, farmerId])

  return animals
}

/**
 * Hook to observe milk logs for an animal
 */
export function useAnimalMilkLogs(animalId: string): MilkLog[] {
  const [logs, setLogs] = useState<MilkLog[]>([])
  const db = useDatabase().db

  useEffect(() => {
    const milkLogs = db.get<MilkLog>('milk_logs')
    const query = milkLogs.query(
      Q.where('animal_id', animalId),
      Q.sortBy('date', Q.desc)
    )

    query.fetch().then(setLogs)

    const subscription = query.observe().subscribe({
      next: (result) => setLogs(result),
      error: (err) => console.error('[useAnimalMilkLogs] Error:', err),
    })

    return () => subscription.unsubscribe()
  }, [db, animalId])

  return logs
}
