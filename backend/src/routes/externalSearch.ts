import { Router } from 'express'
import { 
  searchWikipedia, 
  searchArxiv, 
  searchGitHub, 
  searchPubMed,
  multiSourceSearch 
} from '../services/externalSearch.js'

const router = Router()

// 维基百科搜索
router.get('/wikipedia', async (req, res) => {
  try {
    const { q, limit = '5' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '搜索关键词不能为空' })
    }

    const results = await searchWikipedia(q, parseInt(limit as string))
    
    res.json({
      source: 'wikipedia',
      query: q,
      results,
      total: results.length
    })

  } catch (error) {
    console.error('维基百科搜索路由错误:', error)
    res.status(500).json({ error: '搜索失败' })
  }
})

// arXiv 搜索
router.get('/arxiv', async (req, res) => {
  try {
    const { q, limit = '5' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '搜索关键词不能为空' })
    }

    const results = await searchArxiv(q, parseInt(limit as string))
    
    res.json({
      source: 'arxiv',
      query: q,
      results,
      total: results.length
    })

  } catch (error) {
    console.error('arXiv搜索路由错误:', error)
    res.status(500).json({ error: '搜索失败' })
  }
})

// GitHub 搜索
router.get('/github', async (req, res) => {
  try {
    const { q, limit = '5' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '搜索关键词不能为空' })
    }

    const results = await searchGitHub(q, parseInt(limit as string))
    
    res.json({
      source: 'github',
      query: q,
      results,
      total: results.length
    })

  } catch (error) {
    console.error('GitHub搜索路由错误:', error)
    res.status(500).json({ error: '搜索失败' })
  }
})

// PubMed 搜索
router.get('/pubmed', async (req, res) => {
  try {
    const { q, limit = '5' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '搜索关键词不能为空' })
    }

    const results = await searchPubMed(q, parseInt(limit as string))
    
    res.json({
      source: 'pubmed',
      query: q,
      results,
      total: results.length
    })

  } catch (error) {
    console.error('PubMed搜索路由错误:', error)
    res.status(500).json({ error: '搜索失败' })
  }
})

// 多源聚合搜索
router.get('/multi', async (req, res) => {
  try {
    const { q, sources = 'wikipedia,arxiv' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '搜索关键词不能为空' })
    }

    const sourceList = (sources as string).split(',')
    const results = await multiSourceSearch(q, sourceList)
    
    // 按来源分组
    const grouped = results.reduce((acc, item) => {
      if (!acc[item.source]) {
        acc[item.source] = []
      }
      acc[item.source].push(item)
      return acc
    }, {} as Record<string, typeof results>)

    res.json({
      query: q,
      sources: sourceList,
      results: grouped,
      total: results.length
    })

  } catch (error) {
    console.error('多源搜索路由错误:', error)
    res.status(500).json({ error: '搜索失败' })
  }
})

// CrossRef 搜索
router.get('/crossref', async (req, res) => {
  try {
    const { q, limit = '5' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '搜索关键词不能为空' })
    }

    const { searchCrossRef } = await import('../services/advancedSearch.js')
    const results = await searchCrossRef(q, parseInt(limit as string))
    
    res.json({
      source: 'crossref',
      query: q,
      results,
      total: results.length
    })

  } catch (error) {
    console.error('CrossRef搜索路由错误:', error)
    res.status(500).json({ error: '搜索失败' })
  }
})

// Semantic Scholar 搜索
router.get('/semantic_scholar', async (req, res) => {
  try {
    const { q, limit = '5' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '搜索关键词不能为空' })
    }

    const { searchSemanticScholar } = await import('../services/advancedSearch.js')
    const results = await searchSemanticScholar(q, parseInt(limit as string))
    
    res.json({
      source: 'semantic_scholar',
      query: q,
      results,
      total: results.length
    })

  } catch (error) {
    console.error('Semantic Scholar搜索路由错误:', error)
    res.status(500).json({ error: '搜索失败' })
  }
})

// 知乎搜索
router.get('/zhihu', async (req, res) => {
  try {
    const { q, limit = '5' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '搜索关键词不能为空' })
    }

    const { searchZhihu } = await import('../services/advancedSearch.js')
    const results = await searchZhihu(q, parseInt(limit as string))
    
    res.json({
      source: 'zhihu',
      query: q,
      results,
      total: results.length
    })

  } catch (error) {
    console.error('知乎搜索路由错误:', error)
    res.status(500).json({ error: '搜索失败' })
  }
})

// Bilibili 搜索
router.get('/bilibili', async (req, res) => {
  try {
    const { q, limit = '5' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '搜索关键词不能为空' })
    }

    const { searchBilibili } = await import('../services/advancedSearch.js')
    const results = await searchBilibili(q, parseInt(limit as string))
    
    res.json({
      source: 'bilibili',
      query: q,
      results,
      total: results.length
    })

  } catch (error) {
    console.error('Bilibili搜索路由错误:', error)
    res.status(500).json({ error: '搜索失败' })
  }
})

// 获取支持的搜索源
router.get('/sources', async (req, res) => {
  res.json({
    sources: [
      {
        id: 'wikipedia',
        name: '维基百科',
        description: '全球最大的中文百科全书',
        icon: '📚',
        category: 'general'
      },
      {
        id: 'arxiv',
        name: 'arXiv',
        description: '学术论文预印本平台',
        icon: '📄',
        category: 'academic'
      },
      {
        id: 'github',
        name: 'GitHub',
        description: '开源代码和技术文档',
        icon: '💻',
        category: 'tech'
      },
      {
        id: 'pubmed',
        name: 'PubMed',
        description: '医学文献数据库',
        icon: '🏥',
        category: 'medical'
      },
      {
        id: 'crossref',
        name: 'CrossRef',
        description: '学术文献数据库',
        icon: '📑',
        category: 'academic'
      },
      {
        id: 'semantic_scholar',
        name: 'Semantic Scholar',
        description: 'AI驱动的学术搜索',
        icon: '🎓',
        category: 'academic'
      },
      {
        id: 'zhihu',
        name: '知乎',
        description: '中文问答社区',
        icon: '❓',
        category: 'general'
      },
      {
        id: 'bilibili',
        name: '哔哩哔哩',
        description: '视频教程平台',
        icon: '📺',
        category: 'video'
      }
    ],
    premium_sources: [
      {
        id: 'baidu_scholar',
        name: '百度学术',
        description: '需要 SerpAPI Key',
        icon: '🔍',
        category: 'academic'
      },
      {
        id: 'google_scholar',
        name: 'Google Scholar',
        description: '需要 SerpAPI Key',
        icon: '🔍',
        category: 'academic'
      },
      {
        id: 'cnki',
        name: '中国知网',
        description: '需要机构访问权限',
        icon: '📚',
        category: 'academic'
      },
      {
        id: 'wanfang',
        name: '万方数据库',
        description: '需要机构访问权限',
        icon: '📚',
        category: 'academic'
      }
    ]
  })
})

export default router
