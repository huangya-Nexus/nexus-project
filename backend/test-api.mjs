import { prisma } from './dist/lib/db.js'

async function test() {
  // 模拟登录获取 token
  const loginRes = await fetch('http://localhost:3001/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: '123456' })
  })
  const loginData = await loginRes.json()
  console.log('Login userId:', loginData.user?.id)
  
  // 查询数据库
  const graphs = await prisma.knowledgeGraph.findMany({
    where: { userId: loginData.user?.id, status: 'ACTIVE' }
  })
  console.log('Found graphs for user:', graphs.length)
}

test().catch(console.error)
