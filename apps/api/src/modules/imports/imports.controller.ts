import { Body, Controller, Post } from '@nestjs/common'
import { ImportsService } from './imports.service'

@Controller('imports')
export class ImportsController {
  constructor(private svc: ImportsService) {}

  @Post('libro')
  importLibro(@Body() body: { year: number; quarter: 1 | 2 | 3 | 4; createdById: string; dryRun?: boolean }) {
    return this.svc.importLibroQuarter(body)
  }

  @Post('attach')
  attach(@Body() body: { year: number; quarter: 1 | 2 | 3 | 4 }) {
    return this.svc.attachQuarterPdfs(body)
  }

  @Post('validate')
  validate(@Body() body: { year: number; quarter: 1 | 2 | 3 | 4 }) {
    return this.svc.validateQuarter(body)
  }
}
