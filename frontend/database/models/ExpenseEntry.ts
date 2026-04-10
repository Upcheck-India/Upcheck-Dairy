import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'
import type { ApiSyncStatus } from './MilkLog'

export type ExpenseCategory = 'feed' | 'medicine' | 'labor' | 'equipment' | 'other'

export default class ExpenseEntry extends Model {
  static table = 'expense_entries'

  @field('date') date!: number
  @field('category') category!: ExpenseCategory
  @field('description') description!: string
  @field('amount') amount!: number
  @field('api_sync_status') apiSyncStatus!: ApiSyncStatus
  @field('created_at') createdAt!: number
}
