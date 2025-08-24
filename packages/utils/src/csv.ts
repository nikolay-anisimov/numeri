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

