import { useState, useEffect } from 'react'
import SimpleGraph from './components/SimpleGraph'
import NodeDetail from './components/NodeDetail'
import UserSettings from './components/UserSettings'
import SearchPanel from './components/SearchPanel'
import BackupRestore from './components/BackupRestore'
import SharePanel from './components/SharePanel'
import StatsPanel from './components/StatsPanel'
import FileUpload from './components/FileUpload'
import ReviewPanel from './components/ReviewPanel'
import ExternalSearch from './components/ExternalSearch'

interface DashboardProps {
  onNavigate: (page: 'home' | 'login' | 'register' | 'dashboard') => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// 图谱模板
const GRAPH_TEMPLATES = [
  { id: '', name: '空白图谱', description: '', icon: '📄' },
  { id: 'kaoyan', name: '考研复习', description: '考研科目知识点整理', icon: '🎓' },
  { id: 'cpa', name: 'CPA 会计', description: '注册会计师会计科目', icon: '💼' },
  { id: 'language', name: '语言学习', description: '外语单词和语法学习', icon: '🌍' },
  { id: 'programming', name: '编程学习', description: '编程语言和框架学习', icon: '💻' },
  { id: 'book', name: '读书笔记', description: '书籍内容整理和笔记', icon: '📚' },
  { id: 'medical', name: '医学学习', description: '医学知识和临床技能', icon: '🏥' },
  { id: 'law', name: '法律学习', description: '法律条文和案例分析', icon: '⚖️' },
  { id: 'history', name: '历史学习', description: '历史事件和人物', icon: '🏛️' },
  { id: 'science', name: '科学知识', description: '物理化学生物等科学', icon: '🔬' },
  { id: 'business', name: '商业分析', description: '商业模式和市场分析', icon: '📊' },
  { id: 'design', name: '设计学习', description: 'UI/UX和设计理论', icon: '🎨' }
]

function Dashboard({ onNavigate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('graphs')
  const [graphs, setGraphs] = useState<any[]>([])
  const [selectedGraph, setSelectedGraph] = useState<any>(null)
  const [graphData, setGraphData] = useState<{ nodes: any[], edges: any[] }>({ nodes: [], edges: [] })
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [showNodeDetail, setShowNodeDetail] = useState(false)
  const [showUserSettings, setShowUserSettings] = useState(false)
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [showBackupRestore, setShowBackupRestore] = useState(false)
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [showStatsPanel, setShowStatsPanel] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showReviewPanel, setShowReviewPanel] = useState(false)
  const [showExternalSearch, setShowExternalSearch] = useState(false)
  const [externalSearchQuery, setExternalSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // 表单状态
  const [newGraphTitle, setNewGraphTitle] = useState('')
  const [newGraphDesc, setNewGraphDesc] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [importText, setImportText] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  

  
  // 关联创建状态
  const [showCreateEdge, setShowCreateEdge] = useState(false)
  const [edgeSourceId, setEdgeSourceId] = useState('')
  const [edgeTargetId, setEdgeTargetId] = useState('')
  const [edgeType, setEdgeType] = useState('RELATED')
  const [edgeLabel, setEdgeLabel] = useState('')
  
  // AI 推荐关联状态
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false)

  const getToken = () => localStorage.getItem('token') || ''

  useEffect(() => {
    fetchGraphs()
    
    // 检查是否有待处理的搜索
    const pendingSearch = localStorage.getItem('pendingSearchQuery')
    if (pendingSearch) {
      localStorage.removeItem('pendingSearchQuery')
      // 延迟打开搜索面板，等待数据加载
      setTimeout(() => {
        setShowSearchPanel(true)
      }, 500)
    }
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchPanel(true)
      }
      // ESC 关闭搜索面板
      if (e.key === 'Escape') {
        setShowSearchPanel(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (selectedGraph) {
      fetchGraphDetail(selectedGraph.id)
    }
  }, [selectedGraph])

  const fetchGraphs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/graphs`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          onNavigate('login')
          return
        }
        throw new Error('加载失败')
      }
      
      const data = await res.json()
      if (data.graphs) {
        setGraphs(data.graphs)
        if (data.graphs.length > 0 && !selectedGraph) {
          setSelectedGraph(data.graphs[0])
        }
      }
    } catch (err) {
      setError('加载图谱失败')
    }
  }

  const fetchGraphDetail = async (graphId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/graphs/${graphId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      
      if (!res.ok) throw new Error('加载详情失败')
      
      const data = await res.json()
      if (data.graph) {
        setGraphData({
          nodes: data.graph.nodes || [],
          edges: data.graph.edges || []
        })
      }
    } catch (err) {
      setError('加载图谱详情失败')
    }
    setLoading(false)
  }

  // 创建图谱
  const handleCreateGraph = async () => {
    if (!newGraphTitle.trim()) {
      setError('请输入图谱名称')
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/graphs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          title: newGraphTitle,
          description: newGraphDesc,
          template: selectedTemplate
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || '创建失败')
        return
      }

      // 如果选择了模板，添加示例知识点
      if (selectedTemplate && data.graph) {
        await addTemplateNodes(data.graph.id, selectedTemplate)
      }

      setMessage('图谱创建成功！')
      setNewGraphTitle('')
      setNewGraphDesc('')
      setSelectedTemplate('')
      fetchGraphs()
      setActiveTab('graphs')
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('创建图谱失败')
    }
  }

  // 添加模板示例节点
  const addTemplateNodes = async (graphId: string, templateId: string) => {
    const templateNodes: Record<string, any[]> = {
      'kaoyan': [
        { title: '马克思主义基本原理', content: '马克思主义哲学、政治经济学和科学社会主义是马克思主义的三个基本组成部分。马克思主义哲学包括辩证唯物主义和历史唯物主义；政治经济学研究资本主义生产方式的规律；科学社会主义揭示社会主义和共产主义必然代替资本主义的历史趋势。', keywords: ['马克思主义', '哲学', '政治经济学', '科学社会主义'] },
        { title: '毛泽东思想', content: '毛泽东思想是马克思列宁主义在中国的运用和发展，是被实践证明了的关于中国革命和建设的正确的理论原则和经验总结。主要包括新民主主义革命理论、社会主义革命和建设理论、革命军队建设和军事战略理论等。', keywords: ['毛泽东', '思想', '中国革命', '新民主主义'] },
        { title: '中国特色社会主义', content: '中国特色社会主义包括邓小平理论、三个代表重要思想、科学发展观。邓小平理论回答了什么是社会主义、怎样建设社会主义；三个代表回答了建设什么样的党、怎样建设党；科学发展观回答了实现什么样的发展、怎样发展。', keywords: ['特色社会主义', '邓小平', '三个代表', '科学发展观'] },
        { title: '习近平新时代中国特色社会主义思想', content: '习近平新时代中国特色社会主义思想是当代中国马克思主义、二十一世纪马克思主义，是中华文化和中国精神的时代精华。核心内容包括八个明确和十四个坚持。', keywords: ['习近平', '新时代', '中国梦', '民族复兴'] }
      ],
      'cpa': [
        { title: '会计基础理论', content: '会计基本假设包括会计主体、持续经营、会计分期和货币计量。会计信息质量要求包括可靠性、相关性、可理解性、可比性、实质重于形式、重要性、谨慎性和及时性。会计要素包括资产、负债、所有者权益、收入、费用和利润。', keywords: ['会计', '基本假设', '会计要素', '信息质量'] },
        { title: '财务报表分析', content: '财务报表包括资产负债表、利润表、现金流量表和所有者权益变动表。资产负债表反映企业在某一特定日期的财务状况；利润表反映企业在一定会计期间的经营成果；现金流量表反映企业在一定会计期间的现金和现金等价物流入和流出。', keywords: ['财务', '报表', '资产负债表', '利润表', '现金流量表'] },
        { title: '成本会计与管理', content: '成本会计主要研究成本的核算、控制和分析。成本按性态分为固定成本、变动成本和混合成本。成本核算方法包括品种法、分批法、分步法。成本控制方法包括标准成本法、预算控制、责任会计等。', keywords: ['成本', '核算', '控制', '标准成本'] },
        { title: '审计理论与实务', content: '审计是由独立的专门机构或人员接受委托，对被审计单位的财政、财务收支及其他经济活动的真实性、合法性和效益性进行审查和评价的独立性经济监督活动。审计风险包括固有风险、控制风险和检查风险。', keywords: ['审计', '风险', '内部控制', '审计报告'] }
      ],
      'language': [
        { title: '词汇积累策略', content: '词汇学习应遵循艾宾浩斯遗忘曲线，采用间隔重复法。建议每天学习20-30个新词，同时复习旧词。使用词根词缀法、联想记忆法、语境记忆法等多种方法。建立个人词汇本，按主题分类整理。', keywords: ['词汇', '记忆', '艾宾浩斯', '间隔重复'] },
        { title: '语法体系构建', content: '语法学习应从词法到句法循序渐进。词法包括词性、词形变化；句法包括句子成分、句子类型、从句等。重点掌握时态语态、非谓语动词、虚拟语气、倒装句等难点。通过大量阅读和写作巩固语法知识。', keywords: ['语法', '时态', '从句', '非谓语动词'] },
        { title: '听说能力训练', content: '听力训练应从慢速材料开始，逐步过渡到常速。采用精听和泛听相结合的方法。口语训练要克服心理障碍，大胆开口。可以通过跟读、复述、情景对话等方式提高。利用语言交换平台寻找语伴。', keywords: ['听力', '口语', '精听', '泛听', '语伴'] },
        { title: '阅读与写作技巧', content: '阅读要培养快速浏览和精读的能力。掌握略读、寻读、细读等不同阅读策略。写作要从模仿开始，逐步培养独立写作能力。注意段落结构、过渡衔接、词汇多样性。定期写作并请他人批改。', keywords: ['阅读', '写作', '略读', '精读', '段落结构'] }
      ],
      'programming': [
        { title: '编程基础概念', content: '编程基础包括变量、数据类型、运算符、控制结构（条件语句、循环语句）、函数等核心概念。理解内存管理、算法复杂度分析。掌握调试技巧和错误处理方法。培养良好的代码风格和注释习惯。', keywords: ['编程', '变量', '数据类型', '函数', '算法'] },
        { title: '数据结构与算法', content: '数据结构包括数组、链表、栈、队列、树、图、哈希表等。算法包括排序、搜索、递归、动态规划、贪心算法等。理解时间复杂度和空间复杂度分析。掌握常见问题的最优解法。', keywords: ['数据结构', '算法', '复杂度', '排序', '动态规划'] },
        { title: '面向对象编程', content: '面向对象编程的三大特性：封装、继承、多态。理解类与对象、构造函数、析构函数、访问控制。掌握设计模式：单例模式、工厂模式、观察者模式、策略模式等。理解SOLID原则。', keywords: ['面向对象', '封装', '继承', '多态', '设计模式'] },
        { title: 'Web开发技术栈', content: '前端技术：HTML、CSS、JavaScript、React/Vue、TypeScript。后端技术：Node.js、Python、数据库。全栈开发：RESTful API、GraphQL、微服务架构。DevOps：Git、Docker、CI/CD。', keywords: ['Web', '前端', '后端', 'React', 'Node.js', 'Docker'] }
      ],
      'book': [
        { title: '书籍核心观点提炼', content: '阅读时要抓住作者的核心论点和主要结论。关注序言、结语和各章小结。识别书中的关键概念和理论框架。思考作者试图解决什么问题，提出了什么解决方案。记录让你印象深刻的金句。', keywords: ['核心观点', '论点', '结论', '金句'] },
        { title: '章节结构梳理', content: '梳理书籍的整体结构和各章节的逻辑关系。制作章节思维导图，标注重点内容。记录每章的核心内容、关键论据和重要案例。注意章节之间的过渡和衔接，理解作者的论证思路。', keywords: ['章节', '结构', '思维导图', '论证'] },
        { title: '批判性思考与反思', content: '不盲从作者观点，保持批判性思维。思考：作者的论据是否充分？论证是否有逻辑漏洞？观点是否有偏见？与已有知识对比，是否有冲突？在实践中如何应用这些知识？', keywords: ['批判性思维', '反思', '论证', '应用'] },
        { title: '知识迁移与实践', content: '将书中知识与现实生活和工作联系。思考如何应用这些知识解决实际问题。制定行动计划，将理论转化为实践。定期回顾和更新读书笔记，形成个人知识体系。', keywords: ['知识迁移', '实践', '行动计划', '知识体系'] }
      ],
      'medical': [
        { title: '人体解剖学基础', content: '人体解剖学是研究正常人体形态结构的科学。包括系统解剖学和局部解剖学。主要系统：运动系统、消化系统、呼吸系统、泌尿系统、生殖系统、循环系统、感觉器、神经系统、内分泌系统。', keywords: ['解剖学', '人体结构', '器官系统'] },
        { title: '生理学核心概念', content: '生理学是研究生物体功能的科学。包括细胞生理、神经生理、循环生理、呼吸生理、消化生理、泌尿生理、内分泌生理等。稳态是生理学的核心概念，指内环境的相对稳定状态。', keywords: ['生理学', '稳态', '细胞', '器官功能'] },
        { title: '病理学基础', content: '病理学是研究疾病发生发展规律的科学。包括病理解剖学和病理生理学。基本病理过程：炎症、肿瘤、变性、坏死、凋亡等。理解疾病的病因、发病机制、病理变化和转归。', keywords: ['病理学', '炎症', '肿瘤', '病因'] },
        { title: '临床诊断技能', content: '临床诊断包括病史采集、体格检查、辅助检查。问诊技巧：主诉、现病史、既往史、个人史、家族史。体格检查：视诊、触诊、叩诊、听诊。辅助检查：实验室检查、影像学检查、病理检查等。', keywords: ['诊断', '问诊', '体格检查', '辅助检查'] }
      ],
      'law': [
        { title: '法律基础理论', content: '法律是由国家制定或认可，由国家强制力保证实施的行为规范。法的特征：规范性、国家意志性、普遍性、强制性、程序性。法律体系包括宪法、民法、刑法、行政法、经济法、社会法、程序法等。', keywords: ['法律', '法理', '法律体系', '宪法'] },
        { title: '民法典核心内容', content: '民法典是调整平等主体之间人身关系和财产关系的法律。包括总则、物权、合同、人格权、婚姻家庭、继承、侵权责任七编。核心原则：平等原则、自愿原则、公平原则、诚信原则、公序良俗原则。', keywords: ['民法典', '物权', '合同', '人格权', '侵权责任'] },
        { title: '刑法与刑事诉讼', content: '刑法是规定犯罪和刑罚的法律。刑法原则：罪刑法定、刑法面前人人平等、罪责刑相适应。犯罪构成要件：客体、客观方面、主体、主观方面。刑事诉讼法规定刑事诉讼的程序和制度。', keywords: ['刑法', '犯罪', '刑罚', '刑事诉讼'] },
        { title: '合同法实务', content: '合同是平等主体之间设立、变更、终止民事权利义务关系的协议。合同的订立：要约、承诺。合同的效力：有效、无效、可撤销、效力待定。合同的履行、变更、转让、终止。违约责任。', keywords: ['合同法', '要约', '承诺', '违约', '责任'] }
      ],
      'history': [
        { title: '中国古代史', content: '中国古代史从远古到1840年鸦片战争。重要朝代：夏商周、秦汉、三国两晋南北朝、隋唐、五代十国、宋元明清。重要制度：分封制、郡县制、科举制、三省六部制。重要事件：商鞅变法、秦始皇统一、贞观之治、郑和下西洋等。', keywords: ['古代史', '朝代', '制度', '科举'] },
        { title: '中国近现代史', content: '中国近现代史从1840年鸦片战争到1949年新中国成立。重大事件：鸦片战争、太平天国、洋务运动、甲午战争、戊戌变法、辛亥革命、五四运动、抗日战争、解放战争。重要人物：林则徐、孙中山、毛泽东等。', keywords: ['近代史', '鸦片战争', '辛亥革命', '抗日战争'] },
        { title: '世界古代文明', content: '世界古代文明包括：古埃及文明、古巴比伦文明、古印度文明、古希腊文明、古罗马文明、中华文明。文明的特征：文字、城市、国家、金属冶炼等。文明交流：丝绸之路、亚历山大东征等。', keywords: ['古代文明', '埃及', '希腊', '罗马', '丝绸之路'] },
        { title: '世界近现代史', content: '世界近现代史包括文艺复兴、宗教改革、启蒙运动、资产阶级革命、工业革命、两次世界大战、冷战、全球化等重大历史进程。理解历史发展的规律和趋势，培养全球视野。', keywords: ['文艺复兴', '工业革命', '世界大战', '冷战', '全球化'] }
      ],
      'science': [
        { title: '物理学基础', content: '物理学研究物质、能量、空间和时间的基本规律。力学：牛顿定律、动量守恒、能量守恒。电磁学：电场、磁场、电磁波。热学：热力学定律、统计物理。光学：光的波粒二象性。近代物理：相对论、量子力学。', keywords: ['物理', '力学', '电磁学', '相对论', '量子'] },
        { title: '化学核心概念', content: '化学研究物质的组成、结构、性质和变化。原子结构：原子核、电子云、元素周期表。化学键：离子键、共价键、金属键。化学反应：化学平衡、反应速率、氧化还原、酸碱反应。有机化学：烃、醇、醛、酮、酸等。', keywords: ['化学', '原子', '化学键', '反应', '有机'] },
        { title: '生物学基础', content: '生物学研究生命现象和生命活动规律。细胞是生命的基本单位。遗传的分子基础：DNA、RNA、蛋白质。进化论：自然选择、适者生存。生态学：生态系统、食物链、生物多样性。人体生理：消化、循环、呼吸、神经、内分泌等系统。', keywords: ['生物', '细胞', 'DNA', '进化', '生态'] },
        { title: '地球与环境科学', content: '地球科学包括地质学、气象学、海洋学、天文学等。地球结构：地壳、地幔、地核。板块构造：大陆漂移、海底扩张、板块边界。环境问题：全球变暖、污染、资源枯竭。可持续发展：清洁能源、循环经济、生态保护。', keywords: ['地球', '地质', '气象', '环境', '可持续'] }
      ],
      'business': [
        { title: '商业分析框架', content: '商业分析常用框架：SWOT分析（优势、劣势、机会、威胁）、PEST分析（政治、经济、社会、技术）、波特五力模型、价值链分析、BCG矩阵等。掌握这些框架可以系统性地分析企业和行业。', keywords: ['商业分析', 'SWOT', 'PEST', '五力模型'] },
        { title: '市场营销策略', content: '营销4P理论：产品（Product）、价格（Price）、渠道（Place）、促销（Promotion）。STP战略：市场细分（Segmentation）、目标市场（Targeting）、定位（Positioning）。数字营销：SEO、SEM、社交媒体营销、内容营销等。', keywords: ['营销', '4P', 'STP', '数字营销'] },
        { title: '财务管理基础', content: '财务报表分析：资产负债表、利润表、现金流量表。财务比率分析：盈利能力、偿债能力、营运能力、成长能力。投资决策：NPV、IRR、投资回收期。融资方式：股权融资、债权融资、内部融资。', keywords: ['财务', '报表', '投资', '融资', '比率'] },
        { title: '战略管理与创新', content: '战略管理过程：战略分析、战略制定、战略实施、战略控制。竞争战略：成本领先、差异化、集中化。创新管理：产品创新、流程创新、商业模式创新。数字化转型：大数据、人工智能、云计算在商业中的应用。', keywords: ['战略', '创新', '数字化', '转型'] }
      ],
      'design': [
        { title: '设计基础理论', content: '设计基本原则：对比、重复、对齐、亲密性。色彩理论：色相、明度、饱和度，色彩搭配，色彩心理学。排版设计：字体选择、字号层级、行距字距、网格系统。视觉层次：通过大小、颜色、位置建立信息层级。', keywords: ['设计', '色彩', '排版', '视觉层次'] },
        { title: '用户体验设计', content: 'UX设计以用户为中心，关注用户需求、行为和情感。设计流程：用户研究、信息架构、交互设计、视觉设计、可用性测试。用户研究方法：访谈、问卷、观察、用户画像、用户旅程地图。可用性原则：尼尔森十大可用性原则。', keywords: ['UX', '用户体验', '用户研究', '可用性'] },
        { title: 'UI设计规范', content: 'UI设计关注界面的视觉呈现和交互细节。设计系统：色彩系统、字体系统、图标系统、组件库。平台规范：iOS Human Interface Guidelines、Material Design。设计工具：Figma、Sketch、Adobe XD。交付规范：标注、切图、设计说明。', keywords: ['UI', '界面', '设计系统', 'Figma'] },
        { title: '设计思维方法', content: '设计思维是一种以人为本的创新方法论。五个阶段：同理心、定义问题、构思方案、原型制作、测试验证。快速原型：低保真原型、高保真原型、可交互原型。迭代优化：基于用户反馈持续改进设计方案。', keywords: ['设计思维', '原型', '迭代', '创新'] }
      ]
    }

    const nodes = templateNodes[templateId] || []
    for (const node of nodes) {
      await fetch(`${API_URL}/api/graphs/${graphId}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(node)
      })
    }
  }

  // AI 导入
  const handleAIImport = async () => {
    if (!importText.trim() || importText.length < 10) {
      setError('请输入至少10个字符的内容')
      return
    }

    if (!selectedGraph) {
      setError('请先选择一个图谱')
      return
    }

    setImportLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          graphId: selectedGraph.id,
          type: 'TEXT',
          content: importText,
          filename: 'pasted-text.txt'
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '导入失败')
        return
      }

      setMessage(`成功导入 ${data.importedCount} 个知识点！`)
      setImportText('')
      fetchGraphDetail(selectedGraph.id)
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('AI 导入失败')
    }

    setImportLoading(false)
  }

  // 编辑节点
  const handleEditNode = async (node: any) => {
    try {
      const res = await fetch(`${API_URL}/api/graphs/${selectedGraph.id}/nodes/${node.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          title: node.title,
          content: node.content
        })
      })

      if (!res.ok) throw new Error('更新失败')

      setMessage('知识点更新成功！')
      fetchGraphDetail(selectedGraph.id)
      setShowNodeDetail(false)
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('更新知识点失败')
    }
  }

  // 删除节点
  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('确定要删除这个知识点吗？')) return

    try {
      const res = await fetch(`${API_URL}/api/graphs/${selectedGraph.id}/nodes/${nodeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })

      if (!res.ok) throw new Error('删除失败')

      setMessage('知识点删除成功！')
      fetchGraphDetail(selectedGraph.id)
      setShowNodeDetail(false)
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('删除知识点失败')
    }
  }

  // 生成 AI 摘要
  const handleGenerateSummary = async (nodeId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ nodeId })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '生成失败')
        return
      }

      setMessage('AI 摘要生成成功！')
      fetchGraphDetail(selectedGraph.id)
      
      // 更新选中的节点
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode({ ...selectedNode, summary: data.summary })
      }
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('生成摘要失败')
    }
  }

  const handleNodeClick = (node: any) => {
    setSelectedNode(node)
    setShowNodeDetail(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    onNavigate('home')
  }

  // 导出图谱为 Markdown
  const handleExportGraph = () => {
    if (!selectedGraph || graphData.nodes.length === 0) {
      setError('没有可导出的内容')
      return
    }

    let markdown = `# ${selectedGraph.title}\n\n`
    if (selectedGraph.description) {
      markdown += `${selectedGraph.description}\n\n`
    }
    markdown += `---\n\n`

    // 添加所有知识点
    graphData.nodes.forEach((node: any, index: number) => {
      markdown += `## ${index + 1}. ${node.title}\n\n`
      if (node.summary) {
        markdown += `> 🤖 AI 摘要: ${node.summary}\n\n`
      }
      markdown += `${node.content}\n\n`
      if (node.keywords && node.keywords.length > 0) {
        markdown += `**关键词:** ${node.keywords.join(', ')}\n\n`
      }
      markdown += `---\n\n`
    })

    // 添加关联信息
    if (graphData.edges.length > 0) {
      markdown += `## 知识关联\n\n`
      graphData.edges.forEach((edge: any) => {
        const source = graphData.nodes.find((n: any) => n.id === edge.sourceId)
        const target = graphData.nodes.find((n: any) => n.id === edge.targetId)
        if (source && target) {
          const typeMap: Record<string, string> = {
            'RELATED': '相关',
            'PREREQUISITE': '前置',
            'EXTENDS': '扩展',
            'SIMILAR': '相似',
            'CONTRASTS': '对比'
          }
          markdown += `- ${source.title} → ${target.title} (${typeMap[edge.type] || edge.type})\n`
        }
      })
      markdown += '\n'
    }

    markdown += `\n---\n\n*由 知链 Nexus 导出*`

    // 下载文件
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedGraph.title}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setMessage('导出成功！')
    setTimeout(() => setMessage(''), 3000)
  }

  // 删除图谱
  const handleDeleteGraph = async () => {
    if (!selectedGraph) return
    
    if (!confirm(`确定要删除图谱 "${selectedGraph.title}" 吗？\n此操作不可恢复！`)) {
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/graphs/${selectedGraph.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })

      if (!res.ok) throw new Error('删除失败')

      setMessage('图谱删除成功！')
      setSelectedGraph(null)
      fetchGraphs()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('删除图谱失败')
    }
  }

  // AI 推荐关联
  const handleAiSuggestRelations = async () => {
    if (!selectedGraph) return
    
    setAiSuggestLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/ai/suggest-relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          graphId: selectedGraph.id,
          nodeId: selectedNode?.id || graphData.nodes[0]?.id
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '获取推荐失败')
        return
      }

      setAiSuggestions(data.suggestions || [])
      setShowAiSuggestions(true)
    } catch (err) {
      setError('获取 AI 推荐失败')
    }
    setAiSuggestLoading(false)
  }

  // 创建关联
  const handleCreateEdge = async () => {
    if (!edgeSourceId || !edgeTargetId) {
      setError('请选择源节点和目标节点')
      return
    }

    if (edgeSourceId === edgeTargetId) {
      setError('不能关联自身')
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/graphs/${selectedGraph.id}/edges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          sourceId: edgeSourceId,
          targetId: edgeTargetId,
          type: edgeType,
          label: edgeLabel
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '创建关联失败')
        return
      }

      setMessage('关联创建成功！')
      setShowCreateEdge(false)
      setEdgeSourceId('')
      setEdgeTargetId('')
      setEdgeLabel('')
      fetchGraphDetail(selectedGraph.id)
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('创建关联失败')
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        background: 'white',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          color: '#667eea',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          🧠 知链 Nexus
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={() => setShowReviewPanel(true)}
            style={{
              padding: '8px 20px',
              border: '1px solid #ddd',
              borderRadius: '20px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            🎯 复习
          </button>
          <button
            onClick={() => setShowStatsPanel(true)}
            style={{
              padding: '8px 20px',
              border: '1px solid #ddd',
              borderRadius: '20px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            📊 统计
          </button>
          <button
            onClick={() => setShowUserSettings(true)}
            style={{
              padding: '8px 20px',
              border: '1px solid #ddd',
              borderRadius: '20px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            ⚙️ 设置
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 20px',
              border: '1px solid #ddd',
              borderRadius: '20px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            退出
          </button>
        </div>
      </div>

      {/* 消息提示 */}
      {(error || message) && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '30px',
          padding: '15px 20px',
          background: error ? '#ff6b6b' : '#51cf66',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          {error || message}
          <button 
            onClick={() => { setError(''); setMessage('') }}
            style={{
              marginLeft: '10px',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        {/* 左侧菜单 */}
        <div style={{
          width: '200px',
          background: 'white',
          minHeight: 'calc(100vh - 60px)',
          borderRight: '1px solid #e0e0e0',
          padding: '20px 0'
        }}>
          {['graphs', 'create', 'ai'].map((tab) => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '15px 20px',
                cursor: 'pointer',
                background: activeTab === tab ? '#f0f0f0' : 'transparent',
                borderLeft: activeTab === tab ? '3px solid #667eea' : '3px solid transparent',
                color: activeTab === tab ? '#667eea' : '#666'
              }}
            >
              {tab === 'graphs' && '📊 我的图谱'}
              {tab === 'create' && '➕ 创建图谱'}
              {tab === 'ai' && '🤖 AI 导入'}
            </div>
          ))}
        </div>

        {/* 主内容区 */}
        <div style={{ flex: 1, padding: '30px' }}>
          {activeTab === 'graphs' && (
            <div>
              {/* 搜索栏 */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => setShowSearchPanel(true)}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    textAlign: 'left',
                    color: '#999',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span>🔍</span>
                  <span>搜索知识点...</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#ccc' }}>⌘K</span>
                </button>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div>
                  <h2 style={{ margin: '0 0 10px 0' }}>我的知识图谱</h2>
                  {selectedGraph && (
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      当前: {selectedGraph.title} | 
                      📝 {graphData.nodes.length} 个知识点 | 
                      🔗 {graphData.edges.length} 个关联
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    value={selectedGraph?.id || ''}
                    onChange={(e) => {
                      const graph = graphs.find(g => g.id === e.target.value)
                      setSelectedGraph(graph)
                    }}
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  >
                    {graphs.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                  {selectedGraph && (
                    <>
                      <button 
                        onClick={() => setShowBackupRestore(true)}
                        style={{
                          padding: '10px 20px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        💾 备份
                      </button>
                      <button 
                        onClick={() => setShowSharePanel(true)}
                        style={{
                          padding: '10px 20px',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        🔗 分享
                      </button>
                      <button 
                        onClick={handleExportGraph}
                        style={{
                          padding: '10px 20px',
                          background: '#51cf66',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        📥 导出
                      </button>
                      <button 
                        onClick={handleDeleteGraph}
                        style={{
                          padding: '10px 20px',
                          background: '#ff6b6b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ 删除
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 创建关联和 AI 推荐按钮 */}
              {graphData.nodes.length >= 2 && (
                <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowCreateEdge(!showCreateEdge)}
                    style={{
                      padding: '10px 20px',
                      background: showCreateEdge ? '#f0f0f0' : '#667eea',
                      color: showCreateEdge ? '#667eea' : 'white',
                      border: '1px solid #667eea',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    {showCreateEdge ? '取消' : '➕ 创建关联'}
                  </button>
                  <button
                    onClick={handleAiSuggestRelations}
                    disabled={aiSuggestLoading}
                    style={{
                      padding: '10px 20px',
                      background: aiSuggestLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: aiSuggestLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {aiSuggestLoading ? '🤖 分析中...' : '🤖 AI 推荐关联'}
                  </button>
                </div>
              )}

              {/* AI 推荐结果 */}
              {showAiSuggestions && aiSuggestions.length > 0 && (
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0 }}>🤖 AI 推荐的关联</h4>
                    <button 
                      onClick={() => setShowAiSuggestions(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                    >
                      ×
                    </button>
                  </div>
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} style={{
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {suggestion.targetTitle}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          关系: {suggestion.label} | 置信度: {(suggestion.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          // 自动填充创建关联表单
                          setEdgeSourceId(selectedNode?.id || graphData.nodes[0]?.id)
                          setEdgeTargetId(suggestion.targetId)
                          setEdgeType(suggestion.type)
                          setEdgeLabel(suggestion.label)
                          setShowCreateEdge(true)
                          setShowAiSuggestions(false)
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#51cf66',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        采用
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 创建关联表单 */}
              {showCreateEdge && (
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ margin: '0 0 15px 0' }}>创建知识关联</h4>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>源节点</label>
                      <select
                        value={edgeSourceId}
                        onChange={(e) => setEdgeSourceId(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '150px' }}
                      >
                        <option value="">选择节点</option>
                        {graphData.nodes.map((n: any) => (
                          <option key={n.id} value={n.id}>{n.title}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ fontSize: '20px', color: '#999' }}>→</div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>目标节点</label>
                      <select
                        value={edgeTargetId}
                        onChange={(e) => setEdgeTargetId(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '150px' }}
                      >
                        <option value="">选择节点</option>
                        {graphData.nodes.map((n: any) => (
                          <option key={n.id} value={n.id}>{n.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>关联类型</label>
                      <select
                        value={edgeType}
                        onChange={(e) => setEdgeType(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                      >
                        <option value="RELATED">相关</option>
                        <option value="PREREQUISITE">前置</option>
                        <option value="EXTENDS">扩展</option>
                        <option value="SIMILAR">相似</option>
                        <option value="CONTRASTS">对比</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>标签（可选）</label>
                      <input
                        type="text"
                        value={edgeLabel}
                        onChange={(e) => setEdgeLabel(e.target.value)}
                        placeholder="如：继承发展"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', width: '120px' }}
                      />
                    </div>
                    <button
                      onClick={handleCreateEdge}
                      style={{
                        padding: '8px 20px',
                        background: '#51cf66',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      创建
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#666' }}>
                  加载中...
                </div>
              ) : (
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}>
                  {graphData.nodes.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: '100px 0' }}>
                      <p style={{ fontSize: '18px', marginBottom: '10px' }}>暂无知识点</p>
                      <p>切换到"🤖 AI 导入"标签添加知识点</p>
                    </div>
                  ) : (
                    <SimpleGraph
                      data={graphData}
                      onNodeClick={handleNodeClick}
                      selectedNodeId={selectedNode?.id}
                      width={900}
                      height={500}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div>
              <h2 style={{ marginBottom: '20px' }}>创建新图谱</h2>
              
              {/* 模板选择 */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>选择模板</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '20px'
                }}>
                  {GRAPH_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template.id)
                        if (template.id) {
                          setNewGraphTitle(template.name)
                          setNewGraphDesc(template.description)
                        } else {
                          setNewGraphTitle('')
                          setNewGraphDesc('')
                        }
                      }}
                      style={{
                        padding: '20px',
                        background: selectedTemplate === template.id ? '#667eea' : 'white',
                        color: selectedTemplate === template.id ? 'white' : '#333',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: selectedTemplate === template.id ? 'none' : '1px solid #e0e0e0',
                        boxShadow: selectedTemplate === template.id ? '0 4px 12px rgba(102, 126, 234, 0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>{template.icon}</div>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{template.name}</div>
                      {template.description && (
                        <div style={{ fontSize: '13px', opacity: 0.8 }}>{template.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 表单 */}
              <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                maxWidth: '500px'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    图谱名称 *
                  </label>
                  <input 
                    type="text"
                    value={newGraphTitle}
                    onChange={(e) => setNewGraphTitle(e.target.value)}
                    placeholder="例如：考研英语词汇"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    描述
                  </label>
                  <textarea 
                    value={newGraphDesc}
                    onChange={(e) => setNewGraphDesc(e.target.value)}
                    placeholder="简单描述这个图谱的内容..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      minHeight: '100px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <button 
                  onClick={handleCreateGraph}
                  style={{
                    padding: '12px 30px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  创建图谱
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div>
              <h2 style={{ marginBottom: '20px' }}>🤖 AI 智能导入</h2>

              <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    目标图谱
                  </label>
                  <select
                    value={selectedGraph?.id || ''}
                    onChange={(e) => {
                      const graph = graphs.find(g => g.id === e.target.value)
                      setSelectedGraph(graph)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  >
                    {graphs.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>

                {/* 文件上传按钮 */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    上传文件
                  </label>
                  <button
                    onClick={() => setShowFileUpload(true)}
                    disabled={!selectedGraph}
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: !selectedGraph ? '#f3f4f6' : 'white',
                      border: '2px dashed #667eea',
                      borderRadius: '8px',
                      cursor: !selectedGraph ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      color: !selectedGraph ? '#999' : '#667eea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                  >
                    <span>📁</span>
                    <span>点击上传 PDF、Word 或文本文件</span>
                  </button>
                  {!selectedGraph && (
                    <p style={{ marginTop: '8px', fontSize: '13px', color: '#999' }}>
                      请先选择一个目标图谱
                    </p>
                  )}
                </div>

                <div style={{ textAlign: 'center', margin: '20px 0', color: '#999' }}>
                  — 或 —
                </div>

                {/* 全网搜索 */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    全网搜索
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={externalSearchQuery}
                      onChange={(e) => setExternalSearchQuery(e.target.value)}
                      placeholder="搜索维基百科、arXiv、GitHub..."
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                    <button
                      onClick={() => {
                        if (externalSearchQuery.trim()) {
                          setShowExternalSearch(true)
                        }
                      }}
                      disabled={!externalSearchQuery.trim()}
                      style={{
                        padding: '12px 20px',
                        background: externalSearchQuery.trim() ? '#667eea' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: externalSearchQuery.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '16px'
                      }}
                    >
                      🌐 搜索
                    </button>
                  </div>
                  <p style={{ marginTop: '8px', fontSize: '13px', color: '#999' }}>
                    支持：维基百科 · arXiv · GitHub · PubMed
                  </p>
                </div>

                <div style={{ textAlign: 'center', margin: '20px 0', color: '#999' }}>
                  — 或 —
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    粘贴文本
                  </label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="在这里粘贴教材内容、笔记、文章...&#10;AI 会自动提取关键知识点"
                    style={{
                      width: '100%',
                      padding: '15px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      minHeight: '200px',
                      fontSize: '16px',
                      lineHeight: '1.6'
                    }}
                  />
                </div>

                <button
                  onClick={handleAIImport}
                  disabled={importLoading}
                  style={{
                    padding: '12px 30px',
                    background: importLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: importLoading ? 'not-allowed' : 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {importLoading ? 'AI 处理中...' : '🤖 AI 提取知识点'}
                </button>

                <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                  💡 提示：粘贴 100-5000 字的学习资料效果最佳
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 节点详情侧边栏 */}
      {showNodeDetail && selectedGraph && (
        <NodeDetail
          node={{
            ...selectedNode,
            keywords: selectedNode?.keywords || [],
            createdAt: selectedNode?.createdAt || new Date().toISOString()
          }}
          onClose={() => setShowNodeDetail(false)}
          onEdit={handleEditNode}
          onDelete={handleDeleteNode}
          onGenerateSummary={handleGenerateSummary}
        />
      )}

      {/* 用户设置侧边栏 */}
      {showUserSettings && (
        <UserSettings onClose={() => setShowUserSettings(false)} />
      )}

      {/* 统计面板 */}
      {showStatsPanel && (
        <StatsPanel onClose={() => setShowStatsPanel(false)} />
      )}

      {/* 搜索面板 */}
      {showSearchPanel && (
        <SearchPanel
          nodes={graphData.nodes}
          onNodeSelect={(node) => {
            handleNodeClick(node)
            setShowSearchPanel(false)
          }}
          onClose={() => setShowSearchPanel(false)}
        />
      )}

      {/* 备份/恢复面板 */}
      {showBackupRestore && selectedGraph && (
        <BackupRestore
          graphId={selectedGraph.id}
          onClose={() => setShowBackupRestore(false)}
          onImportSuccess={() => {
            fetchGraphs()
            setShowBackupRestore(false)
          }}
        />
      )}

      {/* 分享面板 */}
      {showSharePanel && selectedGraph && (
        <SharePanel
          graphId={selectedGraph.id}
          graphTitle={selectedGraph.title}
          onClose={() => setShowSharePanel(false)}
        />
      )}

      {/* 文件上传面板 */}
      {showFileUpload && selectedGraph && (
        <FileUpload
          graphId={selectedGraph.id}
          onUploadSuccess={(content) => {
            setImportText(content)
            setShowFileUpload(false)
            setMessage('📄 文件上传成功！内容已填充到文本框，点击"AI 提取知识点"继续')
          }}
          onClose={() => setShowFileUpload(false)}
        />
      )}

      {/* 复习面板 */}
      {showReviewPanel && (
        <ReviewPanel onClose={() => setShowReviewPanel(false)} />
      )}

      {/* 外部搜索面板 */}
      {showExternalSearch && (
        <ExternalSearch
          query={externalSearchQuery}
          onClose={() => setShowExternalSearch(false)}
          onImport={(content) => {
            setImportText(content)
            setShowExternalSearch(false)
            setMessage('🌐 外部内容已导入！点击"AI 提取知识点"继续')
          }}
        />
      )}

    </div>
  )
}

export default Dashboard
