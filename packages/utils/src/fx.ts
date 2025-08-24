// Utilities for ECB FX rates and conversion by value date
export type Currency = 'EUR' | 'USD' | 'PLN' | 'BYN' | string

export interface FxRate {
  date: string // ISO date YYYY-MM-DD
  base: 'EUR'
  quote: Currency
  rate: number // quote per EUR
}

export function convertToEur(amount: number, currency: Currency, rateMap: Record<string, number>): number {
  if (currency === 'EUR') return amount
  const rate = rateMap[currency]
  if (!rate || rate <= 0) throw new Error(`Missing or invalid rate for ${currency}`)
  // amount in quote -> EUR = amount / rate (quote per EUR)
  return round2(amount / rate)
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

