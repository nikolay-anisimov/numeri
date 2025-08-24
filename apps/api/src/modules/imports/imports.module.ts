import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { ImportsController } from './imports.controller'
import { ImportsService } from './imports.service'
import { FxModule } from '../fx/fx.module'
import { InvoicesModule } from '../invoices/invoices.module'

@Module({ imports: [PrismaModule, FxModule, InvoicesModule], controllers: [ImportsController], providers: [ImportsService] })
export class ImportsModule {}
