import { Module } from '@nestjs/common'
import { InvoicesController } from './invoices.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { InvoicesService } from './invoices.service'
import { FxModule } from '../fx/fx.module'

@Module({ imports: [PrismaModule, FxModule], controllers: [InvoicesController], providers: [InvoicesService] })
export class InvoicesModule {}
