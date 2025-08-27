import { describe, it, expect } from 'vitest'
import {
  mapInvoiceOutToUnifiedRow,
  mapInvoiceInToUnifiedRow,
  build303Entries,
  build349Inputs
} from '../src/mappers'

describe('mappers', () => {
  it('maps InvoiceOut to unified EXPEDIDAS_INGRESOS row', () => {
    const row = mapInvoiceOutToUnifiedRow({
      issueDate: '2025-02-15',
      series: 'F-2025',
      number: '0002',
      client: { name: 'Cliente Test SL', euVatNumber: 'PL123' },
      base: 1000,
      vatRate: 0,
      vatAmount: 0,
      total: 1000,
      currency: 'EUR',
      fxToEUR: 1,
      euOperation: true
    })
    expect(row[0]).toBe(2025)
    expect(row[1]).toBe('1T')
    expect(row[10]).toBe('F-2025')
    expect(row[11]).toBe('0002')
    expect(row[16]).toBe('Cliente Test SL')
    expect(row[20]).toBe(1000)
    expect(row[21]).toBe(1000)
    expect(row[22]).toBe(0)
    expect(row[23]).toBe(0)
  })

  it('maps InvoiceIn to unified RECIBIDAS_GASTOS row', () => {
    const row = mapInvoiceInToUnifiedRow({
      issueDate: '2025-01-10',
      supplier: { name: 'Proveedor SA', nif: 'B123' },
      base: 100,
      vatRate: 21,
      vatAmount: 21,
      total: 121,
      currency: 'EUR',
      fxToEUR: 1,
      deductible: true
    })
    expect(row[0]).toBe(2025)
    expect(row[1]).toBe('1T')
    expect(row[18]).toBe('Proveedor SA')
    expect(row[24]).toBe(121)
    expect(row[25]).toBe(100)
    expect(row[26]).toBe(21)
    expect(row[27]).toBe(21)
    expect(row[28]).toBe(21)
  })

  it('builds 303 entries and 349 inputs', () => {
    const outs = [
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
    const ins = [
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
    const e303 = build303Entries(outs as any, ins as any)
    expect(e303.find((e) => e.type === 'INGRESO')?.base).toBe(1000)
    expect(e303.find((e) => e.type === 'GASTO')?.vatAmount).toBe(21)

    const l349 = build349Inputs(outs as any)
    expect(l349[0].partnerVat).toBe('PL123')
    expect(l349[0].clave).toBe('S')
  })
})

