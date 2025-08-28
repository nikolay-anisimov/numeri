import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { InvoicesModule } from './invoices/invoices.module'
import { LedgerModule } from './ledger/ledger.module'
import { FxModule } from './fx/fx.module'
import { TaxesModule } from './taxes/taxes.module'
import { ThirdPartiesModule } from './third-parties/third-parties.module'
import { FilesModule } from './files/files.module'
import { PrismaModule } from './prisma/prisma.module'
import { ImportsModule } from './imports/imports.module'
import { AeatModule } from './aeat/aeat.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    InvoicesModule,
    LedgerModule,
    FxModule,
    TaxesModule,
    ThirdPartiesModule,
    FilesModule,
    ImportsModule,
    AeatModule
  ]
})
export class AppModule {}
