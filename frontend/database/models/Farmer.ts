import { Model } from '@nozbe/watermelondb'
import { field, relation, children, lazy } from '@nozbe/watermelondb/decorators'
import type Animal from './Animal'
import type MilkLog from './MilkLog'

export default class Farmer extends Model {
  static table = 'farmers'

  @field('phone') phone!: string
  @field('name') name!: string
  @field('farm_name') farmName!: string
  @field('village') village!: string
  @field('district') district!: string
  @field('avatar_initials') avatarInitials!: string
  @field('language') language!: string
  @field('is_profile_complete') isProfileComplete!: boolean
  @field('created_at') createdAt!: number
  @field('updated_at') updatedAt!: number

  @children('animals') animals!: Animal[]
  @children('milk_logs') milkLogs!: MilkLog[]
}
