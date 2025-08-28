import { InvoicesService } from './invoices.service'

describe('InvoicesService validation', () => {
  const prismaMock: any = { invoiceIn: { create: jest.fn() }, invoiceOut: { create: jest.fn() }, thirdParty: { findUnique: jest.fn() } }
  const fxMock: any = { getRateByDate: jest.fn().mockResolvedValue({ rate: 1.1 }) }

  beforeEach(() => jest.resetAllMocks())

  it('rejects invalid Concepto de Gasto code', async () => {
    prismaMock.invoiceIn.create.mockResolvedValue({ id: 'x' })
    const svc = new InvoicesService(prismaMock, fxMock)
    await expect(
      svc.createIn({
        issueDate: '2025-01-10',
        supplierId: 'sup',
        base: 100,
        vatRate: 21,
        vatAmount: 21,
        total: 121,
        currency: 'EUR',
        codeConceptoGasto: 'GXX',
        createdById: 'u1'
      } as any)
    ).rejects.toThrow(/AEAT code not allowed/)
  })

  it('accepts GY4 (group) per LSI for Concepto de Gasto', async () => {
    prismaMock.invoiceIn.create.mockResolvedValue({ id: 'y' })
    const svc = new InvoicesService(prismaMock, fxMock)
    await expect(
      svc.createIn({
        issueDate: '2025-01-10',
        supplierId: 'sup',
        base: 100,
        vatRate: 21,
        vatAmount: 21,
        total: 121,
        currency: 'EUR',
        codeConceptoGasto: 'GY4',
        createdById: 'u1'
      } as any)
    ).resolves.toBeTruthy()
  })

  it('rejects invalid currency and totals', async () => {
    const svc = new InvoicesService(prismaMock, fxMock)
    await expect(
      svc.createOut({
        issueDate: '2025-02-15',
        number: 'A-1',
        clientId: 'c1',
        base: 100,
        vatRate: 0,
        vatAmount: 0,
        total: 120, // wrong
        currency: 'EURO',
        createdById: 'u1'
      } as any)
    ).rejects.toThrow()
  })
})

