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

  private async ocrParse(name: string, buf: Buffer): Promise<any> {
    const axios = await import('axios')
    const FormData = (await import('form-data')).default
    const ocrUrl = process.env.OCR_SERVICE_URL || 'http://localhost:4100'
    const form = new FormData()
    form.append('file', buf, { filename: name, contentType: 'application/pdf' })
    const res = await axios.default.post(`${ocrUrl}/parse`, form, { headers: form.getHeaders() })
    return res.data?.parsed ?? res.data
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

  async importInvoiceFromFile(input: { relPath: string; direction: 'in' | 'out'; createdById: string; dryRun?: boolean }) {
    const { relPath, direction, createdById, dryRun } = input
    if (!relPath || !direction || !createdById) throw new Error('relPath, direction, createdById required')
    const root = this.findRepoRoot(process.cwd())
    const abs = path.join(root, 'testdata', relPath)
    if (!fs.existsSync(abs)) throw new NotFoundException('file not found under testdata')
    const buf = fs.readFileSync(abs)
    const parsed = await this.ocrParse(path.basename(abs), buf)
    const issueDate = (parsed.issueDate as string) || new Date().toISOString().slice(0, 10)
    const currency = parsed.currency || 'EUR'
    const euFlag = !!parsed.euCustomer
    const base = Number(parsed.baseAmount) || 0
    const vatRate = Number(parsed.vatRate) || 0
    const vatAmount = Number(parsed.vatAmount) || (direction === 'out' ? 0 : Math.round(base * (vatRate / 100) * 100) / 100)
    const total = Number(parsed.totalAmount) || base + vatAmount

    if (direction === 'in') {
      const supplierName = parsed.sellerName || 'Unknown Supplier'
      const supplierNif = parsed.sellerNIF || 'UNKNOWN'
      const supplier =
        (await this.prisma.thirdParty.findFirst({ where: { type: 'SUPPLIER', name: supplierName } })) ||
        (await this.prisma.thirdParty.create({ data: { type: 'SUPPLIER', name: supplierName, nif: supplierNif, countryCode: 'ES' } }))
      let inv
      if (!dryRun) {
        inv = await this.invoices.createIn({
          issueDate,
          supplierId: supplier.id,
          base,
          vatRate,
          vatAmount,
          total,
          currency,
          createdById,
          euOperation: euFlag
        })
        try {
          await (this.prisma as any).attachment.create({ data: { invoiceInId: (inv as any).id, relPath, filename: path.basename(abs), kind: 'pdf' } })
        } catch {}
      }
      return { direction, created: !dryRun, parsed, invoice: inv ?? null }
    } else {
      const clientName = parsed.buyerName || 'Unknown Client'
      const clientNif = parsed.buyerNIF || 'UNKNOWN'
      const client =
        (await this.prisma.thirdParty.findFirst({ where: { type: 'CLIENT', name: clientName } })) ||
        (await this.prisma.thirdParty.create({ data: { type: 'CLIENT', name: clientName, nif: clientNif, countryCode: 'ES' } }))
      const number = String(parsed.invoiceNumber || '').trim() || 'UNKNOWN'
      let inv
      if (!dryRun) {
        inv = await this.invoices.createOut({
          issueDate,
          series: undefined,
          number,
          clientId: client.id,
          base,
          vatRate,
          vatAmount,
          total,
          currency,
          createdById,
          euOperation: euFlag
        })
        try {
          await (this.prisma as any).attachment.create({ data: { invoiceOutId: (inv as any).id, relPath, filename: path.basename(abs), kind: 'pdf' } })
        } catch {}
      }
      return { direction, created: !dryRun, parsed, invoice: inv ?? null }
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
    let linkedOut = 0
    let missingOut = 0
    const usedRel = new Set<string>()
    for (const e of y.entries as any[]) {
      if (e.kind !== 'factura-emitida') continue
      if (e.quarter !== quarter) continue
      const invoiceNo = e.invoiceNo as string | undefined
      if (!invoiceNo) {
        missingOut++
        continue
      }
      const inv = await this.prisma.invoiceOut.findFirst({
        where: {
          number: invoiceNo,
          issueDate: { gte: start, lte: end }
        }
      })
      if (!inv) {
        missingOut++
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
        usedRel.add(relPath)
        linkedOut++
      } catch (err) {
        // ignore duplicates or constraint issues
      }
    }

    // Link purchases by heuristic
    const gastoKinds = new Set(['gasto-soft', 'gasto-compras', 'gasto-taxscouts'])
    const gastos = (y.entries as any[]).filter((e) => e.quarter === quarter && gastoKinds.has(e.kind))
    const inDb = await this.prisma.invoiceIn.findMany({ where: { issueDate: { gte: start, lte: end } } })
    let linkedIn = 0
    let missingIn = 0

    function normalize(s: string) {
      return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
    }
    function tokens(s: string) {
      return normalize(s).split(/\s+/).filter(Boolean)
    }
    function vendorAliases(name: string): string[] {
      const n = normalize(name)
      const a: string[] = []
      if (n.includes('openai')) a.push('openai')
      if (n.includes('anthropic')) a.push('anthropic')
      if (n.includes('jetbrains')) a.push('jetbrains')
      if (n.includes('microsoft')) a.push('microsoft')
      if (n.includes('amazon')) a.push('amazon')
      if (n.includes('taxscout') || n.includes('taxcout')) a.push('taxscouts')
      if (n.includes('openrouter')) a.push('openrouter')
      if (n.includes('ofiprix')) a.push('ofiprix')
      if (n.includes('alg') && n.includes('legal')) a.push('alg')
      return a.length ? a : tokens(name).slice(0, 2)
    }
    function extractDateFromName(fn: string): Date | undefined {
      const s = fn
      let m = s.match(/(20\d{2})[-_./](\d{1,2})[-_./](\d{1,2})/)
      if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
      m = s.match(/(20\d{2})(\d{2})(\d{2})/)
      if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
      return undefined
    }

    const usedGasto = new Set<string>()
    for (const inv of inDb as any[]) {
      const aliases = vendorAliases(inv.supplierName || inv.supplier?.name || '')
      const invDate: Date = inv.issueDate
      let best: any | undefined
      let bestScore = -1
      for (const e of gastos) {
        const relPath: string = e.relPath
        if (usedRel.has(relPath) || usedGasto.has(relPath)) continue
        const name = e.filename as string
        const nm = normalize(name)
        let score = 0
        for (const al of aliases) if (nm.includes(al)) score += 2
        // token overlap fallback
        if (score === 0) {
          const t1 = new Set(tokens(inv.supplier?.name || ''))
          for (const t of tokens(name)) if (t1.has(t)) score += 1
        }
        const d = extractDateFromName(name)
        if (d) {
          const days = Math.abs((+d - +invDate) / (1000 * 60 * 60 * 24))
          if (days <= 5) score += 2
          else if (days <= 15) score += 1
        }
        if (score > bestScore) {
          bestScore = score
          best = e
        }
      }
      if (best && bestScore > 0) {
        try {
          await (this.prisma as any).attachment.upsert({
            where: { invoiceInId_relPath: { invoiceInId: inv.id, relPath: best.relPath } },
            update: {},
            create: { invoiceInId: inv.id, relPath: best.relPath, filename: best.filename, kind: 'pdf' }
          })
          usedGasto.add(best.relPath)
          linkedIn++
        } catch (e) {
          // ignore
        }
      } else {
        missingIn++
      }
    }

    return { year, quarter, out: { linked: linkedOut, missing: missingOut }, in: { linked: linkedIn, missing: missingIn } }
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
