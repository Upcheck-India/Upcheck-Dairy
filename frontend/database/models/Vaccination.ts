import { Model } from '@nozbe/watermelondb'
import { field, relation } from '@nozbe/watermelondb/decorators'
import type Animal from './Animal'
import type { ApiSyncStatus } from './MilkLog'

export type VaccineType = 'FMD' | 'HS' | 'BQ' | 'Brucellosis' | 'Theileriosis' | 'Anthrax' | 'PPR' | 'Other'

export default class Vaccination extends Model {
  static table = 'vaccinations'

  @field('animal_id') animalId!: string
  @field('vaccine_name') vaccineName!: string
  @field('vaccine_type') vaccineType!: VaccineType
  @field('scheduled_date') scheduledDate!: number
  @field('administered_date') administeredDate!: number
  @field('batch_no') batchNo!: string
  @field('administered_by') administeredBy!: string
  @field('cost') cost!: number
  @field('next_due_date') nextDueDate!: number
  @field('note') note!: string
  @field('api_sync_status') apiSyncStatus!: ApiSyncStatus
  @field('created_at') createdAt!: number

  @relation('animals', 'animal_id') animal!: Animal

  get isDue(): boolean {
    return !this.administeredDate && this.scheduledDate <= Date.now()
  }

  get isOverdue(): boolean {
    return !this.administeredDate && this.scheduledDate < Date.now() - 7 * 24 * 60 * 60 * 1000
  }
}
