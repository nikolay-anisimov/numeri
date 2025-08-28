import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AeatController } from './aeat.controller'

@Module({
  imports: [PrismaModule],
  controllers: [AeatController]
})
export class AeatModule {}

