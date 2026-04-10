import { Model } from '@nozbe/watermelondb'
import { field, children, relation } from '@nozbe/watermelondb/decorators'
import type Farmer from './Farmer'
import type MilkLog from './MilkLog'

export type AnimalType = 'cow' | 'buffalo' | 'calf'
export type HealthStatus = 'healthy' | 'attention' | 'critical'

export default class Animal extends Model {
  static table = 'animals'

  @field('farmer_id') farmerId!: string
  @field('name') name!: string
  @field('type') type!: AnimalType
  @field('breed') breed!: string
  @field('tag_number') tagNumber!: string
  @field('photo_uri') photoUri!: string
  @field('health_status') healthStatus!: HealthStatus
  @field('notes') notes!: string
  @field('birth_date') birthDate!: number
  @field('lactation_number') lactationNumber!: number
  @field('last_calving_date') lastCalvingDate!: number
  @field('expected_calving_date') expectedCalvingDate!: number
  @field('is_pregnant') isPregnant!: boolean
  @field('body_condition_score') bodyConditionScore!: number
  @field('weight_kg') weightKg!: number
  @field('last_milk_entry_date') lastMilkEntryDate!: number
  @field('last_milk_quantity') lastMilkQuantity!: number
  @field('created_at') createdAt!: number
  @field('updated_at') updatedAt!: number

  @relation('farmers', 'farmer_id') farmer!: Farmer
  @children('milk_logs') milkLogs!: MilkLog[]
  @children('health_events') healthEvents!: any[]
  @children('breeding_events') breedingEvents!: any[]
  @children('vaccinations') vaccinations!: any[]

  /**
   * Calculate 3-day rolling average milk yield
   */
  getRollingAverage(allMilkLogs: MilkLog[]): number {
    const today = new Date()
    const prev3Days = Array.from({ length: 3 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (i + 1))
      return d.toISOString().split('T')[0]
    })

    const totals = prev3Days.map(date =>
      allMilkLogs
        .filter(log => log.animalId === this.id && new Date(log.date).toISOString().split('T')[0] === date)
        .reduce((sum, log) => sum + log.quantityLiters, 0)
    ).filter(v => v > 0)

    if (totals.length === 0) return 0
    return totals.reduce((a, b) => a + b, 0) / totals.length
  }

  /**
   * Check if milk drop is significant (15% = attention, 30% = critical)
   */
  getMilkAnomalyStatus(todayTotal: number, avgTotal: number): { severity: HealthStatus; dropPercent: number } | null {
    if (todayTotal === 0 || avgTotal === 0) return null
    if (this.type === 'calf') return null

    const dropPercent = ((avgTotal - todayTotal) / avgTotal) * 100
    if (dropPercent >= 30) return { severity: 'critical', dropPercent }
    if (dropPercent >= 15) return { severity: 'attention', dropPercent }
    return null
  }
}
