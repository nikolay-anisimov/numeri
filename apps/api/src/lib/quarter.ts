import { build303Entries, build349Inputs, mapInvoiceInToUnifiedRow, mapInvoiceOutToUnifiedRow } from '@packages/utils'
import { build349Lines, calc303 } from '@packages/utils'

export interface OutDTO {
  issueDate: string
  series?: string | null
  number: string
  client: { name?: string | null; nif?: string | null; euVatNumber?: string | null; countryCode?: string | null }
  base: number
  vatRate: number
  vatAmount: number
  total: number
  currency: string
  fxToEUR: number
  euOperation?: boolean
}

export interface InDTO {
  issueDate: string
  supplier: { name?: string | null; nif?: string | null; euVatNumber?: string | null; countryCode?: string | null }
  base: number
  vatRate: number
  vatAmount: number
  total: number
  currency: string
  fxToEUR: number
  assetFlag?: boolean
  deductible?: boolean
}

export function buildQuarterFromDocs(outDocs: OutDTO[], inDocs: InDTO[]) {
  const expRows = outDocs.map((o) => mapInvoiceOutToUnifiedRow(o))
  const recRows = inDocs.map((i) => mapInvoiceInToUnifiedRow(i))

  const entries303 = build303Entries(outDocs as any, inDocs as any)
  const res303 = calc303(entries303)

  const inputs349 = build349Inputs(outDocs as any)
  const lines349 = build349Lines(inputs349, { periodLabel: 'Q' })

  return { expRows, recRows, res303, lines349 }
}

