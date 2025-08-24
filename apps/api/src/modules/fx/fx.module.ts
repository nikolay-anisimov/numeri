import { Module } from '@nestjs/common'
import { FxController } from './fx.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({ imports: [PrismaModule], controllers: [FxController] })
export class FxModule {}

