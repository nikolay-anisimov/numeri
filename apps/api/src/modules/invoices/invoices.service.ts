import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { FxService } from '../fx/fx.service'
import { round2 } from '@packages/utils'
import { validateCodesForIn, validateCodesForOut } from '../../lib/aeat-spec'

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
    codeTipoFactura?: string
    codeConceptoGasto?: string
    codeClaveOperacion?: string
    createdById: string
  }) {
    // Validate AEAT codes if present
    try {
      validateCodesForIn(body)
    } catch (e) {
      throw e
    }
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
    codeTipoFactura?: string
    codeConceptoIngreso?: string
    codeClaveOperacion?: string
    codeCalificacionOp?: string
    codeExencion?: string
    createdById: string
  }) {
    const fxToEUR = await this.computeFxToEUR(body.issueDate, body.currency, body.fxToEUR)
    try {
      validateCodesForOut(body)
    } catch (e) {
      throw e
    }
    // EU B2B rule of thumb (services): if client has EU VAT, mark as EU operation and set VAT 0
    const client = await this.prisma.thirdParty.findUnique({ where: { id: body.clientId } })
    let vatRate = body.vatRate
    let vatAmount = body.vatAmount
    let total = body.total
    let euOperation = body.euOperation ?? false
    if (client?.euVatNumber && client.euVatNumber.trim().length > 0) {
      euOperation = true
      vatRate = 0
      vatAmount = 0
      total = body.base // base equals total when no VAT
    }
    return this.prisma.invoiceOut.create({
      data: {
        ...body,
        vatRate,
        vatAmount,
        total,
        euOperation,
        fxToEUR,
        issueDate: new Date(body.issueDate)
      }
    })
  }

  private incrementNumberStr(input?: string): string | undefined {
    if (!input) return input
    const m = input.match(/(.*?)(\d+)$/)
    if (!m) return input
    const prefix = m[1]
    const digits = m[2]
    const next = String(Number(digits) + 1).padStart(digits.length, '0')
    return prefix + next
  }

  private addOneMonthSameDay(date: Date): Date {
    const d = new Date(date)
    const day = d.getDate()
    d.setMonth(d.getMonth() + 1)
    // adjust if month rolled over
    if (d.getDate() !== day) {
      d.setDate(0) // last day of previous month
    }
    return d
  }

  async emitFromLast(body: {
    createdById: string
    clientId?: string
    base?: number
    issueDate?: string
    codeTipoFactura?: string
    codeConceptoIngreso?: string
    codeClaveOperacion?: string
    codeCalificacionOp?: string
    codeExencion?: string
  }) {
    // Find last invoice (optionally for given client)
    const where = body.clientId ? { clientId: body.clientId } : {}
    const last = await this.prisma.invoiceOut.findFirst({ where, orderBy: { issueDate: 'desc' } })
    if (!last) throw new Error('No previous invoice to copy from')
    const clientId = body.clientId ?? last.clientId
    const client = await this.prisma.thirdParty.findUnique({ where: { id: clientId } })
    const euVat = client?.euVatNumber?.trim()
    const series = last.series ?? undefined
    const number = this.incrementNumberStr(last.number) || last.number
    const base = body.base != null ? body.base : Number(last.base)
    // VAT per EU rule or copy last
    let vatRate = euVat ? 0 : Number(last.vatRate)
    let vatAmount = euVat ? 0 : round2(base * (Number(last.vatRate) / 100))
    const total = round2(base + vatAmount)
    const issueDate = body.issueDate ? new Date(body.issueDate) : this.addOneMonthSameDay(last.issueDate)
    const currency = last.currency

    return this.createOut({
      issueDate: issueDate.toISOString().slice(0, 10),
      series,
      number,
      clientId,
      base,
      vatRate,
      vatAmount,
      total,
      currency,
      notes: last.notes ?? undefined,
      euOperation: !!euVat,
      codeTipoFactura: body.codeTipoFactura,
      codeConceptoIngreso: body.codeConceptoIngreso,
      codeClaveOperacion: body.codeClaveOperacion,
      codeCalificacionOp: body.codeCalificacionOp,
      codeExencion: body.codeExencion,
      createdById: body.createdById
    })
  }

  private async getOrCreateTGSS() {
    const existing = await this.prisma.thirdParty.findFirst({ where: { type: 'SUPPLIER', nif: 'Q2810001D' } })
    if (existing) return existing
    return this.prisma.thirdParty.create({
      data: { type: 'SUPPLIER', name: 'TESORERIA GENERAL DE LA SEGURIDAD SOCIAL', nif: 'Q2810001D', countryCode: 'ES' }
    })
  }

  async createSeguridadSocial(input: { issueDate: string; amountEUR: number; createdById: string; codeConceptoGasto?: string }) {
    const tgss = await this.getOrCreateTGSS()
    const amount = round2(input.amountEUR)
    return this.createIn({
      issueDate: input.issueDate,
      supplierId: tgss.id,
      base: amount,
      vatRate: 0,
      vatAmount: 0,
      total: amount,
      currency: 'EUR',
      deductible: true,
      category: 'seguridad-social',
      assetFlag: false,
      notes: 'Cuota Seguridad Social',
      codeConceptoGasto: input.codeConceptoGasto || 'G45',
      createdById: input.createdById
    })
  }
}
