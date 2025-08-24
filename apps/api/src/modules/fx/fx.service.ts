import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FxService {
  constructor(private prisma: PrismaService) {}

  async upsertRate(input: { date: string | Date; quote: string; rate: number; base?: string }) {
    const date = typeof input.date === 'string' ? new Date(input.date) : input.date
    const base = input.base ?? 'EUR'
    if (!date || Number.isNaN(date.getTime())) throw new Error('Invalid date')
    if (!input.quote) throw new Error('Missing quote')
    if (!Number.isFinite(input.rate) || input.rate <= 0) throw new Error('Invalid rate')
    return (this.prisma as any).fxRate.upsert({
      where: { date_base_quote: { date, base, quote: input.quote } },
      update: { rate: input.rate },
      create: { date, base, quote: input.quote, rate: input.rate }
    })
  }

  async getRateByDate(date: string | Date, quote: string) {
    const d = typeof date === 'string' ? new Date(date) : date
    return this.prisma.fxRate.findFirst({ where: { date: d, quote } })
  }
}
