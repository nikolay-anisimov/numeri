import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'
import { InvoicesService } from './invoices.service'
import type { Response } from 'express'
import { createInvoicePdf } from '../../lib/pdf-basic'

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private prisma: PrismaService, private svc: InvoicesService) {}

  @Get('in')
  async listIn() {
    return this.prisma.invoiceIn.findMany({ include: { supplier: true } })
  }

  @Post('in')
  async createIn(
    @Body()
    body: {
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
    }
  ) {
    return this.svc.createIn(body)
  }

  @Get('out')
  async listOut() {
    return this.prisma.invoiceOut.findMany({ include: { client: true } })
  }

  @Post('out')
  async createOut(
    @Body()
    body: {
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
    }
  ) {
    return this.svc.createOut(body)
  }

  @Post('out/emit')
  async emitFromLast(
    @Body()
    body: {
      createdById: string
      clientId?: string
      base?: number
      issueDate?: string // optional override
    }
  ) {
    return this.svc.emitFromLast(body)
  }

  @Get(':id')
  async getAny(@Param('id') id: string) {
    const out = await this.prisma.invoiceOut.findUnique({ where: { id } })
    if (out) return out
    const _in = await this.prisma.invoiceIn.findUnique({ where: { id } })
    return _in
  }

  @Get('out/:id/pdf')
  async pdfOut(@Param('id') id: string, @Res() res: Response) {
    const inv = await this.prisma.invoiceOut.findUnique({ where: { id }, include: { client: true } })
    if (!inv) return res.status(404).end()
    const title = `Factura ${inv.series ? inv.series + '-' : ''}${inv.number}`
    const data = {
      title,
      fields: [
        ['Fecha', inv.issueDate.toISOString().slice(0, 10)],
        ['Cliente', inv.client?.name || ''],
        ['NIF-IVA', inv.client?.euVatNumber || inv.client?.nif || ''],
        ['Base', Number(inv.base).toFixed(2)],
        ['Tipo IVA', Number(inv.vatRate).toFixed(2) + ' %'],
        ['Cuota IVA', Number(inv.vatAmount).toFixed(2)],
        ['Total', Number(inv.total).toFixed(2)],
        ['Divisa', inv.currency]
      ] as Array<[string, string]>
    }
    const buf = createInvoicePdf(data)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${title.replace(/[^\w.-]+/g, '_')}.pdf"`)
    return res.end(buf)
  }
}
