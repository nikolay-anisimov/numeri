import { createSimplePdf, createInvoicePdf } from './pdf-basic'

describe('pdf-basic', () => {
  it('creates a minimal PDF buffer', () => {
    const buf = createSimplePdf('Test PDF', ['Hello, world'])
    const s = buf.toString('ascii')
    expect(s.startsWith('%PDF-1.4')).toBe(true)
    expect(s.includes('Helvetica')).toBe(true)
    expect(s.includes('(Test PDF)')).toBe(true)
  })

  it('creates invoice pdf with fields', () => {
    const buf = createInvoicePdf({ title: 'Factura A-001', fields: [['Base', '100.00'], ['Total', '121.00']] })
    const s = buf.toString('ascii')
    expect(s.includes('(Factura A-001)')).toBe(true)
    expect(s.includes('(Base: 100.00)')).toBe(true)
  })
})

