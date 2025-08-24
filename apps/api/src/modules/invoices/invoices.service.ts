import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { FxService } from '../fx/fx.service'

function round6(n: number) {
  return Math.round(n * 1_000_000) / 1_000_000
}

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService, private fx: FxService) {}

  private async computeFxToEUR(issueDate: string, currency: string, provided?: number) {
    if (currency === 'EUR') return 1
    if (provided && provided > 0) return round6(provided)
    const rate = await this.fx.getRateByDate(issueDate, currency)
    if (!rate) throw new BadRequestException(`Missing FX rate for ${currency} on ${issueDate}`)
    // rate is quote per EUR; fxToEUR (EUR per 1 unit of quote) = 1 / rate
    return round6(1 / Number((rate as any).rate))
  }

  async createIn(body: {
    issueDate: string
    supplierId: string
    base: number
    vatRate: number
    vatAmount: number
    total: number
    currency: string
    fxToEUR?: number
    deductible?: boolean
    category?: string
    assetFlag?: boolean
    notes?: string
    euOperation?: boolean
    createdById: string
  }) {
    const fxToEUR = await this.computeFxToEUR(body.issueDate, body.currency, body.fxToEUR)
    return this.prisma.invoiceIn.create({ data: { ...body, fxToEUR, issueDate: new Date(body.issueDate) } })
  }

  async createOut(body: {
    issueDate: string
    series?: string
    number: string
    clientId: string
    base: number
    vatRate: number
    vatAmount: number
    total: number
    currency: string
    fxToEUR?: number
    notes?: string
    euOperation?: boolean
    createdById: string
  }) {
    const fxToEUR = await this.computeFxToEUR(body.issueDate, body.currency, body.fxToEUR)
    return this.prisma.invoiceOut.create({ data: { ...body, fxToEUR, issueDate: new Date(body.issueDate) } })
  }
}

