import { describe, it, expect } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as XLSX from 'xlsx'
import { writeLibroFromTemplate } from '../src/aeat-libro-xlsx'

describe('aeat-libro-xlsx template writer', () => {
  it('writes data after header rows into unified sheets', () => {
    const template = path.resolve(__dirname, '../../../docs/AEAT/Ejemplo_2_1T_2023.xlsx')
    const tmp = path.join(os.tmpdir(), `libro-test-${Date.now()}.xlsx`)

    const expRow: any[] = new Array(36).fill('')
    expRow[0] = 2025 // Ejercicio
    expRow[1] = '1T' // Periodo
    expRow[10] = 'SERIE-X' // Serie
    expRow[11] = '0001' // Numero
    expRow[16] = 'CLIENTE TEST SL' // Nombre Destinatario
    expRow[20] = 1000 // Total Factura
    expRow[21] = 1000 // Base Imponible
    expRow[22] = 0 // Tipo de IVA
    expRow[23] = 0 // Cuota IVA Repercutida

    const recRow: any[] = new Array(40).fill('')
    recRow[0] = 2025
    recRow[1] = '1T'
    recRow[10] = 'S-0001' // Serie-Numero
    recRow[18] = 'PROVEEDOR SA' // Expedidor nombre
    recRow[24] = 121 // Total Factura
    recRow[25] = 100 // Base Imponible
    recRow[26] = 21 // Tipo IVA
    recRow[27] = 21 // Cuota soportada
    recRow[28] = 21 // Deducible (igual a soportada en ejemplo)

    writeLibroFromTemplate(template, tmp, [expRow], [recRow])
    expect(fs.existsSync(tmp)).toBe(true)

    const wb = XLSX.readFile(tmp, { cellDates: true })
    expect(wb.SheetNames).toContain('EXPEDIDAS_INGRESOS')
    expect(wb.SheetNames).toContain('RECIBIDAS_GASTOS')

    const wsExp = wb.Sheets['EXPEDIDAS_INGRESOS']
    const wsRec = wb.Sheets['RECIBIDAS_GASTOS']
    const rowsExp: any[][] = XLSX.utils.sheet_to_json(wsExp, { header: 1, defval: '' }) as any
    const rowsRec: any[][] = XLSX.utils.sheet_to_json(wsRec, { header: 1, defval: '' }) as any

    // Our rows should be present somewhere after headers
    const expHas = rowsExp.some((r, i) => i >= 2 && r.includes('CLIENTE TEST SL') && r.includes('SERIE-X'))
    const recHas = rowsRec.some((r, i) => i >= 2 && r.includes('PROVEEDOR SA') && r.includes('S-0001'))
    expect(expHas).toBe(true)
    expect(recHas).toBe(true)

    // Cleanup
    fs.unlinkSync(tmp)
  })
})
