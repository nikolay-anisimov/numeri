import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'

@ApiTags('fx')
@Controller('fx')
export class FxController {
  constructor(private prisma: PrismaService) {}

  @Get('rates')
  async getRates(@Query('quote') quote?: string) {
    return this.prisma.fxRate.findMany({ where: { quote: quote || undefined } })
  }

  @Post('rates')
  async addRate(@Body() body: { date: string; base: string; quote: string; rate: number }) {
    return this.prisma.fxRate.create({ data: { ...body, date: new Date(body.date) } })
  }
}

