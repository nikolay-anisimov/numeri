import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    // TODO: Implement proper auth. For now, accept any.
    return { token: 'stub', user: { email: body.email } }
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    // TODO: Persist user with Prisma and hash password
    return { ok: true }
  }
}

