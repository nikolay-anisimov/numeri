import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { mapInvoiceInToUnifiedRow, mapInvoiceOutToUnifiedRow, writeLibroFromTemplate, build303Entries, calc303, build349Inputs, build349Lines, calc130Ytd } from '@packages/utils'

function findRepoRoot(startDir: string): string {
  let dir = startDir
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return startDir
}

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

function renderFilingGuide(input: {
  year: number
  quarter: number
  filename: string
  res303: ReturnType<typeof calc303>
  res130: ReturnType<typeof calc130Ytd>
  lines349: any[]
}) {
  const { year, quarter, filename, res303, res130, lines349 } = input
  return `# Cierre ${year} T${quarter}

## Fichero Libro Unificado
- Nombre: ${filename}
- Validador AEAT: https://www2.agenciatributaria.gob.es/wlpl/PACM-SERV/validarLLRs.html

## Modelo 303 (resumen)
- Devengada: ${res303.devengadoByType['0'].cuota + res303.devengadoByType['4'].cuota + res303.devengadoByType['10'].cuota + res303.devengadoByType['21'].cuota + res303.aib.cuota + res303.isp.cuota}
- Deducible: ${res303.deducibleCorriente.cuota + res303.deducibleBienesInversion.cuota}
- Resultado casilla 71: ${res303.resultado71}

## Modelo 130 (resumen YTD)
- Ingresos brutos (c01): ${res130.c01}
- Gastos deducibles (c02): ${res130.c02}
- Base (c03): ${res130.c03}
- Importe a ingresar (c17): ${res130.c17}

## Modelo 349 (líneas)
${lines349.length ? lines349.map((l) => `- ${l.partnerVat} ${l.partnerName || ''} — ${l.base_eur} EUR (clave ${l.clave})`).join('\n') : '- (sin operaciones)'}
`
}

@Injectable()
export class QuarterService {
  constructor(private prisma: PrismaService) {}

  async closeQuarter(params: { year: number; quarter: 1 | 2 | 3 | 4; nif: string; name: string; outDir?: string; templatePath?: string }) {
    const { year, quarter, nif, name } = params
    const { start, end } = quarterRange(year, quarter)
    const outs = await this.prisma.invoiceOut.findMany({ where: { issueDate: { gte: start, lte: end } }, include: { client: true } })
    const ins = await this.prisma.invoiceIn.findMany({ where: { issueDate: { gte: start, lte: end } }, include: { supplier: true } })

    const expRows = outs.map((o: any) =>
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
        euOperation: o.euOperation,
        codeTipoFactura: o.codeTipoFactura || undefined,
        codeConceptoIngreso: o.codeConceptoIngreso || undefined,
        codeClaveOperacion: o.codeClaveOperacion || undefined,
        codeCalificacionOp: o.codeCalificacionOp || undefined,
        codeExencion: o.codeExencion || undefined
      })
    )
    const recRows = ins.map((i: any) =>
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
        deductible: i.deductible,
        codeTipoFactura: i.codeTipoFactura || undefined,
        codeConceptoGasto: i.codeConceptoGasto || undefined,
        codeClaveOperacion: i.codeClaveOperacion || undefined
      })
    )

    const root = findRepoRoot(process.cwd())
    const outDir = params.outDir || path.join(root, 'testdata', String(year), `trimestre-${quarter}`, 'artifacts')
    fs.mkdirSync(outDir, { recursive: true })
    const template = params.templatePath || path.join(root, 'docs/AEAT/PLANTILLA_LIBROS_UNIFICADOS.xlsx')
    const xlsxName = fileName(year, nif, 'T', name)
    const xlsxPath = path.join(outDir, xlsxName)
    writeLibroFromTemplate(template, xlsxPath, expRows, recRows)

    const entries303 = build303Entries(
      outs.map((o: any) => ({ issueDate: o.issueDate.toISOString().slice(0, 10), client: { name: o.client.name, nif: o.client.nif, euVatNumber: o.client.euVatNumber, countryCode: o.client.countryCode }, base: Number(o.base), vatRate: Number(o.vatRate), vatAmount: Number(o.vatAmount), total: Number(o.total), currency: o.currency, fxToEUR: Number(o.fxToEUR), euOperation: o.euOperation })) as any,
      ins.map((i: any) => ({ issueDate: i.issueDate.toISOString().slice(0, 10), supplier: { name: i.supplier.name, nif: i.supplier.nif, euVatNumber: i.supplier.euVatNumber, countryCode: i.supplier.countryCode }, base: Number(i.base), vatRate: Number(i.vatRate), vatAmount: Number(i.vatAmount), total: Number(i.total), currency: i.currency, fxToEUR: Number(i.fxToEUR), assetFlag: i.assetFlag, deductible: i.deductible })) as any
    )
    const res303 = calc303(entries303)

    const inputs349 = build349Inputs(
      outs.map((o: any) => ({ issueDate: o.issueDate.toISOString().slice(0, 10), client: { name: o.client.name, nif: o.client.nif, euVatNumber: o.client.euVatNumber, countryCode: o.client.countryCode }, base: Number(o.base), vatRate: Number(o.vatRate), vatAmount: Number(o.vatAmount), total: Number(o.total), currency: o.currency, fxToEUR: Number(o.fxToEUR), euOperation: o.euOperation })) as any
    )
    const periodLabel = `${year}Q${quarter}`
    const lines349 = build349Lines(inputs349, { periodLabel })

    const basePurch = ins.reduce((a: number, r: any) => a + Number(r.base), 0)
    const baseSales = outs.reduce((a: number, r: any) => a + Number(r.base), 0)
    const res130 = calc130Ytd({ grossIncomeYtd: baseSales, deductibleExpensesYtd: basePurch })

    const guide = renderFilingGuide({ year, quarter, filename: xlsxName, res303, res130, lines349 })
    const guidePath = path.join(outDir, 'guia-presentacion-130-303-349.md')
    fs.writeFileSync(guidePath, guide, 'utf8')

    return { xlsxPath, guidePath, summaries: { res303, res130, lines349 } }
  }
}

