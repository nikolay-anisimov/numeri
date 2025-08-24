import express from 'express'
import multer from 'multer'
import pdfParse from 'pdf-parse'
import { cleanText, parseFromText } from './parser'

app.post('/parse', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' })
  try {
    const data = await pdfParse(req.file.buffer)
    const text = cleanText(data.text || '')
    const { vendor, parsed } = parseFromText(text, req.file.originalname)
    res.json({ ok: true, vendor, parsed, rawText: process.env.OCR_INCLUDE_TEXT ? text : undefined })
  } catch (err: any) {
    console.error('OCR error', err?.message)
    res.status(500).json({ ok: false, error: 'parse_failed', message: err?.message })
  }
})

const port = Number(process.env.PORT || 4100)
app.listen(port, () => {
  console.log(`OCR service on http://localhost:${port}`)
})
