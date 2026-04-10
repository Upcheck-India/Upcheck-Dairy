import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'
import type { ApiSyncStatus } from './MilkLog'

export type ExpenseCategory = 'feed' | 'medicine' | 'labor' | 'equipment' | 'other'

export default class IncomeEntry extends Model {
  static table = 'income_entries'

  @field('date') date!: number
  @field('buyer') buyer!: string
  @field('quantity_sold') quantitySold!: number
  @field('rate_per_litre') ratePerLitre!: number
  @field('total_expected') totalExpected!: number
  @field('total_received') totalReceived!: number
  @field('fat_percent') fatPercent!: number
  @field('snf_percent') snfPercent!: number
  @field('notes') notes!: string
  @field('api_sync_status') apiSyncStatus!: ApiSyncStatus
  @field('created_at') createdAt!: number
}
