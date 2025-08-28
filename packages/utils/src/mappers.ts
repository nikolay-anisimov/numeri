import { InvoiceOutFor349, Tax303Entry } from './index'

export interface PartyLike {
  name?: string | null
  nif?: string | null
  euVatNumber?: string | null
  countryCode?: string | null
}

export interface InvoiceOutLike {
  issueDate: string // YYYY-MM-DD
  series?: string | null
  number: string
  client: PartyLike
  base: number
  vatRate: number
  vatAmount: number
  total: number
  currency: string
  fxToEUR: number
  euOperation?: boolean
  codeTipoFactura?: string
  codeConceptoIngreso?: string
  codeClaveOperacion?: string
  codeCalificacionOp?: string
  codeExencion?: string
}

export interface InvoiceInLike {
  issueDate: string // YYYY-MM-DD
  supplier: PartyLike
  base: number
  vatRate: number
  vatAmount: number
  total: number
  currency: string
  fxToEUR: number
  assetFlag?: boolean
  deductible?: boolean
  codeTipoFactura?: string
  codeConceptoGasto?: string
  codeClaveOperacion?: string
}

export function quarterFromMonth(m: number): 1 | 2 | 3 | 4 {
  if (m <= 3) return 1
  if (m <= 6) return 2
  if (m <= 9) return 3
  return 4
}

export function periodLabelFromDate(iso: string): string {
  const m = Number(iso.slice(5, 7))
  const q = quarterFromMonth(m)
  return `${q}T`
}

export function yearFromDate(iso: string): number {
  return Number(iso.slice(0, 4))
}

// Column indexes for unified EXPEDIDAS_INGRESOS based on AEAT example
// 0: Ejercicio, 1: Periodo, 10: Serie, 11: Numero, 16: Nombre Destinatario,
// 20: Total Factura, 21: Base Imponible, 22: Tipo de IVA, 23: Cuota IVA
export function mapInvoiceOutToUnifiedRow(inv: InvoiceOutLike): any[] {
  const row: any[] = new Array(36).fill('')
  row[0] = yearFromDate(inv.issueDate)
  row[1] = periodLabelFromDate(inv.issueDate)
  // Codes (approximate columns; will be refined with template-driven writer)
  // Tipo de Factura ~ col 5
  if (inv.codeTipoFactura) row[5] = inv.codeTipoFactura
  // Concepto de Ingreso ~ col 6
  if (inv.codeConceptoIngreso) row[6] = inv.codeConceptoIngreso
  row[10] = inv.series ?? ''
  row[11] = inv.number
  row[16] = inv.client.name ?? ''
  // Clave/Calificación/Exención ~ col 17..19
  if (inv.codeClaveOperacion) row[17] = inv.codeClaveOperacion
  if (inv.codeCalificacionOp) row[18] = inv.codeCalificacionOp
  if (inv.codeExencion) row[19] = inv.codeExencion
  row[20] = inv.total
  row[21] = inv.base
  row[22] = inv.vatRate
  row[23] = inv.vatAmount
  return row
}

// Column indexes for unified RECIBIDAS_GASTOS based on AEAT example
// 0: Ejercicio, 1: Periodo, 10: (Serie-Número), 18: Nombre Expedidor,
// 24: Total Factura, 25: Base Imponible, 26: Tipo de IVA, 27: Cuota Soportada,
// 28: Cuota Deducible (initially equal to soportada if deductible=true)
export function mapInvoiceInToUnifiedRow(inv: InvoiceInLike): any[] {
  const row: any[] = new Array(40).fill('')
  row[0] = yearFromDate(inv.issueDate)
  row[1] = periodLabelFromDate(inv.issueDate)
  // Tipo de Factura ~ col 5
  if (inv.codeTipoFactura) row[5] = inv.codeTipoFactura
  // Concepto de Gasto ~ col 6
  if (inv.codeConceptoGasto) row[6] = inv.codeConceptoGasto
  // Serie-Número not available in model; leave blank or derive externally
  row[18] = inv.supplier.name ?? ''
  // Clave de Operación ~ col 19
  if (inv.codeClaveOperacion) row[19] = inv.codeClaveOperacion
  row[24] = inv.total
  row[25] = inv.base
  row[26] = inv.vatRate
  row[27] = inv.vatAmount
  row[28] = inv.deductible === false ? 0 : inv.vatAmount
  return row
}

export function build303Entries(
  outs: InvoiceOutLike[],
  ins: InvoiceInLike[]
): Tax303Entry[] {
  const income = outs.map<Tax303Entry>((o) => ({
    type: 'INGRESO',
    base: o.base,
    vatRate: o.vatRate,
    vatAmount: o.vatAmount
  }))
  const expenses = ins.map<Tax303Entry>((i) => ({
    type: 'GASTO',
    base: i.base,
    vatRate: i.vatRate,
    vatAmount: i.deductible === false ? 0 : i.vatAmount,
    asset: Boolean(i.assetFlag)
  }))
  return [...income, ...expenses]
}

export function build349Inputs(outs: InvoiceOutLike[]): InvoiceOutFor349[] {
  return outs.map((o) => ({
    date: o.issueDate,
    partnerVat: o.client.euVatNumber || o.client.nif || null,
    partnerName: o.client.name || null,
    base: o.base,
    currency: o.currency,
    fxToEUR: o.fxToEUR,
    euOperation: Boolean(o.euOperation),
    clave: o.euOperation ? 'S' : undefined
  }))
}
