import { InvoicesService } from './invoices.service'

describe('InvoicesService.emitFromLast', () => {
  const prisma: any = {
    invoiceOut: {
      findFirst: jest.fn(),
      create: jest.fn()
    },
    thirdParty: { findUnique: jest.fn() }
  }
  const fx: any = { getRateByDate: jest.fn() }

  beforeEach(() => jest.resetAllMocks())

  it('copies last invoice, increments number and month, applies EU VAT 0 when client has EU VAT', async () => {
    prisma.invoiceOut.findFirst.mockResolvedValue({
      id: 'prev',
      issueDate: new Date('2025-06-30'),
      series: 'A',
      number: 'A-001',
      clientId: 'cli',
      base: 100,
      vatRate: 21,
      vatAmount: 21,
      total: 121,
      currency: 'USD',
      notes: null
    })
    prisma.thirdParty.findUnique.mockResolvedValue({ id: 'cli', euVatNumber: 'PL123' })
    prisma.invoiceOut.create.mockImplementation(({ data }: any) => data)
    fx.getRateByDate.mockResolvedValue({ rate: 1.1 })
    const svc = new InvoicesService(prisma, fx)
    const res = await svc.emitFromLast({ createdById: 'u1' })
    expect(res.number).toBe('A-002')
    const dateStr = (res.issueDate instanceof Date ? res.issueDate.toISOString() : String(res.issueDate)).slice(0, 10)
    expect(dateStr).toBe('2025-07-30')
    expect(res.vatRate).toBe(0)
    expect(res.total).toBe(100)
  })
})
