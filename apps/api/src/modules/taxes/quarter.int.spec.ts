import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { QuarterService } from './quarter.service'

describe('QuarterService integration-ish (mocked Prisma)', () => {
  const prismaMock: any = {
    invoiceOut: { findMany: jest.fn() },
    invoiceIn: { findMany: jest.fn() }
  }
  const svc = new QuarterService(prismaMock)

  beforeEach(() => jest.resetAllMocks())

  it('creates unified XLSX and guide for a quarter', async () => {
    const year = 2025
    const quarter = 1 as const
    const outRows = [
      {
        issueDate: new Date('2025-01-15'),
        series: 'F-2025',
        number: '0001',
        client: { name: 'Cliente UE', nif: 'PL123', euVatNumber: 'PL123', countryCode: 'PL' },
        base: 1000,
        vatRate: 0,
        vatAmount: 0,
        total: 1000,
        currency: 'EUR',
        fxToEUR: 1,
        euOperation: true,
        codeTipoFactura: 'F1',
        codeConceptoIngreso: 'I01',
        codeClaveOperacion: '01'
      }
    ]
    const inRows = [
      {
        issueDate: new Date('2025-02-10'),
        supplier: { name: 'Proveedor SA', nif: 'B123', euVatNumber: null, countryCode: 'ES' },
        base: 100,
        vatRate: 21,
        vatAmount: 21,
        total: 121,
        currency: 'EUR',
        fxToEUR: 1,
        assetFlag: false,
        deductible: true,
        codeTipoFactura: 'F1',
        codeConceptoGasto: 'G45',
        codeClaveOperacion: '01'
      }
    ]
    prismaMock.invoiceOut.findMany.mockResolvedValue(outRows)
    prismaMock.invoiceIn.findMany.mockResolvedValue(inRows)

    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qclose-'))
    const res = await svc.closeQuarter({ year, quarter, nif: 'Z1664779K', name: 'NIKOLAI ANISIMOV', outDir })
    expect(fs.existsSync(res.xlsxPath)).toBe(true)
    expect(fs.existsSync(res.guidePath)).toBe(true)
    const guide = fs.readFileSync(res.guidePath, 'utf8')
    expect(guide).toContain(`Cierre ${year} T${quarter}`)
    expect(guide).toContain('Modelo 303')
    expect(guide).toContain('Modelo 130')
  })
})

