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

