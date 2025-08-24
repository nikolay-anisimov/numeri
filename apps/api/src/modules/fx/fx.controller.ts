import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'
import { FxService } from './fx.service'

@ApiTags('fx')
@Controller('fx')
export class FxController {
  constructor(private prisma: PrismaService, private fxService: FxService) {}

  @Get('rates')
  async getRates(@Query('quote') quote?: string) {
    return this.prisma.fxRate.findMany({ where: { quote: quote || undefined } })
  }

  @Post('rates')
  async addRate(@Body() body: { date: string; base: string; quote: string; rate: number }) {
    return this.prisma.fxRate.create({ data: { ...body, date: new Date(body.date) } })
  }

  @Post('rates/upsert')
  async upsertRate(@Body() body: { date: string; quote: string; rate: number; base?: string }) {
    return this.fxService.upsertRate(body)
  }

  @Get('rates/one')
  async one(@Query('date') date: string, @Query('quote') quote: string) {
    const row = await this.fxService.getRateByDate(date, quote)
    if (!row) return { ok: false, error: 'not_found' }
    return row
  }
}
