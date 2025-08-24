import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'
import { calcModelo303BaseAndVat, exportAeatCsv, type BookEntry, build349Lines, calc130Ytd, calc303 } from '@packages/utils'

@ApiTags('taxes')
@Controller('taxes')
export class TaxesController {
  constructor(private prisma: PrismaService) {}

  @Get('303')
  async modelo303(@Query('from') from: string, @Query('to') to: string) {
    const start = new Date(from)
    const end = new Date(to)
    const inRows = await this.prisma.invoiceIn.findMany({
      where: { issueDate: { gte: start, lte: end } },
      select: { issueDate: true, base: true, vatRate: true, vatAmount: true, assetFlag: true }
    })
    const outRows = await this.prisma.invoiceOut.findMany({
      where: { issueDate: { gte: start, lte: end } },
      select: { issueDate: true, base: true, vatRate: true, vatAmount: true }
    })
    const entries = [
      ...outRows.map((r: any) => ({ type: 'INGRESO' as const, base: Number(r.base), vatRate: Number(r.vatRate), vatAmount: Number(r.vatAmount) })),
      ...inRows.map((r: any) => ({ type: 'GASTO' as const, base: Number(r.base), vatRate: Number(r.vatRate), vatAmount: Number(r.vatAmount), asset: Boolean(r.assetFlag) }))
    ]
    return calc303(entries)
  }

  @Get('349')
  async modelo349(@Query('from') from: string, @Query('to') to: string) {
    const start = new Date(from)
    const end = new Date(to)
    const outRows = await this.prisma.invoiceOut.findMany({
      where: { issueDate: { gte: start, lte: end }, euOperation: true },
      include: { client: true }
    })
    const periodLabel = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
    const lines = build349Lines(
      outRows.map((r: any) => ({
        date: r.issueDate.toISOString().slice(0, 10),
        partnerVat: r.client?.euVatNumber ?? null,
        partnerName: r.client?.name ?? null,
        base: Number(r.base),
        currency: r.currency,
        fxToEUR: Number(r.fxToEUR),
        euOperation: Boolean(r.euOperation),
        clave: 'S'
      })),
      { periodLabel }
    )
    return lines
  }

  @Get('130')
  async modelo130(@Query('from') from: string, @Query('to') to: string) {
    const start = new Date(from)
    const end = new Date(to)
    const purchases = await this.prisma.invoiceIn.findMany({
      where: { issueDate: { gte: start, lte: end } }
    })
    const sales = await this.prisma.invoiceOut.findMany({
      where: { issueDate: { gte: start, lte: end } }
    })
    const basePurch = purchases.reduce((a: number, r: any) => a + Number(r.base), 0)
    const baseSales = sales.reduce((a: number, r: any) => a + Number(r.base), 0)
    const res = calc130Ytd({ grossIncomeYtd: baseSales, deductibleExpensesYtd: basePurch })
    return { ytd: res }
  }

  @Get('aeat-books.csv')
  async aeatCsv(@Query('from') from: string, @Query('to') to: string) {
    const start = new Date(from)
    const end = new Date(to)
    const outRows = await this.prisma.invoiceOut.findMany({ where: { issueDate: { gte: start, lte: end } } })
    const inRows = await this.prisma.invoiceIn.findMany({ where: { issueDate: { gte: start, lte: end } } })
    const rows: BookEntry[] = [
      ...outRows.map((r: any) => ({
        date: r.issueDate.toISOString().slice(0, 10),
        type: 'INGRESO' as const,
        base: Number(r.base),
        vatRate: Number(r.vatRate),
        vatAmount: Number(r.vatAmount),
        total: Number(r.total)
      })),
      ...inRows.map((r: any) => ({
        date: r.issueDate.toISOString().slice(0, 10),
        type: 'GASTO' as const,
        base: Number(r.base),
        vatRate: Number(r.vatRate),
        vatAmount: Number(r.vatAmount),
        total: Number(r.total)
      }))
    ]
    const csv = exportAeatCsv(rows)
    return csv
  }
}
