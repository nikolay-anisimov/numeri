import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'

@ApiTags('third-parties')
@Controller('third-parties')
export class ThirdPartiesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.thirdParty.findMany()
  }

  @Post()
  async create(
    @Body()
    body: {
      type: 'CLIENT' | 'SUPPLIER'
      name: string
      nif: string
      euVatNumber?: string
      countryCode: string
    }
  ) {
    return this.prisma.thirdParty.create({ data: body })
  }
}

