import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { ImportsController } from './imports.controller'

@Module({ imports: [PrismaModule], controllers: [ImportsController] })
export class ImportsModule {}

