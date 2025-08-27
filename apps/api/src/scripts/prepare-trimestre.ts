/*
Prepare trimestre artifacts: unified AEAT Libro XLSX using template, plus basic console summary.

Usage:
  pnpm --filter @apps/api ts-node src/scripts/prepare-trimestre.ts \
    --year 2025 --quarter 1 \
    --nif Z1664779K --name "NIKOLAI ANISIMOV" \
    --template ../../docs/AEAT/LSI.xlsx \
    --outDir ../../testdata/2025/trimestre-1/artifacts
*/
import * as path from 'node:path'
import * as fs from 'node:fs'
import { PrismaClient } from '@prisma/client'
import {
  writeLibroFromTemplate,
  mapInvoiceInToUnifiedRow,
  mapInvoiceOutToUnifiedRow,
  build303Entries,
  calc303,
  build349Inputs,
  build349Lines
} from '@packages/utils'

function quarterRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3
  const start = new Date(Date.UTC(year, startMonth, 1))
  const end = new Date(Date.UTC(year, startMonth + 3, 0))
  return { start, end }
}

function fileName(year: number, nif: string, tipo: 'T' | 'C' | 'D', name: string) {
  const clean = name.trim().toUpperCase().replace(/\s+/g, '_')
  return `${year}_${nif}_${tipo}_${clean}.xlsx`
}

async function main() {
  // Minimal argv parser: supports --key value pairs
  const argv = process.argv.slice(2)
  const getArg = (key: string): string | undefined => {
    const idx = argv.findIndex((a) => a === `--${key}`)
    if (idx >= 0 && idx + 1 < argv.length) return argv[idx + 1]
    return undefined
  }
  const year = Number(getArg('year'))
  const quarter = Number(getArg('quarter'))
  const nif = String(getArg('nif') || process.env.TAX_NIF || '').trim()
  const name = String(getArg('name') || process.env.TAX_NAME || '').trim()
  const template = String(getArg('template') || path.resolve(__dirname, '../../../docs/AEAT/LSI.xlsx'))
  const outDir = String(getArg('outDir') || path.resolve(__dirname, '../../../testdata', String(year), `trimestre-${quarter}`, 'artifacts'))
  if (!year || !quarter || !nif || !name) throw new Error('--year --quarter --nif --name required')

  const prisma = new PrismaClient()
  const { start, end } = quarterRange(year, quarter)
  const outs = await prisma.invoiceOut.findMany({ where: { issueDate: { gte: start, lte: end } }, include: { client: true } })
  const ins = await prisma.invoiceIn.findMany({ where: { issueDate: { gte: start, lte: end } }, include: { supplier: true } })

  // Map to unified rows
  const expRows = outs.map((o) =>
    mapInvoiceOutToUnifiedRow({
      issueDate: o.issueDate.toISOString().slice(0, 10),
      series: o.series,
      number: o.number,
      client: { name: o.client.name, nif: o.client.nif, euVatNumber: o.client.euVatNumber, countryCode: o.client.countryCode },
      base: Number(o.base),
      vatRate: Number(o.vatRate),
      vatAmount: Number(o.vatAmount),
      total: Number(o.total),
      currency: o.currency,
      fxToEUR: Number(o.fxToEUR),
      euOperation: o.euOperation
    })
  )
  const recRows = ins.map((i) =>
    mapInvoiceInToUnifiedRow({
      issueDate: i.issueDate.toISOString().slice(0, 10),
      supplier: { name: i.supplier.name, nif: i.supplier.nif, euVatNumber: i.supplier.euVatNumber, countryCode: i.supplier.countryCode },
      base: Number(i.base),
      vatRate: Number(i.vatRate),
      vatAmount: Number(i.vatAmount),
      total: Number(i.total),
      currency: i.currency,
      fxToEUR: Number(i.fxToEUR),
      assetFlag: i.assetFlag,
      deductible: i.deductible
    })
  )

  // Write unified Libro from template
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, fileName(year, nif, 'T', name))
  writeLibroFromTemplate(template, outFile, expRows, recRows)

  // Compute quick tax summaries
  const entries303 = build303Entries(
    outs.map((o) => ({
      issueDate: o.issueDate.toISOString().slice(0, 10),
      series: o.series,
      number: o.number,
      client: { name: o.client.name, nif: o.client.nif, euVatNumber: o.client.euVatNumber, countryCode: o.client.countryCode },
      base: Number(o.base),
      vatRate: Number(o.vatRate),
      vatAmount: Number(o.vatAmount),
      total: Number(o.total),
      currency: o.currency,
      fxToEUR: Number(o.fxToEUR),
      euOperation: o.euOperation
    })) as any,
    ins.map((i) => ({
      issueDate: i.issueDate.toISOString().slice(0, 10),
      supplier: { name: i.supplier.name, nif: i.supplier.nif, euVatNumber: i.supplier.euVatNumber, countryCode: i.supplier.countryCode },
      base: Number(i.base),
      vatRate: Number(i.vatRate),
      vatAmount: Number(i.vatAmount),
      total: Number(i.total),
      currency: i.currency,
      fxToEUR: Number(i.fxToEUR),
      assetFlag: i.assetFlag,
      deductible: i.deductible
    })) as any
  )
  const res303 = calc303(entries303)

  const inputs349 = build349Inputs(
    outs.map((o) => ({
      issueDate: o.issueDate.toISOString().slice(0, 10),
      client: { name: o.client.name, nif: o.client.nif, euVatNumber: o.client.euVatNumber, countryCode: o.client.countryCode },
      base: Number(o.base),
      vatRate: Number(o.vatRate),
      vatAmount: Number(o.vatAmount),
      total: Number(o.total),
      currency: o.currency,
      fxToEUR: Number(o.fxToEUR),
      euOperation: o.euOperation
    })) as any
  )
  const periodLabel = `${year}Q${quarter}`
  const lines349 = build349Lines(inputs349, { periodLabel })

  console.log('Libro:', outFile)
  console.log('Modelo 303 resumen:', JSON.stringify(res303))
  console.log('Modelo 349 líneas:', JSON.stringify(lines349))

  await prisma.$disconnect()
}

main().catch((e: any) => {
  console.error(e)
  process.exit(1)
})
