import { FxService } from './fx.service'

describe('FxService', () => {
  it('upserts a valid EUR→USD rate by date', async () => {
    const mock = {
      fxRate: {
        upsert: jest.fn().mockResolvedValue({ id: 'x', date: new Date('2024-01-02'), base: 'EUR', quote: 'USD', rate: 1.1 })
      }
    } as any
    const svc = new FxService(mock)
    const res = await svc.upsertRate({ date: '2024-01-02', quote: 'USD', rate: 1.1 })
    expect(mock.fxRate.upsert).toHaveBeenCalled()
    expect(res.rate).toBe(1.1)
  })

  it('rejects invalid rate', async () => {
    const mock = { fxRate: { upsert: jest.fn() } } as any
    const svc = new FxService(mock)
    await expect(svc.upsertRate({ date: '2024-01-02', quote: 'USD', rate: 0 })).rejects.toThrow('Invalid rate')
  })
})
