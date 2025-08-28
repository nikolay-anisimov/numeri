import { InvoicesService } from './invoices.service'

describe('InvoicesService', () => {
  const prismaMock = {
    invoiceIn: { create: jest.fn() },
    invoiceOut: { create: jest.fn() },
    thirdParty: { findFirst: jest.fn(), create: jest.fn(), findUnique: jest.fn() }
  } as any

  const fxMock = {
    getRateByDate: jest.fn()
  } as any

  beforeEach(() => {
    jest.resetAllMocks()
    prismaMock.thirdParty = { findFirst: jest.fn(), create: jest.fn(), findUnique: jest.fn() }
  })

  it('sets fxToEUR=1 for EUR invoices (in)', async () => {
    prismaMock.invoiceIn.create.mockResolvedValue({ id: '1', fxToEUR: 1 })
    const svc = new InvoicesService(prismaMock, fxMock)
    const res = await svc.createIn({
      issueDate: '2024-01-02',
      supplierId: 'sup',
      base: 100,
      vatRate: 21,
      vatAmount: 21,
      total: 121,
      currency: 'EUR',
      createdById: 'u1'
    } as any)
    expect(prismaMock.invoiceIn.create).toHaveBeenCalled()
    expect(res.fxToEUR).toBe(1)
  })

  it('computes fxToEUR from ECB rate for USD (out)', async () => {
    prismaMock.invoiceOut.create.mockImplementation(({ data }: any) => ({ id: '2', fxToEUR: data.fxToEUR }))
    fxMock.getRateByDate.mockResolvedValue({ rate: 1.1 }) // EUR->USD 1.1 quote per EUR
    prismaMock.thirdParty = { findUnique: jest.fn().mockResolvedValue({ id: 'cli', euVatNumber: null }) }
    const svc = new InvoicesService(prismaMock, fxMock)
    const res = await svc.createOut({
      issueDate: '2024-02-15',
      number: 'A-1',
      clientId: 'cli',
      base: 100,
      vatRate: 0,
      vatAmount: 0,
      total: 100,
      currency: 'USD',
      createdById: 'u1'
    } as any)
    expect(fxMock.getRateByDate).toHaveBeenCalledWith('2024-02-15', 'USD')
    // 1 / 1.1 = 0.909090..., rounded to 6 decimals -> 0.909091
    expect(res.fxToEUR).toBeCloseTo(0.909091, 6)
  })

  it('marks EU B2B and zero VAT when client has EU VAT', async () => {
    // Arrange mocks
    prismaMock.invoiceOut.create.mockImplementation(({ data }: any) => data)
    prismaMock.thirdParty.findUnique = jest.fn().mockResolvedValue({ id: 'cli', euVatNumber: 'PL123456789' })
    fxMock.getRateByDate.mockResolvedValue({ rate: 1.1 })
    const svc = new InvoicesService(prismaMock, fxMock)
    // Act
    const res = await svc.createOut({
      issueDate: '2024-03-10',
      number: 'A-2',
      clientId: 'cli',
      base: 100,
      vatRate: 21,
      vatAmount: 21,
      total: 121,
      currency: 'USD',
      createdById: 'u1'
    } as any)
    // Assert
    expect(res.euOperation).toBe(true)
    expect(res.vatRate).toBe(0)
    expect(res.vatAmount).toBe(0)
    expect(res.total).toBe(100)
  })

  it('creates Seguridad Social manual expense via TGSS supplier', async () => {
    // Arrange
    prismaMock.thirdParty.findFirst.mockResolvedValueOnce(null)
    prismaMock.thirdParty.create.mockResolvedValueOnce({ id: 'tgss' })
    prismaMock.invoiceIn.create.mockImplementation(({ data }: any) => data)
    const svc = new InvoicesService(prismaMock, fxMock)
    // Act
    const res = await svc.createSeguridadSocial({ issueDate: '2025-01-31', amountEUR: 300.5, createdById: 'u1' })
    // Assert
    expect(prismaMock.thirdParty.create).toHaveBeenCalled()
    expect(res.base).toBe(300.5)
    expect(res.vatRate).toBe(0)
    expect(res.vatAmount).toBe(0)
    expect(res.currency).toBe('EUR')
    expect(res.category).toBe('seguridad-social')
  })
})
