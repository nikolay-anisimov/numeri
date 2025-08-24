import 'dotenv/config'
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] })
  app.enableCors({ origin: true, credentials: true })

  try {
    const config = new DocumentBuilder().setTitle('Numeri API').setVersion('0.1').build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('docs', app, document)
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.warn('Swagger disabled (init failed):', err?.message || err)
  }

  const port = Number(process.env.PORT || 4000)
  await app.listen(port)
  // eslint-disable-next-line no-console
  console.log(`API running at http://localhost:${port}`)
}

bootstrap()
