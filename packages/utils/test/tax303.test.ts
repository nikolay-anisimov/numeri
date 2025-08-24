import { calc303, Tax303Entry } from '../src/tax303'

describe('calc303', () => {
  it('sums devengado per type and deducible split', () => {
    const entries: Tax303Entry[] = [
      { type: 'INGRESO', base: 100, vatRate: 21, vatAmount: 21 },
      { type: 'INGRESO', base: 50, vatRate: 10, vatAmount: 5 },
      { type: 'GASTO', base: 40, vatRate: 21, vatAmount: 8.4 },
      { type: 'GASTO', base: 200, vatRate: 21, vatAmount: 42, asset: true }
    ]
    const res = calc303(entries)
    expect(res.devengadoByType['21'].base).toBe(100)
    expect(res.devengadoByType['21'].cuota).toBe(21)
    expect(res.devengadoByType['10'].base).toBe(50)
    expect(res.devengadoByType['10'].cuota).toBe(5)
    expect(res.deducibleCorriente.cuota).toBe(8.4)
    expect(res.deducibleBienesInversion.cuota).toBe(42)
    // resultado71 = (21+5) - (8.4+42) = -24.4 → round2 keeps -24.4
    expect(res.resultado71).toBe(-24.4)
  })
})

