import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import axios from 'axios'
import FormData from 'form-data'
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('files')
@Controller('files')
export class FilesController {
  @Post('parse')
  @ApiOperation({ summary: 'Parse invoice via OCR service' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async parseFile(@UploadedFile() file: Express.Multer.File) {
    // Forward to OCR service stub
    const ocrUrl = process.env.OCR_SERVICE_URL || 'http://localhost:4100'
    const form = new FormData()
    form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype })
    const res = await axios.post(`${ocrUrl}/parse`, form, { headers: form.getHeaders() })
    return res.data
  }
}
