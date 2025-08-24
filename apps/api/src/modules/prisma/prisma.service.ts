import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
  }

  async enableShutdownHooks(app: INestApplication) {
    // Use any to avoid Prisma type inference issues during certain TS builds
    ;(this as any).$on('beforeExit', async () => {
      await app.close()
    })
  }
}
