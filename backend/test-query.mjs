import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  const userId = '288bc74f-70e1-4d9e-b0de-2f6e6ca5626d'
  console.log('Testing with userId:', userId)
  
  const graphs = await prisma.knowledgeGraph.findMany({
    where: { userId, status: 'ACTIVE' }
  })
  
  console.log('Found graphs:', graphs.length)
  console.log(graphs)
  
  const total = await prisma.knowledgeGraph.count({
    where: { userId, status: 'ACTIVE' }
  })
  
  console.log('Total count:', total)
}

test().catch(console.error).finally(() => prisma.$disconnect())
