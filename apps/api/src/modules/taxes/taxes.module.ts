import { Module } from '@nestjs/common'
import { TaxesController } from './taxes.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({ imports: [PrismaModule], controllers: [TaxesController] })
export class TaxesModule {}

