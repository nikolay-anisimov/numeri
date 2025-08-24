export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell)
          if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return '"' + s.replaceAll('"', '""') + '"'
          }
          return s
        })
        .join(',')
    )
    .join('\n')
}

// Minimal CSV parser supporting quotes and commas/newlines inside quotes.
export function parseCsv(input: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let i = 0
  const s = input.replace(/\r\n?/g, '\n')
  let inQuotes = false
  while (i < s.length) {
    const ch = s[i]
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      } else {
        field += ch
        i++
        continue
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
        continue
      }
      if (ch === ',') {
        cur.push(field)
        field = ''
        i++
        continue
      }
      if (ch === '\n') {
        cur.push(field)
        rows.push(cur)
        cur = []
        field = ''
        i++
        continue
      }
      field += ch
      i++
    }
  }
  // flush
  cur.push(field)
  rows.push(cur)
  return rows
}
