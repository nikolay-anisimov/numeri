import { build349Lines, calc130Ytd } from '../src/tax'

describe('tax utils', () => {
  it('builds 349 aggregated lines in EUR with clave S', () => {
    const lines = build349Lines(
      [
        { date: '2025-07-01', partnerVat: 'PL123', partnerName: 'Client PL', base: 100, currency: 'USD', fxToEUR: 0.9, euOperation: true },
        { date: '2025-07-15', partnerVat: 'PL123', partnerName: 'Client PL', base: 200, currency: 'EUR', fxToEUR: 1, euOperation: true }
      ],
      { periodLabel: '2025-07' }
    )
    // 100 USD * 0.9 = 90 EUR, + 200 EUR = 290
    expect(lines).toHaveLength(1)
    expect(lines[0].partnerVat).toBe('PL123')
    expect(lines[0].base_eur).toBe(290)
    expect(lines[0].clave).toBe('S')
  })

  it('calc130Ytd computes basic casillas', () => {
    const res = calc130Ytd({ grossIncomeYtd: 10000, deductibleExpensesYtd: 2000, prevTrNegativesYtd: 500 })
    expect(res.c01).toBe(10000)
    expect(res.c02).toBe(2000)
    expect(res.c03).toBe(8000)
    // 20% of 8000 = 1600; minus 500 prev negatives = 1100
    expect(res.c17).toBe(1100)
  })
})

