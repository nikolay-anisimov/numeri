import { round2 } from './fx'

// Minimal 130 calculator (YTD-style inputs). This is NOT official, just helper for MVP.
export interface Calc130Input {
  grossIncomeYtd: number
  deductibleExpensesYtd: number
  prevTrNegativesYtd?: number
  minoracionArt110?: number
  housingLoanDeduction?: number
}

export function calc130Ytd(input: Calc130Input) {
  const c01 = round2(input.grossIncomeYtd)
  const c02 = round2(input.deductibleExpensesYtd)
  const c03 = round2(c01 - c02)
  const c13 = round2(input.minoracionArt110 ?? 0)
  // Very simplified: base * 0.2 then apply adjustments
  let provisional = round2(Math.max(0, c03) * 0.2)
  provisional = round2(provisional - Math.max(0, input.prevTrNegativesYtd ?? 0))
  provisional = round2(provisional - Math.max(0, input.housingLoanDeduction ?? 0))
  const c17 = Math.max(0, round2(provisional))
  return { c01, c02, c03, c13, c17 }
}

// 349 line and aggregation
export interface InvoiceOutFor349 {
  date: string // YYYY-MM-DD
  partnerVat: string | null
  partnerName?: string | null
  base: number // in original currency base
  currency: string
  fxToEUR: number // EUR per 1 unit of currency
  euOperation: boolean
  clave?: 'S' | 'E' | 'A' | 'T' | 'I'
}

export interface Modelo349Line {
  period: string // e.g., '2025Q3' or '2025-07'
  partnerVat: string
  partnerName?: string
  clave: 'S' | 'E' | 'A' | 'T' | 'I'
  base_eur: number
}

export function build349Lines(invoices: InvoiceOutFor349[], opts: { periodLabel: string }) {
  const map = new Map<string, { partnerVat: string; partnerName?: string; clave: Modelo349Line['clave']; base_eur: number }>()
  for (const inv of invoices) {
    if (!inv.euOperation) continue
    const partnerVat = inv.partnerVat?.trim()
    if (!partnerVat) continue
    const clave = inv.clave ?? 'S'
    const eurBase = round2(inv.currency === 'EUR' ? inv.base : inv.base * inv.fxToEUR)
    const key = `${partnerVat}|${clave}`
    const cur = map.get(key)
    if (cur) {
      cur.base_eur = round2(cur.base_eur + eurBase)
    } else {
      map.set(key, { partnerVat, partnerName: inv.partnerName ?? undefined, clave, base_eur: eurBase })
    }
  }
  return Array.from(map.values()).map((v) => ({ period: opts.periodLabel, ...v }))
}

