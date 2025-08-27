import vendorAliases from './config/vendors.json'

export function cleanText(text: string) {
  return text.replace(/\r/g, '').replace(/[\t ]+/g, ' ').trim()
}

export function parseDate(text: string): string | undefined {
  let m = text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toISOString().slice(0, 10)
  m = text.match(/(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})/)
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])).toISOString().slice(0, 10)
  return undefined
}

export function parseNumber(s?: string): number | undefined {
  if (!s) return undefined
  const t = s.replace(/[^0-9.,-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

function escRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function findLabeledAmount(text: string, labels: string[], pick: 'first' | 'last' = 'first'): number | undefined {
  for (const label of labels) {
    const re = new RegExp(`\\b${escRe(label)}\\b`, 'i')
    const m = re.exec(text)
    if (m && typeof m.index === 'number') {
      const idx = m.index + m[0].length
      const tail = text.slice(idx, idx + 160)
      const line = tail.split(/\n/)[0]
      const nums = line.match(/([0-9][0-9.,]+)/g)
      if (nums && nums.length) {
        const chosen = pick === 'last' ? nums[nums.length - 1] : nums[0]
        const n = parseNumber(chosen)
        if (n != null) return n
      }
    }
  }
  return undefined
}

export function detectCurrency(text: string): string {
  if (/\bUSD\b|\$/i.test(text)) return 'USD'
  if (/\bGBP\b|£/i.test(text)) return 'GBP'
  return 'EUR'
}

export function fromFilenameInvoice(filename?: string): string | undefined {
  if (!filename) return undefined
  const m = filename.match(/(Invoice[-_# ]?([A-Z0-9-]+)|F-\d{4}-\d{4})/i)
  if (m) return (m[2] || m[1]).replace(/^Invoice[-_# ]?/, '')
  return undefined
}

function extractEuVat(text: string): string | undefined {
  // Look for patterns like EU372041333 or country-prefixed VATs near 'VAT'
  const aroundVat = text.match(/(EU[0-9]{8,12}|[A-Z]{2}[A-Z0-9]{8,12})/)
  if (aroundVat) return aroundVat[1]
  return undefined
}

function hasReverseCharge(text: string): boolean {
  return /reverse\s*charge/i.test(text) || /inversion\s+del\s+sujeto\s+pasivo/i.test(text)
}

function detectCountry(text: string): string | undefined {
  const t = text.toLowerCase()
  if (t.includes('united states')) return 'US'
  if (t.includes('spain') || t.includes('españa')) return 'ES'
  if (t.includes('poland') || t.includes('polska')) return 'PL'
  if (t.includes('germany') || t.includes('deutschland')) return 'DE'
  if (t.includes('ireland')) return 'IE'
  if (t.includes('united kingdom') || t.includes('uk')) return 'GB'
  if (t.includes('france')) return 'FR'
  if (t.includes('italy') || t.includes('italia')) return 'IT'
  return undefined
}

export function parseOpenAI(text: string, filename?: string) {
  const issueDate = parseDate(text) || new Date().toISOString().slice(0, 10)
  const invoiceNumber = fromFilenameInvoice(filename) || text.match(/Invoice\s*(?:No|#)\s*([A-Z0-9-]+)/i)?.[1]
  const base = findLabeledAmount(text, ['subtotal', 'base imponible', 'base'], 'first')
  const vatRate = parseNumber(text.match(/\b(VAT|IVA)\s*(\d{1,2}[.,]?\d*)%/i)?.[2]) || 0
  const vat = findLabeledAmount(text, ['vat', 'iva'], 'last') || (base != null ? Math.round(base * ((vatRate || 0) / 100) * 100) / 100 : undefined)
  const total = findLabeledAmount(text, ['total'], 'first') || (base != null && vat != null ? base + vat : undefined)
  const sellerNIF = extractEuVat(text) || ''
  const reverseCharge = hasReverseCharge(text)
  const euOss = /^EU[A-Z0-9]{8,}/.test(sellerNIF) || /\bEU\s+OSS\s+VAT/i.test(text)
  const country = detectCountry(text)
  return {
    issueDate,
    invoiceNumber: invoiceNumber || 'UNKNOWN',
    sellerName: 'OpenAI',
    sellerNIF,
    buyerName: '',
    buyerNIF: '',
    baseAmount: base ?? 0,
    vatRate: vatRate ?? 0,
    vatAmount: vat ?? 0,
    totalAmount: total ?? (base ?? 0) + (vat ?? 0),
    currency: detectCurrency(text),
    euCustomer: false,
    reverseCharge,
    euOss,
    country
  }
}

export function parseAnthropic(text: string, filename?: string) {
  const issueDate = parseDate(text) || new Date().toISOString().slice(0, 10)
  const invoiceNumber = fromFilenameInvoice(filename) || text.match(/Invoice\s*(?:No|#)\s*([A-Z0-9-]+)/i)?.[1]
  const base = findLabeledAmount(text, ['subtotal', 'base imponible', 'base'], 'first')
  const vatRate = parseNumber(text.match(/\b(VAT|IVA)\s*(\d{1,2}[.,]?\d*)%/i)?.[2]) || 0
  const vat = findLabeledAmount(text, ['vat', 'iva'], 'last') || (base != null ? Math.round(base * ((vatRate || 0) / 100) * 100) / 100 : undefined)
  const total = findLabeledAmount(text, ['total'], 'first') || (base != null && vat != null ? base + vat : undefined)
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

export function parseTaxScouts(text: string, filename?: string) {
  const issueDate = parseDate(text) || new Date().toISOString().slice(0, 10)
  const invoiceNumber = fromFilenameInvoice(filename) || text.match(/Invoice\s*(?:No|#)\s*([A-Z0-9-]+)/i)?.[1]
  const base = findLabeledAmount(text, ['base imponible', 'base'], 'first') || findLabeledAmount(text, ['subtotal'], 'first')
  const vatRate = parseNumber(text.match(/\bIVA\s*(\d{1,2}[.,]?\d*)%/i)?.[1]) || parseNumber(text.match(/\bVAT\s*(\d{1,2}[.,]?\d*)%/i)?.[1]) || 21
  const vat = findLabeledAmount(text, ['iva', 'vat'], 'last') || (base != null ? Math.round(base * ((vatRate || 0) / 100) * 100) / 100 : undefined)
  const total = findLabeledAmount(text, ['total'], 'first') || (base != null && vat != null ? base + vat : undefined)
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

export function genericParse(text: string, filename?: string) {
  const issueDate = parseDate(text) || new Date().toISOString().slice(0, 10)
  const invoiceNumber = fromFilenameInvoice(filename) || text.match(/Invoice\s*(?:No|#)\s*([A-Z0-9-]+)/i)?.[1] || text.match(/Factura\s*(?:No|Nº)\s*([\w-]+)/i)?.[1]
  const base = findLabeledAmount(text, ['base imponible', 'base', 'subtotal'], 'first')
  const vatRate = parseNumber(text.match(/\b(VAT|IVA)\s*(\d{1,2}[.,]?\d*)%/i)?.[2]) || 0
  const vat = findLabeledAmount(text, ['iva', 'vat'], 'last') || (base != null ? Math.round(base * ((vatRate || 0) / 100) * 100) / 100 : undefined)
  const total = findLabeledAmount(text, ['total'], 'first') || (base != null && vat != null ? base + vat : undefined)
  const sellerNIF = extractEuVat(text) || ''
  const reverseCharge = hasReverseCharge(text)
  const euOss = /^EU[A-Z0-9]{8,}/.test(sellerNIF) || /\bEU\s+OSS\s+VAT/i.test(text)
  const country = detectCountry(text)
  return {
    issueDate,
    invoiceNumber: (invoiceNumber || 'UNKNOWN').toString(),
    sellerName: '',
    sellerNIF,
    buyerName: '',
    buyerNIF: '',
    baseAmount: base ?? 0,
    vatRate: vatRate ?? 0,
    vatAmount: vat ?? 0,
    totalAmount: total ?? (base ?? 0) + (vat ?? 0),
    currency: detectCurrency(text),
    euCustomer: false,
    reverseCharge,
    euOss,
    country
  }
}

export function chooseVendor(text: string, filename?: string) {
  const hay = ((filename || '') + ' ' + text).toLowerCase()
  for (const { id, patterns } of vendorAliases as any) {
    for (const p of patterns) {
      if (hay.includes(p.toLowerCase())) return id
    }
  }
  // default fallbacks
  if (/invoice-728fd5fd/i.test(hay)) return 'openai'
  if (/invoice-a4346ac6/i.test(hay)) return 'anthropic'
  if (/202afaf2/i.test(hay)) return 'taxscouts'
  return 'generic'
}

export function parseFromText(text: string, filename?: string) {
  const vendor = chooseVendor(text, filename)
  let parsed
  switch (vendor) {
    case 'openai':
      parsed = parseOpenAI(text, filename)
      break
    case 'anthropic':
      parsed = parseAnthropic(text, filename)
      break
    case 'taxscouts':
      parsed = parseTaxScouts(text, filename)
      break
    default:
      parsed = genericParse(text, filename)
  }
  return { vendor, parsed }
}
