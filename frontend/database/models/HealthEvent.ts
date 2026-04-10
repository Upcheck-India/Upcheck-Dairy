import { Model } from '@nozbe/watermelondb'
import { field, relation } from '@nozbe/watermelondb/decorators'
import type Animal from './Animal'
import type { ApiSyncStatus } from './MilkLog'

export type HealthEventType = 'vaccination' | 'treatment' | 'observation' | 'diagnosis'

export default class HealthEvent extends Model {
  static table = 'health_events'

  @field('animal_id') animalId!: string
  @field('date') date!: number
  @field('type') type!: HealthEventType
  @field('description') description!: string
  @field('veterinarian_name') veterinarianName!: string
  @field('cost') cost!: number
  @field('follow_up_date') followUpDate!: number
  @field('api_sync_status') apiSyncStatus!: ApiSyncStatus
  @field('created_at') createdAt!: number

  @relation('animals', 'animal_id') animal!: Animal
}
