import { prisma } from './dist/lib/db.js'

async function check() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
  const count = await prisma.knowledgeGraph.count()
  console.log('Total graphs:', count)
  const all = await prisma.knowledgeGraph.findMany()
  console.log('All graphs:', all)
}

check().catch(console.error)
