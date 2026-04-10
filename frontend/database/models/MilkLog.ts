import { Model } from '@nozbe/watermelondb'
import { field, relation } from '@nozbe/watermelondb/decorators'
import type Animal from './Animal'

export type MilkingShift = 'morning' | 'evening'
export type ApiSyncStatus = 'pending' | 'synced' | 'failed'

export default class MilkLog extends Model {
  static table = 'milk_logs'

  @field('animal_id') animalId!: string
  @field('date') date!: number
  @field('shift') shift!: MilkingShift
  @field('quantity_liters') quantityLiters!: number
  @field('fat_percent') fatPercent!: number
  @field('snf_percent') snfPercent!: number
  @field('temperature_c') temperatureC!: number
  @field('notes') notes!: string
  @field('api_sync_status') apiSyncStatus!: ApiSyncStatus
  @field('sync_attempts') syncAttempts!: number
  @field('created_at') createdAt!: number

  @relation('animals', 'animal_id') animal!: Animal

  /**
   * Check if this log is pending sync
   */
  get isPendingSync(): boolean {
    return this.apiSyncStatus === 'pending'
  }

  /**
   * Mark as synced
   */
  async markAsSynced(): Promise<void> {
    await this.update(u => {
      u.apiSyncStatus = 'synced'
      u.syncAttempts = 0
    })
  }

  /**
   * Mark as failed with retry count
   */
  async markAsFailed(): Promise<void> {
    await this.update(u => {
      u.apiSyncStatus = 'failed'
      u.syncAttempts = u.syncAttempts + 1
    })
  }

  /**
   * Reset for retry
   */
  async resetForRetry(): Promise<void> {
    await this.update(u => {
      u.apiSyncStatus = 'pending'
    })
  }
}
