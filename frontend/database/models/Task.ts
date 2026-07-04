import { Model } from '@nozbe/watermelondb'
import { field, relation } from '@nozbe/watermelondb/decorators'
import type Animal from './Animal'
import type { ApiSyncStatus } from './MilkLog'

export type TaskType = 'milk' | 'feed' | 'health' | 'clean' | 'other' | 'breeding' | 'vaccination'
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical'
export type TaskSession = 'morning' | 'evening' | 'anytime'

export default class Task extends Model {
  static table = 'tasks'

  @field('animal_id') animalId!: string
  @field('title') title!: string
  @field('time') time!: string
  @field('session') session!: TaskSession
  @field('completed') completed!: boolean
  @field('date') date!: number
  @field('type') type!: TaskType
  @field('priority') priority!: TaskPriority
  @field('api_sync_status') apiSyncStatus!: ApiSyncStatus
  @field('created_at') createdAt!: number

  @relation('animals', 'animal_id') animal!: Animal

  async toggleComplete(): Promise<void> {
    await this.update(u => {
      u.completed = !u.completed
    })
  }
}
