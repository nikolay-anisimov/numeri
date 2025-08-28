/* Extract format spec (column titles, types, and validations) from LSI.xlsx */
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')

function sheetRows(ws) {
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
}

function detectTypesRow(rows) {
  const re = /(Decimal|Fecha|Alfanum[eé]rico|Num[eé]rico)/i
  for (let r = 0; r < Math.min(20, rows.length); r++) {
    const row = rows[r] || []
    const hits = row.reduce((acc, v) => acc + (re.test(String(v)) ? 1 : 0), 0)
    if (hits >= 5) return r
  }
  return null
}

function findValidationsStart(rows) {
  for (let r = 0; r < Math.min(30, rows.length); r++) {
    const row = rows[r] || []
    const hasVal = row.some((v) => String(v).toLowerCase().includes('validaciones'))
    if (hasVal) return r
  }
  return null
}

function extractRefs(text) {
  const out = []
  const re = /\((\d{1,2})\)/g
  let m
  while ((m = re.exec(String(text)))) out.push(Number(m[1]))
  return out
}

function propagateTop(topRow) {
  const out = []
  let last = ''
  for (let c = 0; c < topRow.length; c++) {
    const v = String(topRow[c] || '').replace(/\r?\n/g, ' ').trim()
    if (v) last = v
    out[c] = last
  }
  return out
}

function extractSheet(ws) {
  const rows = sheetRows(ws)
  const typesRow = detectTypesRow(rows)
  const types = typesRow != null ? rows[typesRow] || [] : []
  // Heuristic: subheaders row sits directly above the types row; top (group) row is one above subheaders
  const subRow = typesRow != null && typesRow - 1 >= 0 ? rows[typesRow - 1] || [] : []
  const topRowRaw = typesRow != null && typesRow - 2 >= 0 ? rows[typesRow - 2] || [] : []
  const topRow = propagateTop(topRowRaw)
  const validationsStart = findValidationsStart(rows)
  const validations = []
  if (validationsStart != null) {
    for (let r = validationsStart + 1; r < Math.min(rows.length, validationsStart + 40); r++) {
      const row = rows[r] || []
      const numCellIdx = row.findIndex((v) => /^\d{1,2}$/.test(String(v).trim()))
      if (numCellIdx >= 0) {
        const num = Number(String(row[numCellIdx]).trim())
        const text = row.slice(numCellIdx + 1).map((v) => String(v)).join(' ').replace(/\s+/g, ' ').trim()
        if (text) validations.push({ n: num, text })
      }
    }
  }
  const columns = []
  const maxCols = Math.max(subRow.length, types.length)
  for (let c = 0; c < maxCols; c++) {
    const sub = String(subRow[c] || '').replace(/\r?\n/g, ' ').trim()
    const top = String(topRow[c] || '').replace(/\r?\n/g, ' ').trim()
    const type = String(types[c] || '').trim()
    if (!sub && !type) continue // ignore non-columns
    const header = sub ? (top ? `${top}.${sub}` : sub) : top
    const refs = [...extractRefs(top), ...extractRefs(sub)]
    columns.push({ index: c, top, sub, header, type, refs: Array.from(new Set(refs)) })
  }
  return { columns, validations, typesRow, validationsStart }
}

function toMarkdown(name, data) {
  let md = `### ${name}\n\n`
  md += `Columns (index, header, type, refs)\n\n`
  md += `| # | Header | Type | Refs |\n|---:|---|---|---|\n`
  for (const col of data.columns) {
    md += `| ${col.index} | ${col.header || ''} | ${col.type || ''} | ${col.refs.join(', ')} |\n`
  }
  if (data.validations.length) {
    md += `\nValidations\n\n`
    for (const v of data.validations) {
      md += `- (${v.n}): ${v.text}\n`
    }
  }
  md += `\n`
  return md
}

function main() {
  const file = process.argv[2] || 'docs/AEAT/LSI.xlsx'
  const abs = path.resolve(file)
  if (!fs.existsSync(abs)) {
    console.error('LSI.xlsx not found:', abs)
    process.exit(1)
  }
  const wb = XLSX.readFile(abs, { cellDates: true })
  const spec = { source: path.basename(abs), generatedAt: new Date().toISOString(), sheets: {} }
  let md = `**AEAT Libros Unificados — Extracted Format (from ${spec.source})**\n\n`
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name]
    const data = extractSheet(ws)
    spec.sheets[name] = data
    md += toMarkdown(name, data)
  }
  const jsonOut = path.resolve('docs/AEAT/unificados-format.json')
  fs.writeFileSync(jsonOut, JSON.stringify(spec, null, 2))
  const mdOut = path.resolve('docs/AEAT/unificados-format.md')
  fs.writeFileSync(mdOut, md)
  console.log('Wrote', jsonOut)
  console.log('Wrote', mdOut)
}

main()
