import * as XLSX from 'xlsx'

export type LibroDirection = 'emitidas' | 'recibidas'

export interface LibroInvoiceRow {
  direction: LibroDirection
  issueDate: string // YYYY-MM-DD
  number?: string
  series?: string
  counterpartyName?: string
  nif?: string
  base: number
  vatRate: number
  vatAmount: number
  total: number
  currency: string
  euOperation?: boolean
  category?: string // for purchases
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[_.-]+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
}

const headerKeys: Record<string, string[]> = {
  issueDate: ['fecha', 'fecha emision', 'fecha factura', 'date'],
  number: ['numero', 'nº', 'n', 'factura', 'invoice'],
  series: ['serie', 'series'],
  base: ['base', 'base imponible', 'bi'],
  vatRate: ['tipo iva', 'iva %', 'iva porcentaje', 'iva'],
  vatAmount: ['cuota iva', 'iva importe', 'iva eur', 'iva €', 'importe iva'],
  total: ['total', 'importe total', 'bruto'],
  currency: ['moneda', 'currency', 'divisa'],
  client: ['cliente', 'customer'],
  supplier: ['proveedor', 'supplier'],
  nif: ['nif', 'cif', 'vat', 'vat number'],
  eu: ['intracomunitario', 'eu', 'operacion intracomunitaria']
}

function matchColumn(columns: string[], targets: string[]): number | undefined {
  const normCols = columns.map(normalizeHeader)
  for (const t of targets) {
    const idx = normCols.findIndex((c) => c.includes(t))
    if (idx >= 0) return idx
  }
  return undefined
}

function toISODate(v: any): string | undefined {
  if (!v) return undefined
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  // try Excel date serial
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v)
    if (d) {
      const dt = new Date(Date.UTC(d.y, (d.m ?? 1) - 1, d.d ?? 1))
      return dt.toISOString().slice(0, 10)
    }
  }
  // parse as string
  const s = String(v)
  const m = s.match(/(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/)
  if (m) {
    const yyyy = Number(m[1])
    const mm = Number(m[2])
    const dd = Number(m[3])
    const dt = new Date(Date.UTC(yyyy, mm - 1, dd))
    return dt.toISOString().slice(0, 10)
  }
  return undefined
}

function num(v: any): number | undefined {
  if (v == null || v === '') return undefined
  if (typeof v === 'number') return v
  const s = String(v).replace(/[^0-9.,-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '')
  const normalized = s.replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : undefined
}

function bool(v: any): boolean | undefined {
  if (v == null || v === '') return undefined
  if (typeof v === 'boolean') return v
  const s = String(v).trim().toLowerCase()
  if (['si', 'sí', 'yes', 'true', '1', 'x'].includes(s)) return true
  if (['no', 'false', '0'].includes(s)) return false
  return undefined
}

function inferDirection(name: string, idx: number): LibroDirection {
  const n = name.toLowerCase()
  if (n.includes('emit') || n.includes('vent')) return 'emitidas'
  if (n.includes('recib') || n.includes('compr')) return 'recibidas'
  return idx === 0 ? 'emitidas' : 'recibidas'
}

export function parseLibroXlsx(filePath: string): { out: LibroInvoiceRow[]; in: LibroInvoiceRow[] } {
  const wb = XLSX.readFile(filePath, { cellDates: true })
  const out: LibroInvoiceRow[] = []
  const inn: LibroInvoiceRow[] = []
  wb.SheetNames.forEach((sheetName, i) => {
    const ws = wb.Sheets[sheetName]
    if (!ws) return
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any
    if (!rows || rows.length === 0) return
    const headers = (rows[0] as any[]).map((h) => String(h))
    const dir = inferDirection(sheetName, i)
    const col = {
      date: matchColumn(headers, headerKeys.issueDate) ?? 0,
      number: matchColumn(headers, headerKeys.number),
      series: matchColumn(headers, headerKeys.series),
      base: matchColumn(headers, headerKeys.base),
      vatRate: matchColumn(headers, headerKeys.vatRate),
      vatAmount: matchColumn(headers, headerKeys.vatAmount),
      total: matchColumn(headers, headerKeys.total),
      currency: matchColumn(headers, headerKeys.currency),
      name: matchColumn(headers, dir === 'emitidas' ? headerKeys.client : headerKeys.supplier),
      nif: matchColumn(headers, headerKeys.nif),
      eu: matchColumn(headers, headerKeys.eu),
      category: matchColumn(headers, ['categoria', 'category'])
    }
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      if (!row || row.every((c: any) => c === '' || c == null)) continue
      const issueDate = toISODate(col.date != null ? row[col.date] : undefined)
      const base = num(col.base != null ? row[col.base] : undefined) ?? 0
      const vatRate = num(col.vatRate != null ? row[col.vatRate] : undefined) ?? 0
      const vatAmount = num(col.vatAmount != null ? row[col.vatAmount] : undefined) ?? base * (vatRate / 100)
      const total = num(col.total != null ? row[col.total] : undefined) ?? base + vatAmount
      const currency = String(col.currency != null ? row[col.currency] : 'EUR') || 'EUR'
      const item: LibroInvoiceRow = {
        direction: dir,
        issueDate: issueDate || '',
        number: col.number != null ? String(row[col.number]) : undefined,
        series: col.series != null ? String(row[col.series]) : undefined,
        counterpartyName: col.name != null ? String(row[col.name]) : undefined,
        nif: col.nif != null ? String(row[col.nif]) : undefined,
        base: base ?? 0,
        vatRate: vatRate ?? 0,
        vatAmount: vatAmount ?? 0,
        total: total ?? 0,
        currency: currency || 'EUR',
        euOperation: bool(col.eu != null ? row[col.eu] : undefined),
        category: col.category != null ? String(row[col.category]) : undefined
      }
      if (!item.issueDate) continue
      if (dir === 'emitidas') out.push(item)
      else inn.push(item)
    }
  })
  return { out, in: inn }
}

