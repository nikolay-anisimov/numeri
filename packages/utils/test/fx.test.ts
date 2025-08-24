import { convertToEur, round2 } from '../src/fx'

describe('fx utils', () => {
  it('converts USD to EUR', () => {
    const eur = convertToEur(110, 'USD', { USD: 1.1 })
    expect(eur).toBe(100)
  })
  it('round2 works', () => {
    expect(round2(1.005)).toBe(1.01)
  })
})

