import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  const today = new Date()
  const dateIso = today.toISOString().slice(0, 10)
  await prisma.fxRate.createMany({
    data: [
      { date: new Date(dateIso), base: 'EUR', quote: 'USD', rate: 1.100000 },
      { date: new Date(dateIso), base: 'EUR', quote: 'PLN', rate: 4.300000 },
      { date: new Date(dateIso), base: 'EUR', quote: 'BYN', rate: 3.500000 }
    ],
    skipDuplicates: true
  })
  // eslint-disable-next-line no-console
  console.log('Seeded FX rates for', dateIso)
  await prisma.$disconnect()
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})

