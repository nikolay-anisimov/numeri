export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function parseIsoDate(s: string): Date {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date')
  return d
}

