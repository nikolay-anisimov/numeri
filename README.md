# Numeri — Monorepo full‑stack TypeScript (MVP)

Numeri es un sistema contable para autónomo en España. Monorepo con pnpm workspaces: Next.js (web), NestJS (api), Prisma+PostgreSQL (DB) y servicio OCR stub.

## Requisitos

- Node.js LTS (>= 20)
- pnpm (>= 8)
- Docker + Docker Compose (para DB y opción de levantar todo)

## Instalación

```bash
pnpm i
pnpm -w run build
pnpm -w run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000 (Swagger en `/docs`)
- OCR: http://localhost:4100

## Variables de entorno

Copia `.env.example` a `.env` y ajusta valores:

- `DATABASE_URL`
- `NEXTAUTH_SECRET` (o similar para auth futura)
- `OCR_SERVICE_URL`
- `BCE_FX_SOURCE` (placeholder)

## Desarrollo con Docker

Arrancar solo la base de datos y desarrollar localmente web/api:

```bash
docker compose up -d db
pnpm -w run dev
```

O levantar todo con Docker Compose (requiere construir imágenes):

```bash
docker compose up --build
```

## Prisma (migraciones)

```bash
pnpm --filter @apps/api prisma:generate
pnpm --filter @apps/api prisma:migrate
# o
pnpm --filter @apps/api prisma migrate dev
```

## Scripts de calidad

```bash
pnpm -w lint
pnpm -w typecheck
pnpm -w test
pnpm --filter @apps/web e2e
```

## Estructura

```
apps/
  web/  # Next.js (App Router, Tailwind)
  api/  # NestJS + Prisma + Swagger
services/
  ocr/  # OCR stub (Express TS)
packages/
  ui/       # UI compartida (mínima)
  utils/    # utilidades (fx, aeat, dates, money, csv)
  config/   # tsconfig base + eslint/prettier compartidos
```

## Notas

- OCR es un stub (simulado). Endpoint `POST /parse` devuelve JSON con campos principales.
- Autenticación: stub en web y api (pendiente integrar NextAuth/custom).
- Endpoints de impuestos (130/303/349) implementan lógica básica de ejemplo (no oficial).
- Export Libros AEAT: utilidades CSV con columnas típicas (TODO mapear exactamente).

## Seeds de ejemplo

- `pnpm --filter @apps/api run fx:seed` — inserta tipos de cambio BCE ficticios (script de ejemplo).

---

Consulta `docs/requirements.md` para el documento de requisitos completo.

## Instalación de requisitos en Windows y WSL

### Windows (nativo)

- Node.js LTS: instala el MSI de Node 20 LTS o usa nvm-windows.
- pnpm vía Corepack:
  - `corepack enable`
  - `corepack prepare pnpm@latest --activate`
- Git para Windows (opcional si no lo tienes).
- Docker Desktop: instala y activa el backend WSL2. Verifica con `docker --version` y `docker compose version`.
- Playwright (para E2E web): tras instalar dependencias del repo, ejecuta `pnpm --filter @apps/web exec playwright install`.

### WSL (Ubuntu 22.04+ recomendado)

- Habilitar WSL2 (desde Windows): `wsl --install -d Ubuntu` y reinicia si es necesario.
- Paquetes base dentro de WSL:
  - `sudo apt update && sudo apt install -y build-essential git curl ca-certificates`
- Node LTS con nvm (dentro de WSL):
  - `curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
  - `source ~/.nvm/nvm.sh && nvm install --lts && nvm use --lts`
- pnpm vía Corepack (dentro de WSL):
  - `corepack enable`
  - `corepack prepare pnpm@latest --activate`
- Docker en WSL: instala Docker Desktop en Windows y en Settings → Resources → WSL Integration, habilita tu distro. Verifica dentro de WSL con `docker info`.
- Playwright en WSL (deps gráficas):
  - `pnpm --filter @apps/web exec playwright install`
  - `pnpm --filter @apps/web exec playwright install-deps` (instala librerías del sistema necesarias en Ubuntu).

### Verificación rápida

- `node -v` → v20.x, `pnpm -v`, `docker --version`, `git --version`.
- Clona el repo en el sistema de archivos de Linux (ej. `~/projects/...`) para mejor rendimiento en WSL.
- Si ves el aviso de "Ignored build scripts...", ejecuta:
  - `pnpm approve-builds` y aprueba `@prisma/client`, `@prisma/engines`, `prisma`, `esbuild`, `@nestjs/core`.
  - Después, `pnpm --filter @apps/api prisma generate` (o `pnpm -w run build`) para asegurar la generación del cliente de Prisma.
