import { Module } from '@nestjs/common'
import { ThirdPartiesController } from './third-parties.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({ imports: [PrismaModule], controllers: [ThirdPartiesController] })
export class ThirdPartiesModule {}

