import { Controller, Get } from '@nestjs/common'
import * as fs from 'node:fs'
import * as path from 'node:path'

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

@Controller('aeat')
export class AeatController {
  private root = findRepoRoot(process.cwd())

  @Get('codes')
  getCodes() {
    const p = path.join(this.root, 'docs/AEAT/unificados-codes.json')
    const raw = fs.readFileSync(p, 'utf8')
    return JSON.parse(raw)
  }

  @Get('format')
  getFormat() {
    const p = path.join(this.root, 'docs/AEAT/unificados-format.json')
    const raw = fs.readFileSync(p, 'utf8')
    return JSON.parse(raw)
  }
}

