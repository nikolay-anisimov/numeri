import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { buildLibroWorkbook } from '../src/aeat-libro-xlsx'
import type { BookEntry } from '../src/aeat'

describe('aeat-libro-xlsx writer', () => {
  it('creates workbook with correct sheets and headers', () => {
    const expedidas: BookEntry[] = [
      {
        date: '2025-02-15',
        type: 'INGRESO',
        series: 'F-2025',
        number: '0002',
        thirdPartyName: 'Cliente Sp. z o.o.',
        thirdPartyNif: 'PL1234567890',
        base: 1000,
        vatRate: 0,
        vatAmount: 0,
        total: 1000,
        description: 'Servicio B2B UE'
      }
    ]
    const recibidas: BookEntry[] = [
      {
        date: '2025-01-10',
        type: 'GASTO',
        series: 'S-2025',
        number: 'A-001',
        thirdPartyName: 'Proveedor SA',
        thirdPartyNif: 'B12345678',
        base: 100,
        vatRate: 21,
        vatAmount: 21,
        total: 121,
        description: 'Software'
      }
    ]

    const wb = buildLibroWorkbook(expedidas, recibidas)
    expect(wb.SheetNames).toContain('EXPEDIDAS_INGRESOS')
    expect(wb.SheetNames).toContain('RECIBIDAS_GASTOS')

    const wsExp = wb.Sheets['EXPEDIDAS_INGRESOS']
    const wsRec = wb.Sheets['RECIBIDAS_GASTOS']
    const rowsExp: any[][] = XLSX.utils.sheet_to_json(wsExp, { header: 1 }) as any
    const rowsRec: any[][] = XLSX.utils.sheet_to_json(wsRec, { header: 1 }) as any

    expect(rowsExp[0]).toEqual([
      'Fecha',
      'FechaOperacion',
      'Serie',
      'Numero',
      'NIFDestinatario',
      'NombreDestinatario',
      'Base0',
      'Cuota0',
      'Base4',
      'Cuota4',
      'Base10',
      'Cuota10',
      'Base21',
      'Cuota21',
      'Total',
      'Descripcion',
      'ClaveOperacion',
      'Moneda'
    ])
    expect(rowsRec[0]).toEqual([
      'Fecha',
      'FechaOperacion',
      'Serie',
      'Numero',
      'NIFProveedor',
      'NombreProveedor',
      'Base0',
      'Cuota0',
      'Base4',
      'Cuota4',
      'Base10',
      'Cuota10',
      'Base21',
      'Cuota21',
      'Total',
      'BienInversion',
      'Descripcion',
      'Moneda'
    ])

    // Check a couple of data cells exist in the first data row
    expect(rowsExp[1][0]).toBeTruthy() // Fecha
    expect(rowsExp[1][14]).toBe(1000) // Total
    expect(rowsRec[1][14]).toBe(121) // Total
  })
})
