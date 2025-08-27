import * as XLSX from 'xlsx'
import { round2 } from './fx'
import type { BookEntry } from './aeat'

export interface BuildLibroOptions {
  sheetNames?: {
    expedidas?: string
    recibidas?: string
  }
}

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
  const shex = opts.sheetNames?.expedidas ?? 'IVA-Expedidas'
  const shrx = opts.sheetNames?.recibidas ?? 'IVA-Recibidas'

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

