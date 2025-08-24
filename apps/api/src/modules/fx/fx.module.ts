import { Module } from '@nestjs/common'
import { FxController } from './fx.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { FxService } from './fx.service'

@Module({ imports: [PrismaModule], controllers: [FxController], providers: [FxService] })
export class FxModule {}
