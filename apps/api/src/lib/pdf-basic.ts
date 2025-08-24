// Minimal PDF generator for a single-page text invoice. No external deps.
// Produces a simple PDF with Helvetica font and multiple text lines.

function escapePdfText(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

export function createSimplePdf(title: string, lines: string[]): Buffer {
  const objects: string[] = []

  // 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  // 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')

  // 5: Font (Helvetica)
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n')

  // 3: Page
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n'
  )

  // 4: Contents
  const startY = 800
  const fontSize = 12
  const leading = 16
  const textLines = [title, ...lines]
  const textStream =
    'BT\n' +
    `/F1 ${fontSize} Tf\n` +
    `${leading} TL\n` +
    `72 ${startY} Td\n` +
    textLines
      .map((t, i) => {
        const escaped = escapePdfText(String(t))
        return (i === 0 ? '' : 'T*\n') + `(${escaped}) Tj\n`
      })
      .join('') +
    'ET\n'

  const content = `4 0 obj\n<< /Length ${Buffer.byteLength(textStream)} >>\nstream\n${textStream}endstream\nendobj\n`
  objects.splice(3, 0, content) // ensure 4 comes before 5 in array order we control offsets

  // Build PDF with xref
  const header = '%PDF-1.4\n'
  let body = ''
  const offsets: number[] = [0]
  let cursor = header.length
  for (const obj of objects) {
    offsets.push(cursor)
    body += obj
    cursor += obj.length
  }

  const xrefStart = cursor
  let xref = `xref\n0 ${objects.length + 1}\n`
  xref += '0000000000 65535 f \n'
  for (let i = 1; i <= objects.length; i++) {
    const off = offsets[i]
    xref += `${off.toString().padStart(10, '0')} 00000 n \n`
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

  const pdf = header + body + xref + trailer
  return Buffer.from(pdf, 'ascii')
}

export interface SimpleInvoiceData {
  title: string
  fields: Array<[label: string, value: string | number]>
}

export function createInvoicePdf(data: SimpleInvoiceData) {
  const lines = data.fields.map(([k, v]) => `${k}: ${v}`)
  return createSimplePdf(data.title, lines)
}

