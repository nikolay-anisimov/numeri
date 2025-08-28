/* Extract sheet names, headers, and cell comments (tooltips) from an XLSX file. */
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')

function cellComments(ws) {
  const out = []
  for (const addr of Object.keys(ws)) {
    if (addr[0] === '!' || typeof ws[addr] !== 'object') continue
    const cell = ws[addr]
    if (cell && Array.isArray(cell.c) && cell.c.length > 0) {
      const text = cell.c.map((c) => (c && c.t ? String(c.t).trim() : '')).filter(Boolean).join('\n')
      out.push({ addr, text })
    }
  }
  return out
}

function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: node packages/utils/scripts/aeat-extract.js <file.xlsx>')
    process.exit(1)
  }
  const abs = path.resolve(file)
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs)
    process.exit(1)
  }
  const wb = XLSX.readFile(abs, { cellDates: true, cellStyles: true, cellComments: true })
  console.log('File:', abs)
  console.log('Sheets:', wb.SheetNames.join(', '))
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    console.log('--- Sheet:', name)
    console.log('Row0:', rows[0] || [])
    console.log('Row1:', rows[1] || [])
    const comments = cellComments(ws)
    if (comments.length) {
      console.log('Comments:')
      for (const c of comments) {
        console.log(` ${c.addr}: ${c.text.replace(/\s+/g, ' ').slice(0, 500)}`)
      }
    }
  }
}

main()

