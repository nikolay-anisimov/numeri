
export type Quarter = 1 | 2 | 3 | 4

export type DocKind =
  | 'factura-emitida'
  | 'gasto-soft'
  | 'gasto-compras'
  | 'gasto-taxscouts'
  | 'libro'
  | 'renta-modelo'
  | 'renta-borrador'
  | 'resumen-anual'

export interface TestDataEntry {
  year: number
  quarter?: Quarter
  kind: DocKind
  model?: '130' | '303' | '349' | '390'
  invoiceNo?: string
  filename: string
  relPath: string
}

const MODEL_RE = /\b(130|303|349|390)\b/

export function inferQuarterFromPath(relPath: string): Quarter | undefined {
  const m = relPath.match(/trimestre[-_ ]?(1|2|3|4)/i)
  if (!m) return undefined
  return Number(m[1]) as Quarter
}

export function inferYearFromPath(relPath: string): number | undefined {
  const m = relPath.match(/\b(20\d{2})\b/)
  if (!m) return undefined
  return Number(m[1])
}

export function detectKind(relPath: string): DocKind | undefined {
  const p = relPath.toLowerCase()
  if (p.includes('/facturas/') || /\bf-\d{4}-\d{4}\.pdf$/i.test(p)) return 'factura-emitida'
  if (p.includes('/gastos/soft/')) return 'gasto-soft'
  if (p.includes('/gastos/compras/')) return 'gasto-compras'
  if (p.includes('/gastos/taxscouts/') || p.includes('/gastos/taxcouts/')) return 'gasto-taxscouts'
  if (/libro[-_]/i.test(p) && p.endsWith('.xlsx')) return 'libro'
  if (p.includes('/renta/borradores/')) return 'renta-borrador'
  if (p.includes('/renta/')) return 'renta-modelo'
  if (p.includes('resumen anual') || p.includes('resumen-anual')) return 'resumen-anual'
  return undefined
}

export function extractInvoiceNo(filename: string): string | undefined {
  // Common patterns like F-0003-2025.pdf -> F-0003-2025
  const m = filename.match(/([A-Z]-\d{4}-\d{4})/i)
  return m ? m[1] : undefined
}

export function extractModel(filenameOrPath: string): TestDataEntry['model'] | undefined {
  const m = filenameOrPath.replace(/º|°/g, '').match(MODEL_RE)
  if (!m) return undefined
  return m[1] as TestDataEntry['model']
}

export function toEntry(relPath: string): TestDataEntry | undefined {
  const filename = relPath.split(/[/\\]/).pop()!
  const year = inferYearFromPath(relPath)
  const quarter = inferQuarterFromPath(relPath)
  const kind = detectKind(relPath)
  if (!year || !kind) return undefined

  const model = kind === 'renta-modelo' || kind === 'renta-borrador' || kind === 'resumen-anual' ? extractModel(relPath) : undefined
  const invoiceNo = kind === 'factura-emitida' ? extractInvoiceNo(filename) : undefined

  return {
    year,
    quarter,
    kind,
    model,
    invoiceNo,
    filename,
    relPath,
  }
}

export interface TestDataRegistryYear {
  year: number
  entries: TestDataEntry[]
}

export function groupByYear(entries: TestDataEntry[]): TestDataRegistryYear[] {
  const map = new Map<number, TestDataEntry[]>()
  for (const e of entries) {
    const list = map.get(e.year) ?? []
    list.push(e)
    map.set(e.year, list)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, list]) => ({ year, entries: list.sort(sortEntries) }))
}

function sortEntries(a: TestDataEntry, b: TestDataEntry) {
  if (a.quarter && b.quarter && a.quarter !== b.quarter) return a.quarter - b.quarter
  if (!!a.quarter !== !!b.quarter) return a.quarter ? -1 : 1
  return a.relPath.localeCompare(b.relPath)
}

export interface TestDataRegistry {
  generatedAt: string
  root: string
  years: TestDataRegistryYear[]
  summary: {
    total: number
    byKind: Record<DocKind, number>
  }
}

export function buildRegistry(rootRel: string, files: string[]): TestDataRegistry {
  const entries = files
    .map((p) => p.replace(/\\/g, '/'))
    .filter((p) => p.startsWith(rootRel + '/'))
    .map((p) => p.substring(rootRel.length + 1))
    .map(toEntry)
    .filter((e): e is TestDataEntry => !!e)

  const years = groupByYear(entries)
  const byKind = Object.fromEntries(
    [
      'factura-emitida',
      'gasto-soft',
      'gasto-compras',
      'gasto-taxscouts',
      'libro',
      'renta-modelo',
      'renta-borrador',
      'resumen-anual',
    ].map((k) => [k, entries.filter((e) => e.kind === (k as DocKind)).length])
  ) as Record<DocKind, number>

  return {
    generatedAt: new Date().toISOString(),
    root: rootRel,
    years,
    summary: { total: entries.length, byKind },
  }
}
