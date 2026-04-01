import { prisma } from './dist/lib/db.js'
import { verifyToken } from './dist/lib/jwt.js'

async function test() {
  // 1. 登录
  const loginRes = await fetch('http://localhost:3001/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: '123456' })
  })
  const loginData = await loginRes.json()
  console.log('1. Login response:', { userId: loginData.user?.id, hasToken: !!loginData.token })
  
  // 2. 验证 token
  const payload = verifyToken(loginData.token)
  console.log('2. Token payload:', payload)
  
  // 3. 直接查询数据库
  const directQuery = await prisma.knowledgeGraph.findMany({
    where: { userId: payload.userId, status: 'ACTIVE' }
  })
  console.log('3. Direct query result:', directQuery.length, 'graphs')
  
  // 4. 通过 API 查询
  const apiRes = await fetch('http://localhost:3001/api/graphs', {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  })
  const apiData = await apiRes.json()
  console.log('4. API response:', { 
    graphCount: apiData.graphs?.length, 
    total: apiData.pagination?.total,
    debug: apiData.debug
  })
}

test().catch(console.error)
