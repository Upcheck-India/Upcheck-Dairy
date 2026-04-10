import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'
import type { ApiSyncStatus } from './MilkLog'

export type InventoryCategory = 'feed' | 'medicine' | 'supplement' | 'equipment' | 'other'

export default class InventoryItem extends Model {
  static table = 'inventory_items'

  @field('name') name!: string
  @field('category') category!: InventoryCategory
  @field('quantity') quantity!: number
  @field('unit') unit!: string
  @field('min_quantity') minQuantity!: number
  @field('price_per_unit') pricePerUnit!: number
  @field('last_updated') lastUpdated!: number
  @field('api_sync_status') apiSyncStatus!: ApiSyncStatus
  @field('created_at') createdAt!: number

  get isLowStock(): boolean {
    return this.quantity <= this.minQuantity
  }

  async adjustQuantity(delta: number): Promise<void> {
    await this.update(u => {
      u.quantity = Math.max(0, u.quantity + delta)
      u.lastUpdated = Date.now()
    })
  }
}
