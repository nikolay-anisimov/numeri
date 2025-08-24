import express from 'express'
import multer from 'multer'

const app = express()
const upload = multer()

// Simple OCR stub + LLM mapping
function fakeOcrToText(_buffer: Buffer): string {
  // TODO: Replace with tesseract.js or external OCR
  return 'Invoice No 2024-001; Seller ACME S.L.; Buyer John Doe; Base 100.00; VAT 21%'
}

function mapTextToInvoiceJson(text: string) {
  // Very naive extraction just for demonstration
  return {
    issueDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: (text.match(/(Invoice No|Factura)\s*([\w-]+)/i)?.[2] || 'UNKNOWN').trim(),
    sellerName: text.match(/Seller\s([^;]+)/i)?.[1]?.trim() || 'Unknown Seller',
    sellerNIF: 'B00000000',
    buyerName: text.match(/Buyer\s([^;]+)/i)?.[1]?.trim() || 'Unknown Buyer',
    buyerNIF: '00000000A',
    baseAmount: 100.0,
    vatRate: 21,
    vatAmount: 21.0,
    totalAmount: 121.0,
    currency: 'EUR',
    euCustomer: false
  }
}

app.post('/parse', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' })
  const text = fakeOcrToText(req.file.buffer)
  const json = mapTextToInvoiceJson(text)
  // Simple logging
  // eslint-disable-next-line no-console
  console.log('OCR parsed:', { name: req.file.originalname, json })
  res.json({ ok: true, parsed: json, rawText: text })
})

const port = Number(process.env.PORT || 4100)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`OCR service stub on http://localhost:${port}`)
})

