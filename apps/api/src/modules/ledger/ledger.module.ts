import { Module } from '@nestjs/common'
import { LedgerController } from './ledger.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({ imports: [PrismaModule], controllers: [LedgerController] })
export class LedgerModule {}

