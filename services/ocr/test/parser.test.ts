import { describe, it, expect } from 'vitest'
import { cleanText, parseFromText } from '../src/parser'

describe('OCR parser for gastos', () => {
  it('parses OpenAI invoice', () => {
    const filename = 'OpenAI Invoice-728FD5FD-0024.pdf'
    const raw = `Invoice # 728FD5FD-0024\nDate: 2025-06-20\nSubtotal 100.00\nVAT 21% 21.00\nTotal 121.00\n`
    const { vendor, parsed } = parseFromText(cleanText(raw), filename)
    expect(vendor).toBe('openai')
    expect(parsed.invoiceNumber).toContain('728FD5FD-0024')
    expect(parsed.baseAmount).toBe(100)
    expect(parsed.vatRate).toBe(21)
    expect(parsed.totalAmount).toBe(121)
  })

  it('parses Anthropic invoice', () => {
    const filename = 'Anthropic_Invoice-A4346AC6-0006.pdf'
    const raw = `Invoice A4346AC6-0006\nDate 15/03/2025\nSubtotal 200,00\nVAT 21% 42,00\nTotal 242,00\n`
    const { vendor, parsed } = parseFromText(cleanText(raw), filename)
    expect(vendor).toBe('anthropic')
    expect(parsed.invoiceNumber).toContain('A4346AC6-0006')
    expect(parsed.baseAmount).toBe(200)
    expect(parsed.vatAmount).toBe(42)
    expect(parsed.totalAmount).toBe(242)
  })

  it('parses TaxScouts invoice (ES labels)', () => {
    const filename = 'Invoice-202AFAF2-121376.pdf'
    const raw = `Factura Nº 121376\nFecha: 2025-01-10\nBase imponible 50,00\nIVA 21% 10,50\nTotal 60,50\n`
    const { vendor, parsed } = parseFromText(cleanText(raw), filename)
    expect(vendor).toBe('taxscouts')
    expect(parsed.baseAmount).toBe(50)
    expect(parsed.vatRate).toBe(21)
    expect(parsed.totalAmount).toBeCloseTo(60.5)
  })

  it('falls back to generic parser', () => {
    const filename = 'unknown_vendor_invoice.pdf'
    const raw = `Factura Nº ABC-1234\nFecha: 2025-05-05\nBase 80,00\nIVA 0% 0,00\nTotal 80,00\n`
    const { vendor, parsed } = parseFromText(cleanText(raw), filename)
    expect(vendor).toBe('generic')
    expect(parsed.invoiceNumber).toBe('ABC-1234')
    expect(parsed.baseAmount).toBe(80)
    expect(parsed.vatAmount).toBe(0)
    expect(parsed.totalAmount).toBe(80)
  })
})

