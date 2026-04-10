# WatermelonDB Migration Summary

## Overview
Migrated ThulirFarm from AsyncStorage-based storage to WatermelonDB with MMKV for fast key-value storage.

## Architecture Changes

### New Files Created
- `database/schema.ts` - WatermelonDB schema with 11 tables
- `database/index.ts` - Database initialization and MMKV storage
- `database/models/` - 11 model files with decorators
- `services/SyncService.ts` - Background sync with exponential backoff
- `utils/pricing.ts` - NDDB pricing engine
- `context/DatabaseContext.tsx` - React context for database access
- `database/models/types.d.ts` - TypeScript type declarations for decorators

### Database Tables
1. `farmers` - User profiles
2. `animals` - Herd management with pregnancy tracking
3. `milk_logs` - Production logs with sync tracking
4. `health_events` - Veterinary records
5. `breeding_events` - Heat, insemination, calving
6. `vaccinations` - Schedule with recurrence
7. `income_entries` - Milk sales
8. `expense_entries` - Farm expenses
9. `tasks` - Daily task management
10. `inventory_items` - Feed, medicine stock
11. `rate_cards` - Cooperative pricing

### Key Changes

#### Sync Status Field Renamed
To avoid conflict with WatermelonDB's built-in `syncStatus` property, all custom sync status fields were renamed:
- Old: `sync_status` column, `syncStatus` property, `DbSyncStatus` type
- New: `api_sync_status` column, `apiSyncStatus` property, `ApiSyncStatus` type

This prevents TypeScript type conflicts between WatermelonDB's native `SyncStatus` type (`'synced' | 'unsynced'`) and our custom API sync tracking type (`'pending' | 'synced' | 'failed'`).

#### MMKV Storage
MMKV is imported dynamically to handle environments where it's not available (web, tests):
```typescript
try {
  const { MMKV } = require('react-native-mmkv')
  storageInstance = new MMKV()
} catch (e) {
  // Fallback storage for non-native environments
}
```

#### Database Context
The context provides:
- `useDatabase()` - Access database instance and current farmer
- `useAnimals(farmerId?)` - Observe animals with automatic subscription management
- `useAnimalMilkLogs(animalId)` - Observe milk logs for an animal

## Usage Examples

### Adding an Animal
```typescript
const { addAnimal } = useDatabase()
await addAnimal({
  farmerId: 'farmer-1',
  name: 'Lakshmi',
  type: 'cow',
  breed: 'Sahiwal',
  tagNumber: 'TAG-001',
  healthStatus: 'healthy',
  // ... other fields
})
```

### Adding Milk Log
```typescript
const { addMilkLog } = useDatabase()
await addMilkLog({
  animalId: 'animal-1',
  date: Date.now(),
  shift: 'morning',
  quantityLiters: 8.5,
  fatPercent: 4.2,
  snfPercent: 8.5,
})
```

### NDDB Pricing
```typescript
import { calculatePayout, getRateCard } from './utils/pricing'

const kmfRate = getRateCard('KMF')
const result = calculatePayout(5, 4.0, 8.5, kmfRate, 0)
// Returns: { grossAmount, netAmount, fatComponent, snfComponent, ... }
```

## Background Sync
SyncService automatically syncs pending records to the API:
- Automatic retry with exponential backoff (2s → 128s)
- Network-aware (only syncs when connected)
- Progress events for UI updates
- Max 5 retry attempts per item

```typescript
import { initBackgroundSync, triggerManualSync } from './services/SyncService'

// Initialize at app startup
await initBackgroundSync()

// Manual sync trigger
const result = await triggerManualSync()
```

## TypeScript Configuration
Added type declarations for WatermelonDB decorators in `database/models/types.d.ts`:
```typescript
declare module '@nozbe/watermelondb/decorators' {
  export function field(columnName: string): any
  export function relation(table: string, key: string): any
  export function children(table: string): any
  export function lazy(_getter: () => any): any
}
```

## Migration Path from AsyncStorage
1. Export data from AsyncStorage: `JSON.parse(await AsyncStorage.getItem(KEY))`
2. Import to WatermelonDB: `database.write(() => collection.create(data))`
3. Update components to use `useDatabase()` hooks instead of direct AsyncStorage calls

## Typecheck Status
All TypeScript errors resolved. Run `pnpm run typecheck` to verify.
