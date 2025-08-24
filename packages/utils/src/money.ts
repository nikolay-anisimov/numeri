export function roundMoney(n: number, decimals = 2): number {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

export function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((a, b) => a + b, 0))
}

