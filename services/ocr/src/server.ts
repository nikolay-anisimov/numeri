import express from 'express'
import multer from 'multer'
import pdfParse from 'pdf-parse'

const app = express()
const upload = multer()

function cleanText(text: string) {
  return text.replace(/\r/g, '').replace(/[\t ]+/g, ' ').trim()
}

function parseDate(text: string): string | undefined {
  // Try ISO first
  let m = text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toISOString().slice(0, 10)
  // Try DD/MM/YYYY
  m = text.match(/(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})/)
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])).toISOString().slice(0, 10)
  return undefined
}

function parseNumber(s?: string): number | undefined {
  if (!s) return undefined
  const t = s.replace(/[^0-9.,-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

function findLabeledAmount(text: string, labels: string[]): number | undefined {
  const lower = text.toLowerCase()
  for (const label of labels) {
    const i = lower.indexOf(label)
    if (i >= 0) {
      const tail = text.slice(i + label.length, i + label.length + 100)
      const m = tail.match(/([0-9][0-9.,]+)/)
      const n = parseNumber(m?.[1])
      if (n != null) return n
    }
  }
  return undefined
}

function detectCurrency(text: string): string {
  if (/\bUSD\b|\$/i.test(text)) return 'USD'
  if (/\bGBP\b|£/i.test(text)) return 'GBP'
  return 'EUR'
}

function fromFilenameInvoice(filename?: string): string | undefined {
  if (!filename) return undefined
  const m = filename.match(/(Invoice[-_# ]?([A-Z0-9-]+)|F-\d{4}-\d{4})/i)
  if (m) return (m[2] || m[1]).replace(/^Invoice[-_# ]?/, '')
  return undefined
}

function parseOpenAI(text: string, filename?: string) {
  const issueDate = parseDate(text) || new Date().toISOString().slice(0, 10)
  const invoiceNumber = fromFilenameInvoice(filename) || text.match(/Invoice\s*(?:No|#)\s*([A-Z0-9-]+)/i)?.[1]
  const base = findLabeledAmount(text, ['subtotal', 'base imponible', 'base'])
  const vatRate = parseNumber(text.match(/\b(VAT|IVA)\s*(\d{1,2}[.,]?\d*)%/i)?.[2]) || 0
  const vat = findLabeledAmount(text, ['vat', 'iva']) || (base != null ? Math.round(base * ((vatRate || 0) / 100) * 100) / 100 : undefined)
  const total = findLabeledAmount(text, ['total']) || (base != null && vat != null ? base + vat : undefined)
  return {
    issueDate,
    invoiceNumber: invoiceNumber || 'UNKNOWN',
    sellerName: 'OpenAI',
    sellerNIF: '',
    buyerName: '',
    buyerNIF: '',
    baseAmount: base ?? 0,
    vatRate: vatRate ?? 0,
    vatAmount: vat ?? 0,
    totalAmount: total ?? (base ?? 0) + (vat ?? 0),
    currency: detectCurrency(text),
    euCustomer: false
  }
}

function parseAnthropic(text: string, filename?: string) {
  const issueDate = parseDate(text) || new Date().toISOString().slice(0, 10)
  const invoiceNumber = fromFilenameInvoice(filename) || text.match(/Invoice\s*(?:No|#)\s*([A-Z0-9-]+)/i)?.[1]
  const base = findLabeledAmount(text, ['subtotal', 'base imponible', 'base'])
  const vatRate = parseNumber(text.match(/\b(VAT|IVA)\s*(\d{1,2}[.,]?\d*)%/i)?.[2]) || 0
  const vat = findLabeledAmount(text, ['vat', 'iva']) || (base != null ? Math.round(base * ((vatRate || 0) / 100) * 100) / 100 : undefined)
  const total = findLabeledAmount(text, ['total']) || (base != null && vat != null ? base + vat : undefined)
  return {
    issueDate,
    invoiceNumber: invoiceNumber || 'UNKNOWN',
    sellerName: 'Anthropic',
    sellerNIF: '',
    buyerName: '',
    buyerNIF: '',
    baseAmount: base ?? 0,
    vatRate: vatRate ?? 0,
    vatAmount: vat ?? 0,
    totalAmount: total ?? (base ?? 0) + (vat ?? 0),
    currency: detectCurrency(text),
    euCustomer: false
  }
}

function parseTaxScouts(text: string, filename?: string) {
  const issueDate = parseDate(text) || new Date().toISOString().slice(0, 10)
  const invoiceNumber = fromFilenameInvoice(filename) || text.match(/Invoice\s*(?:No|#)\s*([A-Z0-9-]+)/i)?.[1]
  const base = findLabeledAmount(text, ['base imponible', 'base']) || findLabeledAmount(text, ['subtotal'])
  const vatRate = parseNumber(text.match(/\bIVA\s*(\d{1,2}[.,]?\d*)%/i)?.[1]) || parseNumber(text.match(/\bVAT\s*(\d{1,2}[.,]?\d*)%/i)?.[1]) || 21
  const vat = findLabeledAmount(text, ['iva', 'vat']) || (base != null ? Math.round(base * ((vatRate || 0) / 100) * 100) / 100 : undefined)
  const total = findLabeledAmount(text, ['total']) || (base != null && vat != null ? base + vat : undefined)
  return {
    issueDate,
    invoiceNumber: invoiceNumber || 'UNKNOWN',
    sellerName: 'TaxScouts',
    sellerNIF: '',
    buyerName: '',
    buyerNIF: '',
    baseAmount: base ?? 0,
    vatRate: vatRate ?? 0,
    vatAmount: vat ?? 0,
    totalAmount: total ?? (base ?? 0) + (vat ?? 0),
    currency: detectCurrency(text),
    euCustomer: false
  }
}

function genericParse(text: string, filename?: string) {
  const issueDate = parseDate(text) || new Date().toISOString().slice(0, 10)
  const invoiceNumber = fromFilenameInvoice(filename) || text.match(/Invoice\s*(?:No|#)\s*([A-Z0-9-]+)/i)?.[1] || text.match(/Factura\s*(?:No|Nº)\s*([\w-]+)/i)?.[1]
  const base = findLabeledAmount(text, ['base imponible', 'base', 'subtotal'])
  const vatRate = parseNumber(text.match(/\b(VAT|IVA)\s*(\d{1,2}[.,]?\d*)%/i)?.[2]) || 0
  const vat = findLabeledAmount(text, ['iva', 'vat']) || (base != null ? Math.round(base * ((vatRate || 0) / 100) * 100) / 100 : undefined)
  const total = findLabeledAmount(text, ['total']) || (base != null && vat != null ? base + vat : undefined)
  return {
    issueDate,
    invoiceNumber: (invoiceNumber || 'UNKNOWN').toString(),
    sellerName: '',
    sellerNIF: '',
    buyerName: '',
    buyerNIF: '',
    baseAmount: base ?? 0,
    vatRate: vatRate ?? 0,
    vatAmount: vat ?? 0,
    totalAmount: total ?? (base ?? 0) + (vat ?? 0),
    currency: detectCurrency(text),
    euCustomer: false
  }
}

function chooseVendor(text: string, filename?: string) {
  const t = (filename || '') + ' ' + text
  const low = t.toLowerCase()
  if (low.includes('openai') || /invoice-728fd5fd/i.test(t)) return 'openai'
  if (low.includes('anthropic') || /invoice-a4346ac6/i.test(t)) return 'anthropic'
  if (low.includes('taxscouts') || /202afaf2/i.test(t)) return 'taxscouts'
  return 'generic'
}

app.post('/parse', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' })
  try {
    const data = await pdfParse(req.file.buffer)
    const text = cleanText(data.text || '')
    const vendor = chooseVendor(text, req.file.originalname)
    let parsed
    switch (vendor) {
      case 'openai':
        parsed = parseOpenAI(text, req.file.originalname)
        break
      case 'anthropic':
        parsed = parseAnthropic(text, req.file.originalname)
        break
      case 'taxscouts':
        parsed = parseTaxScouts(text, req.file.originalname)
        break
      default:
        parsed = genericParse(text, req.file.originalname)
    }
    res.json({ ok: true, vendor, parsed, rawText: process.env.OCR_INCLUDE_TEXT ? text : undefined })
  } catch (err: any) {
    console.error('OCR error', err?.message)
    res.status(500).json({ ok: false, error: 'parse_failed', message: err?.message })
  }
})

const port = Number(process.env.PORT || 4100)
app.listen(port, () => {
  console.log(`OCR service on http://localhost:${port}`)
})
