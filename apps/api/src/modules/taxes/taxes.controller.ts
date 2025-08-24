import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'
import { calcModelo303BaseAndVat, exportAeatCsv, type BookEntry } from '@packages/utils'

@ApiTags('taxes')
@Controller('taxes')
export class TaxesController {
  constructor(private prisma: PrismaService) {}

  @Get('303')
  async modelo303(@Query('from') from: string, @Query('to') to: string) {
    const start = new Date(from)
    const end = new Date(to)
    const inRows = await this.prisma.invoiceIn.findMany({
      where: { issueDate: { gte: start, lte: end } }
    })
    const outRows = await this.prisma.invoiceOut.findMany({
      where: { issueDate: { gte: start, lte: end } }
    })
    const entries: BookEntry[] = [
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
    const res = calcModelo303BaseAndVat(entries)
    return res
  }

  @Get('349')
  async modelo349(@Query('from') from: string, @Query('to') to: string) {
    // Placeholder: list UE operations
    const start = new Date(from)
    const end = new Date(to)
    const outRows = await this.prisma.invoiceOut.findMany({
      where: { issueDate: { gte: start, lte: end }, euOperation: true },
      include: { client: true }
    })
    return outRows.map((r: any) => ({
      date: r.issueDate,
      client: r.client.name,
      euVat: r.client.euVatNumber,
      base: r.base,
      total: r.total
    }))
  }

  @Get('130')
  async modelo130(@Query('from') from: string, @Query('to') to: string) {
    // Placeholder: IRPF provisional - NOT OFFICIAL
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
    const rendimientoNeto = baseSales - basePurch
    const pagoTrimestral = Math.max(0, Math.round(rendimientoNeto * 0.2 * 100) / 100)
    return { rendimientoNeto, pagoTrimestral }
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
