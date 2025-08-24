import { describe, it, expect } from 'vitest'
import { buildRegistry, detectKind, extractModel, extractInvoiceNo, inferQuarterFromPath, inferYearFromPath, toEntry } from '../src/testdata'
import fs from 'node:fs'
import path from 'node:path'

const TD_ABS = path.resolve(process.cwd(), '../../testdata')
const TD_REL = path.relative(process.cwd(), TD_ABS).replace(/\\/g, '/')

describe('testdata parser', () => {
  it('infers year and quarter from paths', () => {
    expect(inferYearFromPath('testdata/2025/trimestre-1/facturas/F-0001-2025.pdf')).toBe(2025)
    expect(inferQuarterFromPath('testdata/2025/trimestre-1/facturas/F-0001-2025.pdf')).toBe(1)
    expect(inferQuarterFromPath('testdata/2024/trimestre-4/gastos/soft/OpenAI_Invoice-728FD5FD-0018.pdf')).toBe(4)
  })

  it('detects kinds', () => {
    expect(detectKind('testdata/2025/trimestre-1/facturas/F-0002-2025.pdf')).toBe('factura-emitida')
    expect(detectKind('testdata/2025/trimestre-1/gastos/soft/OpenAI-Invoice-728FD5FD-0019.pdf')).toBe('gasto-soft')
    expect(detectKind('testdata/2025/trimestre-2/gastos/taxcouts/Invoice-202AFAF2-152702.pdf')).toBe('gasto-taxscouts')
    expect(detectKind('testdata/2024/trimestre-2/Libro-T2-2024-Nikolai Anisimov.xlsx')).toBe('libro')
    expect(detectKind('testdata/2025/trimestre-2/renta/mod+303+2ºt+2025+nik.pdf')).toBe('renta-modelo')
    expect(detectKind('testdata/2024/trimestre-3/renta/borradores/borrador+mod+303+NIKOLAI.pdf')).toBe('renta-borrador')
    expect(detectKind('testdata/2024/resumen anual/mod+390+2024+nikolai.pdf')).toBe('resumen-anual')
  })

  it('extracts invoice number and model', () => {
    expect(extractInvoiceNo('F-0003-2024.pdf')).toBe('F-0003-2024')
    expect(extractModel('testdata/2025/trimestre-2/renta/mod+130+2ºt+2025+nik.pdf')).toBe('130')
    expect(extractModel('testdata/2024/resumen anual/mod+390+2024+nikolai.pdf')).toBe('390')
  })

  it('builds entries with required fields', () => {
    const e = toEntry('testdata/2025/trimestre-1/facturas/F-0001-2025.pdf')!
    expect(e.year).toBe(2025)
    expect(e.quarter).toBe(1)
    expect(e.kind).toBe('factura-emitida')
    expect(e.invoiceNo).toBe('F-0001-2025')
  })

  it('builds registry from file list', () => {
    // scan current repo testdata
    const files: string[] = []
    const walk = (dir: string) => {
      for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name)
        const st = fs.statSync(p)
        if (st.isDirectory()) walk(p)
        else files.push(p)
      }
    }
    if (fs.existsSync(TD_ABS)) walk(TD_ABS)
    const filesRel = files.map((p) => path.relative(process.cwd(), p).replace(/\\/g, '/'))
    const reg = buildRegistry(TD_REL, filesRel)
    expect(reg.summary.total).toBeGreaterThan(0)
    // Ensure 2025 entries exist and are grouped
    const y2025 = reg.years.find((y) => y.year === 2025)
    expect(y2025).toBeTruthy()
    expect((y2025?.entries.length ?? 0)).toBeGreaterThan(0)
  })
})
