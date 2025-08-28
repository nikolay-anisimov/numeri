/* Extract structured code lists from AEAT unified template (tooltips). */
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')

function colToIndex(col) {
  let n = 0
  for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 64)
  return n - 1
}

function parseAddr(addr) {
  const m = addr.match(/^([A-Z]+)(\d+)$/i)
  if (!m) return null
  return { col: colToIndex(m[1].toUpperCase()), row: Number(m[2]) - 1 }
}

function sheetRows(ws) {
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
}

function headerNameForCell(ws, addr) {
  const pos = parseAddr(addr)
  if (!pos) return null
  const rows = sheetRows(ws)
  const r0 = rows[0] || []
  const r1 = rows[1] || []
  const top = String(r0[pos.col] || '').replace(/\r?\n/g, ' ').trim()
  const sub = String(r1[pos.col] || '').replace(/\r?\n/g, ' ').trim()
  if (!top && !sub) return null
  if (sub) return `${top}.${sub}`
  return top
}

function regexForHeader(header) {
  const h = (header || '').toLowerCase()
  if (h.includes('tipo de factura')) return /(\b(?:SF|DV|AJ|F\d|R\d)\b)/g
  if (h.includes('concepto de ingreso')) return /(\bI[A-Z]?\d{2}\b)/g
  if (h.includes('concepto de gasto')) return /(\bG[A-Z]?\d{1,2}\b)/g
  if (h.includes('calificación')) return /(\b(?:S\d|N\d)\b)/g
  if (h.includes('exenta')) return /(\bE\d\b)/g
  if (h.includes('clave de operación')) return /(\b(?:0[1-9]|1[0-5])\b)/g
  if (h.includes('actividad.tipo')) return /(\b[ABCD]\b)/g
  if (h.includes('actividad.código') || h.includes('actividad.codigo')) return /(\b(?:0[1-9]|[1-9]\d)\b)/g
  if (h.includes('nif') && h.includes('tipo')) return /(\b0[2-6]\b)/g
  if (h.includes('medio utilizado')) return /(\b0[1-5]\b)/g
  if (h.includes('situación')) return /(\b[1-5]\b)/g
  if (h.includes('tipo de bien')) return /(\b\d{2}\b)/g
  // fallback broad
  return /(\b(?:SF|DV|AJ|F\d|R\d|I[A-Z]?\d{2}|G[A-Z]?\d{1,2}|E\d|S\d|N\d|0[1-9]|1[0-5]|[1-5])\b)/g
}

function splitCodes(text, header) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  const re = regexForHeader(header)
  const out = []
  let m
  let lastIdx = 0
  const positions = []
  while ((m = re.exec(s))) positions.push({ code: m[1], idx: m.index })
  for (let i = 0; i < positions.length; i++) {
    const cur = positions[i]
    const next = positions[i + 1]
    const start = cur.idx + cur.code.length
    const end = next ? next.idx : s.length
    const label = s.slice(start, end).replace(/^[:\-–—\s]+/, '').trim()
    const code = cur.code
    const isGroup = /^(?:G|I)[A-Z]\d{1,2}$/.test(code)
    out.push({ code, label, kind: isGroup ? 'group' : 'code' })
  }
  // Fallback: if nothing matched, return raw text
  if (out.length === 0 && s) return [{ code: '', label: s }]
  return out
}

function collect(ws) {
  const codesByHeader = {}
  for (const a of Object.keys(ws)) {
    if (a[0] === '!' || typeof ws[a] !== 'object') continue
    const cell = ws[a]
    if (!cell || !Array.isArray(cell.c) || cell.c.length === 0) continue
    const header = headerNameForCell(ws, a)
    if (!header) continue
    const text = cell.c.map((c) => (c && c.t ? String(c.t) : '')).join('\n')
    const items = splitCodes(text, header)
    if (!codesByHeader[header]) codesByHeader[header] = { items: [], raw: [] }
    // merge, dedupe by code+label
    for (const it of items) {
      if (!codesByHeader[header].items.find((x) => x.code === it.code && x.label === it.label)) {
        codesByHeader[header].items.push(it)
      }
    }
    codesByHeader[header].raw.push(text.trim())
  }
  // sort items by code asc
  for (const k of Object.keys(codesByHeader)) {
    codesByHeader[k].items.sort((a, b) => String(a.code).localeCompare(String(b.code), 'es', { numeric: true }))
  }
  return codesByHeader
}

function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: node packages/utils/scripts/aeat-codes-extract.js <PLANTILLA.xlsx>')
    process.exit(1)
  }
  const abs = path.resolve(file)
  const wb = XLSX.readFile(abs, { cellDates: true, cellStyles: true, cellComments: true })
  const out = { source: path.basename(abs), generatedAt: new Date().toISOString(), sheets: {} }
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name]
    out.sheets[name] = collect(ws)
  }
  console.log(JSON.stringify(out, null, 2))
}

main()
