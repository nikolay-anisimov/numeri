import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'

@ApiTags('ledger')
@Controller('ledger')
export class LedgerController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.ledgerEntry.findMany({ orderBy: { date: 'desc' } })
  }

  @Post()
  async create(
    @Body()
    body: {
      date: string
      type: 'SALE' | 'PURCHASE' | 'OTHER'
      amount: number
      currency: string
      fxToEUR: number
      invoiceInId?: string
      invoiceOutId?: string
      notes?: string
    }
  ) {
    return this.prisma.ledgerEntry.create({ data: { ...body, date: new Date(body.date) } })
  }
}

