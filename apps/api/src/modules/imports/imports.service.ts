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

  async importLibroQuarter(input: { year: number; quarter: 1 | 2 | 3 | 4; createdById: string }) {
    const { year, quarter, createdById } = input
    if (!year || !quarter || !createdById) throw new Error('year, quarter, createdById required')
    const file = this.resolveLibroPath(year, quarter)
    const { out, in: inn } = parseLibroXlsx(file)

    let createdOut = 0
    let createdIn = 0

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
      const number = row.number || ''
      const series = row.series || undefined
      const base = Number(row.base) || 0
      const vatRate = Number(row.vatRate) || 0
      const vatAmount = Number(row.vatAmount) || round2(base * (vatRate / 100))
      const total = Number(row.total) || round2(base + vatAmount)
      try {
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
        createdOut++
      } catch (e: any) {
        // Likely duplicate series+number; skip
      }
    }

    for (const row of inn) {
      const supplier = await getOrCreateThird('SUPPLIER', row.counterpartyName, row.nif)
      const base = Number(row.base) || 0
      const vatRate = Number(row.vatRate) || 0
      const vatAmount = Number(row.vatAmount) || round2(base * (vatRate / 100))
      const total = Number(row.total) || round2(base + vatAmount)
      try {
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
        createdIn++
      } catch (e: any) {
        // Skip duplicates or bad rows
      }
    }

    return {
      year,
      quarter,
      file: path.basename(file),
      created: { out: createdOut, in: createdIn },
      totals: {
        out: out.length,
        in: inn.length
      }
    }
  }
}

