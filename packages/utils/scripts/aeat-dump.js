/* Dump sheet names and header rows from an XLSX file. */
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

const file = process.argv[2]
if (!file) {
  console.error('Usage: node packages/utils/scripts/aeat-dump.js <file.xlsx>')
  process.exit(1)
}
const abs = path.resolve(file)
if (!fs.existsSync(abs)) {
  console.error('File not found:', abs)
  process.exit(1)
}
const wb = XLSX.readFile(abs, { cellDates: true })
console.log('File:', abs)
console.log('Sheets:', wb.SheetNames.join(', '))
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name]
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
console.log('--- Sheet:', name)
for (let i = 0; i < Math.min(50, rows.length); i++) {
  const r = rows[i]
  const nonEmpty = r.filter((c) => c !== '').length
  console.log(String(i).padStart(3, '0'), nonEmpty > 0 ? r : '')
}
}
