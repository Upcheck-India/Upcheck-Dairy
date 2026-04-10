/**
 * NDDB (National Dairy Development Board) Pricing Engine
 *
 * Calculates milk payout based on:
 * - Base rate per liter
 * - Fat percentage premium
 * - SNF (Solid Not Fat) percentage premium
 * - Transport deductions
 * - GST (if applicable)
 *
 * Supports major South Indian cooperatives:
 * - KMF (Karnataka Milk Federation)
 * - AAVIN (Tamil Nadu)
 * - MILMA (Kerala)
 * - TS Dairy (Telangana)
 * - AP Dairy (Andhra Pradesh)
 */

export interface RateCard {
  cooperativeCode: string
  stateCode: string
  baseRate: number        // Rs per liter base price
  fatPremium: number      // Rs per % fat
  snfPremium: number      // Rs per % SNF
  transportDeduction?: number
  gstPercent?: number
}

/**
 * Default rate cards for South Indian states
 * Update these periodically or fetch from backend
 */
export const DEFAULT_RATE_CARDS: Record<string, RateCard> = {
  KMF: {
    cooperativeCode: 'KMF',
    stateCode: 'KA',
    baseRate: 32,
    fatPremium: 0.85,
    snfPremium: 1.20,
    transportDeduction: 0,
    gstPercent: 0,
  },
  AAVIN: {
    cooperativeCode: 'AAVIN',
    stateCode: 'TN',
    baseRate: 30,
    fatPremium: 0.80,
    snfPremium: 1.15,
    transportDeduction: 0,
    gstPercent: 0,
  },
  MILMA: {
    cooperativeCode: 'MILMA',
    stateCode: 'KL',
    baseRate: 31,
    fatPremium: 0.82,
    snfPremium: 1.18,
    transportDeduction: 0,
    gstPercent: 0,
  },
  TS_DAIRY: {
    cooperativeCode: 'TS_DAIRY',
    stateCode: 'TS',
    baseRate: 29,
    fatPremium: 0.78,
    snfPremium: 1.10,
    transportDeduction: 0,
    gstPercent: 0,
  },
  AP_DAIRY: {
    cooperativeCode: 'AP_DAIRY',
    stateCode: 'AP',
    baseRate: 29,
    fatPremium: 0.78,
    snfPremium: 1.10,
    transportDeduction: 0,
    gstPercent: 0,
  },
}

export interface PricingResult {
  quantityLiters: number
  fatPercent: number
  snfPercent: number
  baseRate: number
  fatComponent: number
  snfComponent: number
  grossRate: number
  grossAmount: number
  transportDeduction: number
  gstAmount: number
  otherDeductions: number
  netRate: number
  netAmount: number
  cooperativeCode: string
}

/**
 * Calculate milk payout using NDDB formula
 *
 * Formula:
 *   Rate = Base Rate + (Fat% × Fat Premium) + (SNF% × SNF Premium)
 *   Gross = Quantity × Rate
 *   Net = Gross - Transport - GST - Other Deductions
 */
export function calculatePayout(
  quantityLiters: number,
  fatPercent: number,
  snfPercent: number,
  rateCard: RateCard,
  otherDeductions: number = 0
): PricingResult {
  const {
    baseRate,
    fatPremium,
    snfPremium,
    transportDeduction = 0,
    gstPercent = 0,
    cooperativeCode,
  } = rateCard

  // Calculate components
  const fatComponent = fatPercent * fatPremium
  const snfComponent = snfPercent * snfPremium
  const grossRate = baseRate + fatComponent + snfComponent
  const grossAmount = quantityLiters * grossRate

  // Calculate deductions
  const gstAmount = grossAmount * (gstPercent / 100)
  const totalDeductions = transportDeduction + gstAmount + otherDeductions
  const netAmount = grossAmount - totalDeductions
  const netRate = netAmount / quantityLiters

  return {
    quantityLiters,
    fatPercent,
    snfPercent,
    baseRate,
    fatComponent: Math.round(fatComponent * 100) / 100,
    snfComponent: Math.round(snfComponent * 100) / 100,
    grossRate: Math.round(grossRate * 100) / 100,
    grossAmount: Math.round(grossAmount * 100) / 100,
    transportDeduction,
    gstAmount: Math.round(gstAmount * 100) / 100,
    otherDeductions,
    netRate: Math.round(netRate * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    cooperativeCode,
  }
}

/**
 * Get rate card by cooperative code
 */
export function getRateCard(cooperativeCode: string): RateCard | null {
  return DEFAULT_RATE_CARDS[cooperativeCode] || null
}

/**
 * Get rate card by state code
 */
export function getRateCardByState(stateCode: string): RateCard | null {
  const cards = Object.values(DEFAULT_RATE_CARDS)
  return cards.find(card => card.stateCode === stateCode) || null
}

/**
 * Calculate expected payout based on typical milk composition
 * Useful for quick estimates
 */
export function estimatePayout(
  quantityLiters: number,
  cooperativeCode: string
): PricingResult {
  const rateCard = getRateCard(cooperativeCode)
  if (!rateCard) {
    throw new Error(`Unknown cooperative: ${cooperativeCode}`)
  }

  // Typical values for crossbred cow milk
  const typicalFat = 4.0
  const typicalSnf = 8.5

  return calculatePayout(quantityLiters, typicalFat, typicalSnf, rateCard)
}

/**
 * Compare payouts across cooperatives
 * Returns sorted list by net amount (highest first)
 */
export function compareCooperatives(
  quantityLiters: number,
  fatPercent: number,
  snfPercent: number
): { cooperative: string; netAmount: number }[] {
  return Object.entries(DEFAULT_RATE_CARDS)
    .map(([code, card]) => ({
      cooperative: code,
      netAmount: calculatePayout(quantityLiters, fatPercent, snfPercent, card).netAmount,
    }))
    .sort((a, b) => b.netAmount - a.netAmount)
}

/**
 * Validate milk parameters
 */
export function validateMilkParams(
  fatPercent: number,
  snfPercent: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (fatPercent < 2 || fatPercent > 12) {
    errors.push(`Fat ${fatPercent}% is outside valid range (2-12%)`)
  }

  if (snfPercent < 7 || snfPercent > 11) {
    errors.push(`SNF ${snfPercent}% is outside valid range (7-11%)`)
  }

  // Typical fat:SNF ratio is around 1:2.2
  const expectedSnf = fatPercent * 2.2
  if (Math.abs(snfPercent - expectedSnf) > 1) {
    errors.push(`Unusual fat:SNF ratio. Expected SNF ~${expectedSnf.toFixed(1)}% for ${fatPercent}% fat`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Format currency in Indian style
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Generate payout breakdown message for farmer
 */
export function getPayoutBreakdown(
  result: PricingResult,
  language: 'ta' | 'te' | 'kn' | 'ml' | 'hi' | 'en' = 'en'
): string {
  const labels: Record<string, Record<string, string>> = {
    en: {
      quantity: 'Quantity',
      fat: 'Fat',
      snf: 'SNF',
      baseRate: 'Base Rate',
      grossAmount: 'Gross Amount',
      deductions: 'Deductions',
      netAmount: 'Net Payment',
    },
    ta: {
      quantity: 'அளவு',
      fat: 'கொழுப்பு',
      snf: 'திடப்பொருள்',
      baseRate: 'அடிப்படை வீதம்',
      grossAmount: 'மொத்தத் தொகை',
      deductions: 'கிடப்புகள்',
      netAmount: 'நிகரத் தொகை',
    },
  }

  const t = labels[language] || labels.en

  return `${t.quantity}: ${result.quantityLiters}L | ${t.fat}: ${result.fatPercent}% | ${t.snf}: ${result.snfPercent}%
${t.baseRate}: ₹${result.grossRate}/L
${t.grossAmount}: ${formatCurrency(result.grossAmount)}
${t.deductions}: ${formatCurrency(result.transportDeduction + result.gstAmount + result.otherDeductions)}
${t.netAmount}: ${formatCurrency(result.netAmount)}`
}
