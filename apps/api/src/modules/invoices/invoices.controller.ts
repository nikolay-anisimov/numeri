import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private prisma: PrismaService) {}

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
      fxToEUR: number
      deductible?: boolean
      notes?: string
      euOperation?: boolean
      createdById: string
    }
  ) {
    return this.prisma.invoiceIn.create({ data: { ...body, issueDate: new Date(body.issueDate) } })
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
      fxToEUR: number
      notes?: string
      euOperation?: boolean
      createdById: string
    }
  ) {
    return this.prisma.invoiceOut.create({ data: { ...body, issueDate: new Date(body.issueDate) } })
  }

  @Get(':id')
  async getAny(@Param('id') id: string) {
    const out = await this.prisma.invoiceOut.findUnique({ where: { id } })
    if (out) return out
    const _in = await this.prisma.invoiceIn.findUnique({ where: { id } })
    return _in
  }
}

