import fs from 'node:fs'
import path from 'node:path'
import { buildRegistry } from '../packages/utils/dist/testdata.js'

const ROOT = process.cwd()
const TD = path.join(ROOT, 'testdata')

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

async function main() {
  if (!fs.existsSync(TD)) {
    console.error('No testdata directory found at', TD)
    process.exit(1)
  }
  const files = walk(TD)
  const filesRel = files.map((p) => path.relative(ROOT, p).replace(/\\/g, '/'))
  const reg = buildRegistry('testdata', filesRel)
  const outPath = path.join(TD, 'registry.json')
  fs.writeFileSync(outPath, JSON.stringify(reg, null, 2) + '\n')
  console.log('Wrote registry to', path.relative(ROOT, outPath))
  console.log('Summary:', reg.summary)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
