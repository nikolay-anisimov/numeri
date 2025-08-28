import { Module } from '@nestjs/common'
import { TaxesController } from './taxes.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { QuarterService } from './quarter.service'

@Module({ imports: [PrismaModule], controllers: [TaxesController], providers: [QuarterService], exports: [QuarterService] })
export class TaxesModule {}
