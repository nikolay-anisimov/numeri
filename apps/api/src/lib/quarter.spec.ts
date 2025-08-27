import { buildQuarterFromDocs } from './quarter'

describe('quarter lib', () => {
  it('maps docs to unified rows and computes 303/349', () => {
    const outDocs = [
      {
        issueDate: '2025-02-15',
        number: '0002',
        client: { name: 'Cliente Test SL', euVatNumber: 'PL123' },
        base: 1000,
        vatRate: 0,
        vatAmount: 0,
        total: 1000,
        currency: 'EUR',
        fxToEUR: 1,
        euOperation: true
      }
    ]
    const inDocs = [
      {
        issueDate: '2025-01-10',
        supplier: { name: 'Proveedor SA', nif: 'B123' },
        base: 100,
        vatRate: 21,
        vatAmount: 21,
        total: 121,
        currency: 'EUR',
        fxToEUR: 1,
        deductible: true
      }
    ]
    const { expRows, recRows, res303, lines349 } = buildQuarterFromDocs(outDocs as any, inDocs as any)
    expect(expRows.length).toBe(1)
    expect(recRows.length).toBe(1)
    expect(res303).toBeTruthy()
    expect(lines349.length).toBeGreaterThanOrEqual(1)
  })
})

