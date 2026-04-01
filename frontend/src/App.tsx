import { useState, lazy, Suspense } from 'react'
import './App.css'

// 懒加载组件
const Dashboard = lazy(() => import('./Dashboard'))
const Login = lazy(() => import('./Login'))
const Register = lazy(() => import('./Register'))
const SimpleSearch = lazy(() => import('./components/SimpleSearch'))
const ExternalSearch = lazy(() => import('./components/ExternalSearch'))
const SimpleGraphSearch = lazy(() => import('./components/SimpleGraphSearch'))

// 加载中组件
const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>🧠</div>
      <div>加载中...</div>
    </div>
  </div>
)

type Page = 'home' | 'login' | 'register' | 'dashboard'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showExternalSearch, setShowExternalSearch] = useState(false)
  const [showGraphSearch, setShowGraphSearch] = useState(false)
  const [searchMode, setSearchMode] = useState<'local' | 'global' | 'graph'>('local')

  // 渲染不同页面
  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onNavigate={setCurrentPage} />
      case 'register':
        return <Register onNavigate={setCurrentPage} />
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />
      default:
        return (
          <div style={{ 
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {/* 顶部导航栏 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 50px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                🧠 知链 Nexus
              </div>
              
              <div>
                <button 
                  onClick={() => setCurrentPage('register')}
                  style={{
                    marginRight: '15px',
                    padding: '10px 25px',
                    border: '2px solid white',
                    borderRadius: '25px',
                    background: 'transparent',
                    color: 'white',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  注册账号
                </button>
                <button 
                  onClick={() => setCurrentPage('login')}
                  style={{
                    padding: '10px 25px',
                    border: 'none',
                    borderRadius: '25px',
                    background: 'white',
                    color: '#667eea',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  登录
                </button>
              </div>
            </div>

            {/* 中间内容区 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '70vh',
              color: 'white'
            }}>
              {/* 主标题 */}
              <h1 
                className="animate-fade-in-down"
                style={{
                  fontSize: '72px',
                  margin: '0 0 20px 0',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                知链 Nexus
              </h1>

              {/* 副标题 */}
              <p 
                className="animate-fade-in-up"
                style={{
                  fontSize: '24px',
                  margin: '0 0 50px 0',
                  opacity: 0.9
                }}
              >
                AI 驱动的知识图谱学习工具
              </p>

              {/* 搜索模式切换 */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '15px'
              }}>
                <button
                  onClick={() => setSearchMode('local')}
                  style={{
                    padding: '8px 20px',
                    background: searchMode === 'local' ? 'white' : 'rgba(255,255,255,0.2)',
                    color: searchMode === 'local' ? '#667eea' : 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: searchMode === 'local' ? 'bold' : 'normal'
                  }}
                >
                  📚 本地搜索
                </button>
                <button
                  onClick={() => setSearchMode('global')}
                  style={{
                    padding: '8px 20px',
                    background: searchMode === 'global' ? 'white' : 'rgba(255,255,255,0.2)',
                    color: searchMode === 'global' ? '#667eea' : 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: searchMode === 'global' ? 'bold' : 'normal'
                  }}
                >
                  🌐 全网搜索
                </button>
                <button
                  onClick={() => setSearchMode('graph')}
                  style={{
                    padding: '8px 20px',
                    background: searchMode === 'graph' ? 'white' : 'rgba(255,255,255,0.2)',
                    color: searchMode === 'graph' ? '#667eea' : 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: searchMode === 'graph' ? 'bold' : 'normal'
                  }}
                >
                  🕸️ 知识图谱
                </button>
              </div>

              {/* 搜索框 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'white',
                borderRadius: '50px',
                padding: '5px',
                width: '600px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
              }}>
                <span style={{
                  padding: '0 20px',
                  fontSize: '20px'
                }}>
                  {searchMode === 'local' ? '🔍' : searchMode === 'global' ? '🌐' : '🕸️'}
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      if (searchMode === 'local') {
                        setShowSearchResults(true)
                      } else if (searchMode === 'global') {
                        setShowExternalSearch(true)
                      } else {
                        setShowGraphSearch(true)
                      }
                    }
                  }}
                  placeholder={
                    searchMode === 'local' 
                      ? "搜索本地知识图谱..." 
                      : searchMode === 'global'
                        ? "搜索维基百科、arXiv、GitHub等..."
                        : "输入关键词，查看知识图谱关联..."
                  }
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '18px',
                    padding: '15px 0'
                  }}
                />
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      if (searchMode === 'local') {
                        setShowSearchResults(true)
                      } else if (searchMode === 'global') {
                        setShowExternalSearch(true)
                      } else {
                        setShowGraphSearch(true)
                      }
                    } else {
                      alert('请输入搜索关键词')
                    }
                  }}
                  style={{
                    padding: '15px 30px',
                    border: 'none',
                    borderRadius: '50px',
                    background: searchMode === 'graph' ? '#f59e0b' : searchMode === 'global' ? '#22c55e' : '#667eea',
                    color: 'white',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {searchMode === 'local' ? '搜索' : searchMode === 'global' ? '🌐 全网搜索' : '🕸️ 生成知识图谱'}
                </button>
              </div>

              {/* 底部提示 */}
              <p style={{
                marginTop: '30px',
                opacity: 0.7,
                fontSize: '14px'
              }}>
                已有 10,000+ 学习者在使用知链构建知识体系
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fadeInDown 0.8s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out 0.3s both; }
      `}</style>
      {renderPage()}
      <Suspense fallback={<LoadingFallback />}>
        {showSearchResults && searchQuery && (
          <SimpleSearch
            query={searchQuery}
            onClose={() => setShowSearchResults(false)}
          />
        )}

        {showExternalSearch && searchQuery && (
          <ExternalSearch
            query={searchQuery}
            onClose={() => setShowExternalSearch(false)}
            onImport={(_content) => {
              setShowExternalSearch(false)
              alert('内容已找到！请登录后使用 AI 导入功能提取知识点')
            }}
          />
        )}

        {showGraphSearch && searchQuery && (
          <SimpleGraphSearch
            query={searchQuery}
            onClose={() => setShowGraphSearch(false)}
          />
        )}
      </Suspense>
    </>
  )
}

export default App
