#!/usr/bin/env node
// Set packageManager in root package.json to the locally installed pnpm version
const fs = require('fs')
const { execSync } = require('child_process')
const path = require('path')

try {
  const version = execSync('pnpm --version', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim()
  const pkgPath = path.resolve(__dirname, '..', 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  pkg.packageManager = `pnpm@${version}`
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`Updated packageManager to pnpm@${version}`)
  try {
    execSync(`corepack prepare pnpm@${version} --activate`, { stdio: 'inherit' })
  } catch (e) {
    console.warn('Corepack activation skipped or failed. You may run it manually.')
  }
} catch (err) {
  console.error('Failed to detect pnpm version. Is pnpm installed and on PATH?')
  process.exit(1)
}

