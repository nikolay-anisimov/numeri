import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { InvoicesService } from '../invoices/invoices.service'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseLibroXlsx, round2 } from '@packages/utils'

@Injectable()
export class ImportsService {
  constructor(private prisma: PrismaService, private invoices: InvoicesService) {}

  private findRepoRoot(startDir: string): string {
    let dir = startDir
    for (let i = 0; i < 5; i++) {
      if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
    }
    return startDir
  }

  private resolveLibroPath(year: number, quarter: number): string {
    const root = this.findRepoRoot(process.cwd())
    const td = path.join(root, 'testdata')
    const regPath = path.join(td, 'registry.json')
    if (fs.existsSync(regPath)) {
      try {
        const reg = JSON.parse(fs.readFileSync(regPath, 'utf8')) as any
        const y = reg.years.find((y: any) => y.year === year)
        const entry = y?.entries.find((e: any) => e.kind === 'libro' && e.quarter === quarter)
        if (entry) return path.join(td, entry.relPath)
      } catch {}
    }
    // Fallback: search for Libro-T{Q}-{YYYY}
    const dir = path.join(td, String(year), `trimestre-${quarter}`)
    if (!fs.existsSync(dir)) throw new NotFoundException('Quarter folder not found')
    const cand = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith('.xlsx') && f.toLowerCase().includes('libro'))
      .map((f) => path.join(dir, f))
    if (cand[0]) return cand[0]
    throw new NotFoundException('Libro Excel not found for quarter')
  }

  async importLibroQuarter(input: { year: number; quarter: 1 | 2 | 3 | 4; createdById: string; dryRun?: boolean }) {
    const { year, quarter, createdById, dryRun } = input
    if (!year || !quarter || !createdById) throw new Error('year, quarter, createdById required')
    const file = this.resolveLibroPath(year, quarter)
    const { out, in: inn } = parseLibroXlsx(file)

    let createdOut = 0
    let createdIn = 0
    let skippedMissingNumber = 0
    let skippedErrors = 0

    // Upsert helper for third parties
    const getOrCreateThird = async (type: 'CLIENT' | 'SUPPLIER', name?: string, nif?: string) => {
      const nm = (name ?? '').trim() || 'UNKNOWN'
      const nf = (nif ?? '').trim() || 'UNKNOWN'
      const existing = await this.prisma.thirdParty.findFirst({ where: { name: nm, type } })
      if (existing) return existing
      return this.prisma.thirdParty.create({ data: { name: nm, type, nif: nf, countryCode: 'ES' } })
    }

    for (const row of out) {
      const client = await getOrCreateThird('CLIENT', row.counterpartyName, row.nif)
      const number = (row.number || '').trim()
      const series = row.series?.toString().trim() || undefined
      if (!number) {
        skippedMissingNumber++
        continue
      }
      const base = Number(row.base) || 0
      const vatRate = Number(row.vatRate) || 0
      const vatAmount = Number(row.vatAmount) || round2(base * (vatRate / 100))
      const total = Number(row.total) || round2(base + vatAmount)
      try {
        if (!dryRun) {
          await this.invoices.createOut({
            issueDate: row.issueDate,
            series,
            number,
            clientId: client.id,
            base,
            vatRate,
            vatAmount,
            total,
            currency: row.currency || 'EUR',
            euOperation: row.euOperation ?? undefined,
            notes: row.category,
            createdById
          })
        }
        createdOut++
      } catch (e: any) {
        // Likely duplicate series+number; skip
        skippedErrors++
      }
    }

    for (const row of inn) {
      const supplier = await getOrCreateThird('SUPPLIER', row.counterpartyName, row.nif)
      const base = Number(row.base) || 0
      const vatRate = Number(row.vatRate) || 0
      const vatAmount = Number(row.vatAmount) || round2(base * (vatRate / 100))
      const total = Number(row.total) || round2(base + vatAmount)
      try {
        if (!dryRun) {
          await this.invoices.createIn({
            issueDate: row.issueDate,
            supplierId: supplier.id,
            base,
            vatRate,
            vatAmount,
            total,
            currency: row.currency || 'EUR',
            deductible: true,
            category: row.category,
            assetFlag: false,
            euOperation: row.euOperation ?? undefined,
            notes: undefined,
            createdById
          })
        }
        createdIn++
      } catch (e: any) {
        // Skip duplicates or bad rows
        skippedErrors++
      }
    }

    return {
      year,
      quarter,
      file: path.basename(file),
      created: { out: createdOut, in: createdIn },
      skipped: { missingNumber: skippedMissingNumber, errors: skippedErrors },
      dryRun: !!dryRun,
      totals: {
        out: out.length,
        in: inn.length
      }
    }
  }

  private quarterRange(year: number, quarter: 1 | 2 | 3 | 4) {
    const q = Number(quarter)
    const startMonth = (q - 1) * 3
    const start = new Date(Date.UTC(year, startMonth, 1))
    const end = new Date(Date.UTC(year, startMonth + 3, 0))
    return { start, end }
  }

  async attachQuarterPdfs(input: { year: number; quarter: 1 | 2 | 3 | 4 }) {
    const { year, quarter } = input
    const root = this.findRepoRoot(process.cwd())
    const td = path.join(root, 'testdata')
    const regPath = path.join(td, 'registry.json')
    if (!fs.existsSync(regPath)) throw new NotFoundException('registry.json not found')
    const reg = JSON.parse(fs.readFileSync(regPath, 'utf8')) as any
    const y = reg.years.find((y: any) => y.year === year)
    if (!y) throw new NotFoundException('year not found in registry')
    const { start, end } = this.quarterRange(year, quarter)
    let linked = 0
    let missing = 0
    for (const e of y.entries as any[]) {
      if (e.kind !== 'factura-emitida') continue
      if (e.quarter !== quarter) continue
      const invoiceNo = e.invoiceNo as string | undefined
      if (!invoiceNo) {
        missing++
        continue
      }
      const inv = await this.prisma.invoiceOut.findFirst({
        where: {
          number: invoiceNo,
          issueDate: { gte: start, lte: end }
        }
      })
      if (!inv) {
        missing++
        continue
      }
      const relPath: string = e.relPath
      const filename: string = e.filename
      try {
        await (this.prisma as any).attachment.upsert({
          where: { invoiceOutId_relPath: { invoiceOutId: inv.id, relPath } },
          update: {},
          create: { invoiceOutId: inv.id, relPath, filename, kind: 'pdf' }
        })
        linked++
      } catch (err) {
        // ignore duplicates or constraint issues
      }
    }
    return { year, quarter, linked, missing }
  }

  async validateQuarter(input: { year: number; quarter: 1 | 2 | 3 | 4 }) {
    const { year, quarter } = input
    const { start, end } = this.quarterRange(year, quarter)
    const libro = parseLibroXlsx(this.resolveLibroPath(year, quarter))
    const outDb = await this.prisma.invoiceOut.findMany({ where: { issueDate: { gte: start, lte: end } } })
    const inDb = await this.prisma.invoiceIn.findMany({ where: { issueDate: { gte: start, lte: end } } })

    const sum = (rows: any[], key: 'base' | 'vatAmount') => rows.reduce((acc, r) => acc + Number(r[key] ?? 0), 0)
    const libroOut = { count: libro.out.length, base: sum(libro.out as any, 'base'), vat: sum(libro.out as any, 'vatAmount') }
    const libroIn = { count: libro.in.length, base: sum(libro.in as any, 'base'), vat: sum(libro.in as any, 'vatAmount') }
    const dbOut = { count: outDb.length, base: sum(outDb as any, 'base'), vat: sum(outDb as any, 'vatAmount') }
    const dbIn = { count: inDb.length, base: sum(inDb as any, 'base'), vat: sum(inDb as any, 'vatAmount') }

    // missing attachments (emitidas)
    const outIds = outDb.map((o: any) => o.id)
    const attachments = await (this.prisma as any).attachment.findMany({ where: { invoiceOutId: { in: outIds } } })
    const attachedSet = new Set<string>(attachments.map((a: any) => a.invoiceOutId))
    const missingAttachmentNumbers = outDb.filter((o: any) => !attachedSet.has(o.id)).map((o: any) => o.number)

    return {
      year,
      quarter,
      libro: { out: libroOut, in: libroIn },
      db: { out: dbOut, in: dbIn, missingAttachmentNumbers }
    }
  }
}
