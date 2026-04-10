import { Model } from '@nozbe/watermelondb'
import { field, relation } from '@nozbe/watermelondb/decorators'
import type Animal from './Animal'
import type { ApiSyncStatus } from './MilkLog'

export type BreedingEventType = 'heat' | 'insemination' | 'pregnancy_confirmed' | 'dry_off' | 'calving' | 'abort'

export default class BreedingEvent extends Model {
  static table = 'breeding_events'

  @field('animal_id') animalId!: string
  @field('event_type') eventType!: BreedingEventType
  @field('event_date') eventDate!: number
  @field('note') note!: string
  @field('bull_name') bullName!: string
  @field('expected_calving_date') expectedCalvingDate!: number
  @field('calving_gender') calvingGender!: string
  @field('api_sync_status') apiSyncStatus!: ApiSyncStatus
  @field('created_at') createdAt!: number

  @relation('animals', 'animal_id') animal!: Animal
}
