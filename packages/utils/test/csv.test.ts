import { parseCsv, toCsv } from '../src/csv'

describe('csv utils', () => {
  it('roundtrips simple CSV', () => {
    const rows = [
      ['Fecha', 'Tipo', 'Base'],
      ['2025-07-01', 'INGRESO', '100,00'],
      ['2025-07-02', 'GASTO', '50']
    ]
    const csv = toCsv(rows)
    const parsed = parseCsv(csv)
    expect(parsed).toEqual(rows)
  })

  it('parses quotes and commas', () => {
    const csv = 'A,B,C\n"x, y",z,"hello\nworld"\n'
    const rows = parseCsv(csv)
    expect(rows[1][0]).toBe('x, y')
    expect(rows[1][2]).toBe('hello\nworld')
  })
})

