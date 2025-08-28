import * as fs from 'node:fs'
import * as path from 'node:path'
import { BadRequestException } from '@nestjs/common'

let CODES_CACHE: any | null = null

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

export function getAeatCodes(): any {
  if (CODES_CACHE) return CODES_CACHE
  const root = findRepoRoot(process.cwd())
  const p = path.join(root, 'docs/AEAT/unificados-codes.json')
  const raw = fs.readFileSync(p, 'utf8')
  CODES_CACHE = JSON.parse(raw)
  return CODES_CACHE
}

function hasCode(sheet: string, header: string, code?: string | null) {
  if (!code) return true
  const json = getAeatCodes()
  const items = json?.sheets?.[sheet]?.[header]?.items as Array<{ code: string }> | undefined
  if (!items) return true // be permissive if not found
  return items.some((it) => String(it.code).toUpperCase() === String(code).toUpperCase())
}

export function validateCodesForIn(input: {
  codeTipoFactura?: string
  codeConceptoGasto?: string
  codeClaveOperacion?: string
}) {
  const sheet = 'RECIBIDAS_GASTOS'
  const checks: Array<[string, string | undefined]> = [
    ['Tipo de Factura', input.codeTipoFactura],
    ['Concepto de Gasto', input.codeConceptoGasto],
    ['Clave de Operación', input.codeClaveOperacion]
  ]
  for (const [header, code] of checks) {
    if (code && !hasCode(sheet, header, code)) {
      throw new BadRequestException(`AEAT code not allowed for ${header}: ${code}`)
    }
  }
}

export function validateCodesForOut(input: {
  codeTipoFactura?: string
  codeConceptoIngreso?: string
  codeClaveOperacion?: string
  codeCalificacionOp?: string
  codeExencion?: string
}) {
  const sheet = 'EXPEDIDAS_INGRESOS'
  const checks: Array<[string, string | undefined]> = [
    ['Tipo de Factura', input.codeTipoFactura],
    ['Concepto de Ingreso', input.codeConceptoIngreso],
    ['Clave de Operación', input.codeClaveOperacion],
    ['Calificación de la Operación', input.codeCalificacionOp],
    ['Operación Exenta', input.codeExencion]
  ]
  for (const [header, code] of checks) {
    if (code && !hasCode(sheet, header, code)) {
      throw new BadRequestException(`AEAT code not allowed for ${header}: ${code}`)
    }
  }
}

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function approxEqual(a: number, b: number, tol = 0.02) {
  return Math.abs(a - b) <= tol
}

export function validateCommonIn(payload: {
  issueDate: string
  base: number
  vatRate: number
  vatAmount: number
  total: number
  currency: string
}) {
  if (!isIsoDate(payload.issueDate)) throw new BadRequestException('issueDate must be YYYY-MM-DD')
  if (!/^[A-Z]{3}$/.test(payload.currency)) throw new BadRequestException('currency must be 3-letter ISO code')
  for (const [k, v] of Object.entries({ base: payload.base, vatRate: payload.vatRate, vatAmount: payload.vatAmount, total: payload.total })) {
    if (!Number.isFinite(v as number)) throw new BadRequestException(`${k} must be a number`)
  }
  if (!approxEqual(payload.base + payload.vatAmount, payload.total)) throw new BadRequestException('total must equal base + vatAmount (±0.02)')
}

export function validateCommonOut(payload: {
  issueDate: string
  base: number
  vatRate: number
  vatAmount: number
  total: number
  currency: string
}) {
  return validateCommonIn(payload)
}
