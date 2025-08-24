import { round2 } from './fx'

export type EntryType = 'INGRESO' | 'GASTO'

export interface Tax303Entry {
  type: EntryType
  base: number
  vatRate: number // 0, 4, 10, 21
  vatAmount: number
  // Flags (optional; MVP keeps false by default)
  aib?: boolean // adquisiciones intracomunitarias devengadas
  isp?: boolean // inversión del sujeto pasivo devengada
  asset?: boolean // bienes de inversión (deducible)
}

export interface Calc303Result {
  devengadoByType: Record<'0' | '4' | '10' | '21', { base: number; cuota: number }>
  aib: { base: number; cuota: number }
  isp: { base: number; cuota: number }
  deducibleCorriente: { base: number; cuota: number }
  deducibleBienesInversion: { base: number; cuota: number }
  resultado71: number
}

export function calc303(entries: Tax303Entry[]): Calc303Result {
  const dev: Calc303Result['devengadoByType'] = { '0': { base: 0, cuota: 0 }, '4': { base: 0, cuota: 0 }, '10': { base: 0, cuota: 0 }, '21': { base: 0, cuota: 0 } }
  const aib = { base: 0, cuota: 0 }
  const isp = { base: 0, cuota: 0 }
  const dedCorr = { base: 0, cuota: 0 }
  const dedBI = { base: 0, cuota: 0 }

  for (const e of entries) {
    if (e.type === 'INGRESO') {
      const key = String(e.vatRate) as '0' | '4' | '10' | '21'
      if (e.aib) {
        aib.base = round2(aib.base + e.base)
        aib.cuota = round2(aib.cuota + e.vatAmount)
      } else if (e.isp) {
        isp.base = round2(isp.base + e.base)
        isp.cuota = round2(isp.cuota + e.vatAmount)
      } else if (key in dev) {
        dev[key].base = round2(dev[key].base + e.base)
        dev[key].cuota = round2(dev[key].cuota + e.vatAmount)
      }
    } else {
      if (e.asset) {
        dedBI.base = round2(dedBI.base + e.base)
        dedBI.cuota = round2(dedBI.cuota + e.vatAmount)
      } else {
        dedCorr.base = round2(dedCorr.base + e.base)
        dedCorr.cuota = round2(dedCorr.cuota + e.vatAmount)
      }
    }
  }

  const devengadaTotal = round2(dev['0'].cuota + dev['4'].cuota + dev['10'].cuota + dev['21'].cuota + aib.cuota + isp.cuota)
  const deducibleTotal = round2(dedCorr.cuota + dedBI.cuota)
  const resultado71 = round2(devengadaTotal - deducibleTotal)

  return { devengadoByType: dev, aib, isp, deducibleCorriente: dedCorr, deducibleBienesInversion: dedBI, resultado71 }
}

