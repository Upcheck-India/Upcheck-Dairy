import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'

export default class RateCard extends Model {
  static table = 'rate_cards'

  @field('cooperative_code') cooperativeCode!: string
  @field('state_code') stateCode!: string
  @field('base_rate') baseRate!: number
  @field('fat_premium') fatPremium!: number
  @field('snf_premium') snfPremium!: number
  @field('transport_deduction') transportDeduction!: number
  @field('gst_percent') gstPercent!: number
  @field('is_active') isActive!: boolean
  @field('effective_from') effectiveFrom!: number
  @field('updated_at') updatedAt!: number

  /**
   * Calculate payout for given milk parameters using NDDB formula
   */
  calculatePayout(quantityLiters: number, fatPercent: number, snfPercent: number, deductions: number = 0): number {
    const rate = this.baseRate + (fatPercent * this.fatPremium) + (snfPercent * this.snfPremium)
    const gross = quantityLiters * rate
    const transport = this.transportDeduction || 0
    const gst = this.gstPercent ? (gross * this.gstPercent) / 100 : 0
    const net = gross - deductions - transport - gst
    return Math.round(net * 100) / 100
  }
}
