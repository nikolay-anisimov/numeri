import * as XLSX from 'xlsx'

import { round2 } from './fx'
import type { BookEntry } from './aeat'

export interface BuildLibroOptions {
  sheetNames?: {
    expedidas?: string
    recibidas?: string
  }
}

// Provisional headers for unified 'T' format (to be replaced with exact AEAT headers)
const HEADERS_EXPEDIDAS = [
  'Fecha',
  'FechaOperacion',
  'Serie',
  'Numero',
  'NIFDestinatario',
  'NombreDestinatario',
  'Base0',
  'Cuota0',
  'Base4',
  'Cuota4',
  'Base10',
  'Cuota10',
  'Base21',
  'Cuota21',
  'Total',
  'Descripcion',
  'ClaveOperacion',
  'Moneda'
]

const HEADERS_RECIBIDAS = [
  'Fecha',
  'FechaOperacion',
  'Serie',
  'Numero',
  'NIFProveedor',
  'NombreProveedor',
  'Base0',
  'Cuota0',
  'Base4',
  'Cuota4',
  'Base10',
  'Cuota10',
  'Base21',
  'Cuota21',
  'Total',
  'BienInversion',
  'Descripcion',
  'Moneda'
]

function toExcelDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined
  // Expect YYYY-MM-DD
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return undefined
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d
}

function rowForExpedida(r: BookEntry) {
  const base0 = r.vatRate === 0 ? round2(r.base) : ''
  const cuota0 = r.vatRate === 0 ? round2(r.vatAmount || 0) : ''
  const base4 = r.vatRate === 4 ? round2(r.base) : ''
  const cuota4 = r.vatRate === 4 ? round2(r.vatAmount || 0) : ''
  const base10 = r.vatRate === 10 ? round2(r.base) : ''
  const cuota10 = r.vatRate === 10 ? round2(r.vatAmount || 0) : ''
  const base21 = r.vatRate === 21 ? round2(r.base) : ''
  const cuota21 = r.vatRate === 21 ? round2(r.vatAmount || 0) : ''
  return [
    toExcelDate(r.date) || '',
    '',
    r.series ?? '',
    r.number ?? '',
    r.thirdPartyNif ?? '',
    r.thirdPartyName ?? '',
    base0,
    cuota0,
    base4,
    cuota4,
    base10,
    cuota10,
    base21,
    cuota21,
    round2(r.total),
    r.description ?? '',
    '',
    'EUR'
  ]
}

function rowForRecibida(r: BookEntry) {
  const base0 = r.vatRate === 0 ? round2(r.base) : ''
  const cuota0 = r.vatRate === 0 ? round2(r.vatAmount || 0) : ''
  const base4 = r.vatRate === 4 ? round2(r.base) : ''
  const cuota4 = r.vatRate === 4 ? round2(r.vatAmount || 0) : ''
  const base10 = r.vatRate === 10 ? round2(r.base) : ''
  const cuota10 = r.vatRate === 10 ? round2(r.vatAmount || 0) : ''
  const base21 = r.vatRate === 21 ? round2(r.base) : ''
  const cuota21 = r.vatRate === 21 ? round2(r.vatAmount || 0) : ''
  return [
    toExcelDate(r.date) || '',
    '',
    r.series ?? '',
    r.number ?? '',
    r.thirdPartyNif ?? '',
    r.thirdPartyName ?? '',
    base0,
    cuota0,
    base4,
    cuota4,
    base10,
    cuota10,
    base21,
    cuota21,
    round2(r.total),
    '',
    r.description ?? '',
    'EUR'
  ]
}

export function buildLibroWorkbook(
  expedidas: BookEntry[],
  recibidas: BookEntry[],
  opts: BuildLibroOptions = {}
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  // Official AEAT sheet names for unified IVA+IRPF book (Tipo T)
  const shex = opts.sheetNames?.expedidas ?? 'EXPEDIDAS_INGRESOS'
  const shrx = opts.sheetNames?.recibidas ?? 'RECIBIDAS_GASTOS'

  const dataExp = [HEADERS_EXPEDIDAS, ...expedidas.map(rowForExpedida)]
  const wsExp = XLSX.utils.aoa_to_sheet(dataExp)
  XLSX.utils.book_append_sheet(wb, wsExp, shex)

  const dataRec = [HEADERS_RECIBIDAS, ...recibidas.map(rowForRecibida)]
  const wsRec = XLSX.utils.aoa_to_sheet(dataRec)
  XLSX.utils.book_append_sheet(wb, wsRec, shrx)

  return wb
}

export function writeLibroXlsx(
  filePath: string,
  expedidas: BookEntry[],
  recibidas: BookEntry[],
  opts: BuildLibroOptions = {}
) {
  const wb = buildLibroWorkbook(expedidas, recibidas, opts)
  XLSX.writeFile(wb, filePath)
}

// Template-driven writer: load an AEAT template (e.g., docs/AEAT/LSI.xlsx) and append
// data rows after the header block (default: start at row index 2 → Excel row 3).
export function writeLibroFromTemplate(
  templatePath: string,
  outPath: string,
  expedidasRows: any[][],
  recibidasRows: any[][],
  opts: { sheetNames?: { expedidas?: string; recibidas?: string }; startRow?: number } = {}
) {
  const wb = XLSX.readFile(templatePath, { cellDates: true })
  const shex = opts.sheetNames?.expedidas ?? 'EXPEDIDAS_INGRESOS'
  const shrx = opts.sheetNames?.recibidas ?? 'RECIBIDAS_GASTOS'
  const startRow = opts.startRow ?? 2 // 0-based index → Excel row 3
  const wsExp = wb.Sheets[shex]
  const wsRec = wb.Sheets[shrx]
  if (!wsExp || !wsRec) throw new Error(`Template missing required sheets ${shex} or ${shrx}`)

  // Read existing sheet to AoA, pad to startRow, and append rows
  function appendRows(wsName: string, ws: any, rows: any[][]) {
    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any
    while (data.length < startRow) data.push([])
    for (const r of rows) data.push(r)
    const next = XLSX.utils.aoa_to_sheet(data)
    // Replace sheet in workbook by name
    wb.Sheets[wsName] = next
    return next
  }

  appendRows(shex, wsExp, expedidasRows)
  appendRows(shrx, wsRec, recibidasRows)
  XLSX.writeFile(wb, outPath)
}
