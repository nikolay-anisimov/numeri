// AEAT Books CSV export (simplified placeholder)
// TODO: Map exact AEAT columns per official spec

import { toCsv } from './csv'
import { round2 } from './fx'

export interface BookEntry {
  date: string // YYYY-MM-DD
  type: 'INGRESO' | 'GASTO'
  series?: string
  number?: string
  thirdPartyName?: string
  thirdPartyNif?: string
  base: number
  vatRate?: number
  vatAmount?: number
  total: number
  description?: string
}

export function exportAeatCsv(rows: BookEntry[]): string {
  const headers = [
    'Fecha',
    'Tipo',
    'Serie',
    'Numero',
    'Tercero',
    'NIF',
    'Base',
    'TipoIVA',
    'CuotaIVA',
    'Total',
    'Descripcion'
  ]
  const data = rows.map((r) => [
    r.date,
    r.type,
    r.series ?? '',
    r.number ?? '',
    r.thirdPartyName ?? '',
    r.thirdPartyNif ?? '',
    round2(r.base).toFixed(2),
    r.vatRate ?? '',
    r.vatAmount != null ? round2(r.vatAmount).toFixed(2) : '',
    round2(r.total).toFixed(2),
    r.description ?? ''
  ])
  return toCsv([headers, ...data])
}

// Very small helpers for fiscal calc placeholders
export function calcModelo303BaseAndVat(entries: BookEntry[]) {
  const sales = entries.filter((e) => e.type === 'INGRESO')
  const purchases = entries.filter((e) => e.type === 'GASTO')
  const devengada = round2(
    sales.reduce((sum, r) => sum + (r.vatAmount || 0), 0)
  )
  const deducible = round2(
    purchases.reduce((sum, r) => sum + (r.vatAmount || 0), 0)
  )
  const resultado = round2(devengada - deducible)
  return { devengada, deducible, resultado }
}

