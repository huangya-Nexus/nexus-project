# 知链 Nexus - 技术开发执行手册

## 快速导航

本文档整合技术架构与项目推进计划，提供可直接执行的技术开发路线图。

**适用对象**: 技术负责人、全栈工程师、AI工程师  
**文档版本**: v1.0  
**最后更新**: 2026-03-27

---

## 一、技术战略概览

### 1.1 技术目标与业务目标对齐

| 业务目标 | 技术目标 | 关键指标 |
|---------|---------|---------|
| M2验证需求 | 完成技术选型，搭建开发环境 | 开发效率 |
| M4MVP上线 | 核心功能可用，支持1000用户 | 系统稳定性 |
| M6商业模式验证 | 支付系统上线，数据报表完善 | 转化率数据 |
| M9盈亏平衡 | 支持1万用户，成本可控 | 性能/成本比 |
| M12规模化 | 支持10万用户，架构可扩展 | 系统吞吐量 |

### 1.2 技术决策原则

```
1. 快速验证优先于完美架构
   └── MVP阶段允许技术债务，但需记录并规划偿还

2. 云服务优先于自建基础设施
   └── 使用托管服务降低运维成本，专注业务开发

3. AI能力渐进式增强
   └── 初期调用API快速验证，后期逐步自建模型降成本

4. 数据驱动技术迭代
   └── 完善监控埋点，用数据指导优化方向
```

---

## 二、分阶段技术路线图

### Phase 1: 基础搭建 (Week 1-2 / M1)

#### Week 1: 项目初始化

**Day 1-2: 环境准备**
```bash
# 任务清单
□ 创建GitHub仓库，设置分支保护规则
□ 配置开发环境 (Node.js 20, Docker, Git)
□ 搭建本地数据库 (Docker Compose)
□ 申请云服务账号 (阿里云/AWS)
□ 配置域名和SSL证书
```

**技术产出**:
- GitHub仓库: `github.com/nexus-team/nexus`
- Docker Compose配置
- 开发环境文档

**Day 3-4: 技术架构确认**
```bash
# 任务清单
□ 评审并确认技术栈选型
□ 设计系统架构图
□ 定义API规范 (OpenAPI)
□ 制定代码规范和Git工作流
□ 选择并配置CI/CD工具
```

**技术产出**:
- 架构设计文档
- API规范文档
- 代码规范文档
- CI/CD配置 (GitHub Actions)

**Day 5-7: 基础框架搭建**
```bash
# 后端任务
□ Express + TypeScript项目脚手架
□ 配置ESLint + Prettier
□ 集成Prisma ORM
□ 实现基础错误处理和日志
□ 配置Swagger文档

# 前端任务
□ React + Vite + TypeScript脚手架
□ 配置Tailwind CSS + Chakra UI
□ 集成React Router
□ 配置Axios和API客户端
□ 实现基础布局组件
```

**技术产出**:
- 可运行的前后端基础框架
- 数据库连接配置
- 基础组件库

#### Week 2: 核心基础设施

**Day 8-10: 数据库设计与实现**
```sql
-- PostgreSQL核心表
□ users表 (用户管理)
□ knowledge_graphs表 (图谱元数据)
□ knowledge_nodes表 (知识点)
□ knowledge_edges表 (关联关系)
□ import_tasks表 (导入任务)

-- Neo4j图模型
□ User节点
□ KnowledgeGraph节点
□ KnowledgeNode节点
□ 关系: OWNS, CONTAINS, RELATED, PREREQUISITE

-- Redis缓存策略
□ session:{token} - 用户会话
□ user:{id}:profile - 用户资料
□ graph:{id}:metadata - 图谱元数据
```

**技术产出**:
- 数据库Schema定义
- Prisma迁移文件
- Neo4j约束和索引
- 数据库连接池配置

**Day 11-12: 认证与权限系统**
```bash
# 任务清单
□ JWT认证实现 (access + refresh token)
□ 用户注册/登录API
□ 密码加密 (bcrypt)
□ 邮箱验证流程
□ 基础权限控制 (RBAC)
```

**技术产出**:
- 认证中间件
- 用户相关API (6个端点)
- 前端登录/注册页面

**Day 13-14: 开发环境完善**
```bash
# 任务清单
□ 配置开发/测试/生产环境变量
□ 搭建本地Docker开发环境
□ 配置日志系统 (Winston)
□ 集成错误监控 (Sentry)
□ 编写README和开发文档
```

**技术产出**:
- 多环境配置文件
- docker-compose.dev.yml
- 开发文档

**Phase 1验收标准**:
- [ ] 开发环境可一键启动
- [ ] 用户注册/登录流程跑通
- [ ] 代码提交自动触发CI检查
- [ ] 团队所有成员环境配置完成

---

### Phase 2: MVP核心功能 (Week 3-6 / M2-M3)

#### Week 3: 知识管理基础

**Day 15-17: 知识图谱CRUD**
```bash
# API开发
POST   /api/v1/graphs              # 创建图谱
GET    /api/v1/graphs              # 获取列表
GET    /api/v1/graphs/:id          # 获取详情
PUT    /api/v1/graphs/:id          # 更新图谱
DELETE /api/v1/graphs/:id          # 删除图谱

# 前端页面
□ 图谱列表页
□ 创建图谱弹窗
□ 图谱详情页框架
```

**Day 18-19: 知识点管理**
```bash
# API开发
POST   /api/v1/graphs/:id/nodes    # 创建节点
GET    /api/v1/nodes/:id           # 获取详情
PUT    /api/v1/nodes/:id           # 更新节点
DELETE /api/v1/nodes/:id           # 删除节点

# 前端组件
□ 节点编辑器 (富文本)
□ 节点卡片组件
□ 节点列表视图
```

**Day 20-21: 知识关联**
```bash
# API开发
POST   /api/v1/edges               # 创建关联
PUT    /api/v1/edges/:id           # 更新关联
DELETE /api/v1/edges/:id           # 删除关联

# Neo4j集成
□ 关联数据同步到Neo4j
□ 基础图谱查询
```

**技术产出**:
- 完整的知识管理API
- 基础图谱编辑界面

#### Week 4: AI能力集成

**Day 22-24: AI服务架构**
```bash
# 架构设计
□ AI服务抽象层 (支持多提供商)
□ 请求队列 (Bull + Redis)
□ 配额管理系统
□ 结果缓存机制

# 核心Prompt设计
□ 知识点提取Prompt
□ 关联推荐Prompt
□ 摘要生成Prompt
```

**代码结构**:
```typescript
// services/ai/ai-service.ts
interface AIService {
  extractKnowledge(text: string): Promise<KnowledgeNode[]>;
  suggestRelations(nodeA: Node, nodeB: Node): Promise<RelationSuggestion>;
  generateSummary(content: string): Promise<string>;
}

// OpenAI实现
class OpenAIService implements AIService {
  // 实现细节
}
```

**Day 25-26: 知识提取功能**
```bash
# API开发
POST /api/v1/ai/extract            # 从文本提取知识点

# 功能实现
□ Markdown文本解析
□ 调用OpenAI API提取
□ 结果格式化和存储
□ 错误处理和重试机制
```

**Day 27-28: 导入功能**
```bash
# API开发
POST /api/v1/import                # 创建导入任务
GET  /api/v1/import/:id/status     # 查询进度

# 支持的格式
□ Markdown文件
□ 纯文本文件
□ 批量处理队列
```

**技术产出**:
- AI服务模块
- 知识提取功能
- 文件导入功能

#### Week 5: 可视化与优化

**Day 29-31: 知识图谱可视化**
```bash
# 技术选型: react-force-graph
□ 力导向图谱渲染
□ 节点拖拽和缩放
□ 点击选中高亮
□ 关联线样式

# 性能优化
□ 虚拟渲染 (1000+节点)
□ 懒加载策略
□ 动画优化
```

**Day 32-33: AI关联推荐**
```bash
# API开发
POST /api/v1/edges/ai-suggest      # AI推荐关联

# 算法逻辑
□ 基于Embedding的相似度计算
□ 内容语义分析
□ 推荐结果排序
□ 用户反馈收集
```

**Day 34-35: 性能优化**
```bash
# 后端优化
□ API响应时间优化 (<200ms)
□ 数据库查询优化 (索引、N+1)
□ Redis缓存策略

# 前端优化
□ 代码分割和懒加载
□ 图片和资源优化
□ 首屏加载优化
```

**技术产出**:
- 可交互的知识图谱
- AI关联推荐功能
- 性能优化报告

#### Week 6: 内测准备

**Day 36-38: 测试与修复**
```bash
# 测试覆盖
□ 单元测试 (>60%覆盖率)
□ API集成测试
□ 前端组件测试
□ 端到端测试 (关键流程)

# Bug修复
□ 内测Bug清单
□ 优先级排序
□ 紧急修复
```

**Day 39-40: 部署准备**
```bash
# 生产环境
□ 云服务器配置
□ 数据库部署
□ 域名和HTTPS配置
□ 监控和日志系统

# CI/CD
□ 自动化部署流程
□ 蓝绿部署策略
□ 回滚机制
```

**Day 41-42: 内测发布**
```bash
□ 部署到生产环境
□ 邀请100位内测用户
□ 建立反馈渠道 (微信群)
□ 数据监控看板
```

**Phase 2验收标准**:
- [ ] 核心功能完整可用
- [ ] 支持100并发用户
- [ ] API响应时间P99<500ms
- [ ] 100位内测用户，日活>30%

---

### Phase 3: 产品化 (Week 7-12 / M4-M6)

#### Month 4: 功能增强

**Week 7: 协作功能**
```bash
# WebSocket实时协作
□ Socket.io集成
□ 多人编辑同步
□ 光标位置显示
□ 操作冲突解决 (OT算法)

# 权限管理
□ 图谱分享设置
□ 只读/编辑权限
□ 协作者管理
```

**Week 8: 移动端适配**
```bash
# 响应式设计
□ 移动端布局优化
□ 触摸交互适配
□ 性能优化

# PWA支持
□ Service Worker
□ 离线缓存
□ 添加到主屏
```

**Week 9: 模板系统**
```bash
# 模板功能
□ 模板库设计
□ 考研/考证模板
□ 模板应用流程
□ 用户自定义模板
```

**Week 10: 导出与分享**
```bash
# 导出功能
□ Markdown导出
□ PDF导出 (Puppeteer)
□ 图片导出 (Canvas)
□ 批量导出

# 分享功能
□ 公开链接分享
□ 嵌入代码
□ 社交媒体分享
```

#### Month 5: 商业化准备

**Week 11: 支付系统**
```bash
# 支付集成
□ 微信支付
□ 支付宝
□ 订阅管理
□ 发票系统

# 套餐设计
□ 免费版限制
□ 个人版功能
□ 专业版功能
□ 企业版功能
```

**Week 12: 数据分析**
```bash
# 埋点系统
□ 用户行为埋点
□ 功能使用统计
□ 转化漏斗分析

# 数据看板
□ 用户增长看板
□ 收入分析看板
□ 产品指标看板
```

**Phase 3验收标准**:
- [ ] 付费系统上线
- [ ] 100+付费用户
- [ ] 付费转化率>5%
- [ ] 月收入>¥1万

---

### Phase 4: 规模化架构 (Month 7-9)

#### Month 7: 性能优化

**Week 13-14: 数据库优化**
```bash
# PostgreSQL优化
□ 读写分离
□ 分表策略 (按用户ID)
□ 连接池优化
□ 慢查询优化

# Neo4j优化
□ 查询优化
□ 索引优化
□ 集群部署
```

**Week 15-16: 缓存策略**
```bash
# 多级缓存
□ 本地缓存 (Node-cache)
□ Redis分布式缓存
□ CDN静态资源缓存
□ 浏览器缓存策略

# 缓存更新
□ 缓存失效策略
□ 异步更新机制
□ 缓存穿透防护
```

#### Month 8: 架构升级

**Week 17-18: 微服务拆分**
```bash
# 服务拆分
□ API Gateway (Kong/Nginx)
□ 用户服务独立
□ 知识服务独立
□ AI服务独立

# 服务通信
□ gRPC内部通信
□ 消息队列 (RabbitMQ)
□ 服务发现 (Consul)
```

**Week 19-20: 容器化与编排**
```bash
# Docker化
□ 所有服务Dockerfile
□ Docker Compose编排
□ 镜像仓库 (Harbor)

# Kubernetes
□ K8s部署配置
□ 自动扩缩容 (HPA)
□ 服务网格 (Istio，可选)
```

#### Month 9: 高可用与监控

**Week 21-22: 高可用架构**
```bash
# 多可用区部署
□ 跨可用区部署
□ 数据库主从复制
□ 自动故障转移

# 数据备份
□ 自动备份策略
□ 异地备份
□ 恢复演练
```

**Week 23-24: 监控告警**
```bash
# 监控体系
□ Prometheus + Grafana
□ 应用性能监控 (APM)
□ 日志聚合 (ELK/Loki)
□ 链路追踪 (Jaeger)

# 告警机制
□ 多渠道告警 (钉钉/邮件)
□ 告警分级
□ 自动恢复
```

**Phase 4验收标准**:
- [ ] 支持1万并发用户
- [ ] 系统可用性99.9%
- [ ] 故障恢复时间<5分钟
- [ ] 数据备份RPO<1小时

---

### Phase 5: 平台化 (Month 10-12)

#### Month 10-11: 开放平台

**Week 25-28: API开放平台**
```bash
# 开放API
□ OAuth2.0认证
□ API文档 (Swagger)
□ SDK开发 (JS/Python)
□ 开发者控制台

# 插件系统
□ 插件架构设计
□ 插件开发文档
□ 插件市场 (基础)
```

**Week 29-32: 企业功能**
```bash
# 企业版功能
□ SSO单点登录 (SAML/OIDC)
□ 组织架构管理
□ 权限管理 (RBAC)
□ 审计日志
□ 私有化部署选项
```

#### Month 12: 国际化与优化

**Week 33-36: 国际化**
```bash
# i18n
□ 英文版上线
□ 多语言框架 (i18next)
□ 翻译管理系统

# 海外部署
□ CDN全球加速
□ 海外服务器 (AWS)
□ 合规性检查 (GDPR)
```

**Phase 5验收标准**:
- [ ] API开放平台上线
- [ ] 企业版功能完整
- [ ] 英文版上线
- [ ] 支持10万用户

---

## 三、技术团队配置

### 3.1 团队结构

```
技术负责人 (1人)
├── 后端组
│   ├── 后端工程师 (2-3人)
│   └── DevOps工程师 (1人，M6后加入)
├── 前端组
│   ├── 前端工程师 (2人)
│   └── 移动端工程师 (1人，M6后加入)
└── AI组
    └── AI工程师 (1-2人)
```

### 3.2 招聘时间线

| 角色 | M1 | M2 | M3 | M4 | M5 | M6 | M7+ |
|------|----|----|----|----|----|----|-----|
| 技术负责人 | ✅ | | | | | | |
| 全栈工程师 | ✅ | ✅ | | | | | |
| AI工程师 | | ✅ | | | | | |
| 前端工程师 | | | ✅ | | | | |
| DevOps工程师 | | | | | | ✅ | |
| 移动端工程师 | | | | | | ✅ | |

### 3.3 技术债务管理

| 阶段 | 技术债务 | 偿还计划 |
|------|---------|---------|
| MVP | 单体架构、基础权限 | M4开始拆分服务 |
| M4-M6 | 缺少测试、文档不全 | M5补充测试和文档 |
| M7-M9 | 单点故障、性能瓶颈 | M8架构升级 |
| M10+ | 代码耦合、技术栈老旧 | 持续重构 |

---

## 四、开发规范

### 4.1 Git工作流

```bash
# 分支模型: Git Flow简化版
main        # 生产分支，只接受hotfix和release
  ↑
develop     # 开发分支，日常开发
  ↑
feature/*   # 功能分支，从develop创建
  ↑
hotfix/*    # 紧急修复，从main创建

# 提交规范
<type>(<scope>): <subject>

类型:
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

示例:
feat(knowledge): 添加AI知识提取功能
fix(auth): 修复token过期不刷新问题
```

### 4.2 代码规范

**TypeScript规范**:
```typescript
// 命名规范
interface UserConfig { }     // 接口: PascalCase
type UserRole = 'admin';    // 类型: PascalCase
const MAX_RETRY = 3;        // 常量: UPPER_SNAKE_CASE
function getUserById() { }  // 函数: camelCase
class KnowledgeService { }  // 类: PascalCase

// 类型安全
// ✅ 显式定义返回类型
async function fetchUser(id: string): Promise<User> { }

// ✅ 使用严格类型
interface Props {
  title: string;        // 必填
  description?: string; // 可选
  onClick: () => void;  // 函数类型
}
```

**React规范**:
```typescript
// 组件结构
// ✅ 函数组件 + Hooks
const KnowledgeGraph: React.FC<Props> = ({ graphId }) => {
  // 1. Hooks
  const { data, loading } = useGraph(graphId);
  
  // 2. 状态
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // 3. 副作用
  useEffect(() => {
    // 副作用逻辑
  }, [graphId]);
  
  // 4. 事件处理
  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);
  
  // 5. 渲染
  return (
    <div className="knowledge-graph">
      {/* JSX */}
    </div>
  );
};
```

### 4.3 测试规范

```bash
# 测试金字塔
E2E测试 (10%)     # Cypress/Playwright
  ↑
集成测试 (30%)    # Supertest + Test DB
  ↑
单元测试 (60%)    # Jest/Vitest

# 覆盖率要求
- 单元测试: >70%
- 集成测试: 核心API覆盖
- E2E测试: 关键用户流程
```

---

## 五、技术风险管理

### 5.1 技术风险登记册

| 风险ID | 描述 | 可能性 | 影响 | 应对策略 | 责任人 |
|--------|------|--------|------|---------|--------|
| T01 | AI API响应慢/不可用 | 中 | 高 | 实现降级策略，本地缓存 | AI工程师 |
| T02 | 图谱渲染性能差 | 中 | 高 | 虚拟渲染，Web Worker | 前端工程师 |
| T03 | 数据库性能瓶颈 | 中 | 高 | 读写分离，分表策略 | 后端工程师 |
| T04 | 并发用户超限 | 低 | 高 | 限流，自动扩容 | DevOps |
| T05 | 数据丢失 | 低 | 极高 | 自动备份，异地容灾 | DevOps |
| T06 | 安全漏洞 | 中 | 高 | 安全审计，依赖更新 | 安全负责人 |

### 5.2 应急预案

**场景: OpenAI API不可用**
```bash
# 检测
□ 监控API响应时间和错误率
□ 自动切换告警

# 应对措施
1. 自动切换到备用API (Claude)
2. 启用本地缓存结果
3. 降级为手动模式
4. 通知用户AI功能暂时受限

# 恢复
□ API恢复后自动切换回主服务
□ 补偿处理队列中的任务
```

**场景: 数据库性能告警**
```bash
# 检测
□ 监控查询响应时间
□ 监控连接池使用率
□ 监控慢查询日志

# 应对措施
1. 启用查询缓存
2. 限制非关键查询
3. 临时扩容数据库
4. 紧急优化慢查询

# 长期解决
□ 读写分离架构
□ 分库分表方案
□ 缓存策略优化
```

---

## 六、技术产出清单

### 6.1 文档产出

| 文档 | 责任人 | 截止时间 | 状态 |
|------|--------|---------|------|
| 架构设计文档 | 技术负责人 | M1 W2 | ⬜ |
| API规范文档 | 后端负责人 | M1 W2 | ⬜ |
| 数据库设计文档 | 后端工程师 | M1 W2 | ⬜ |
| 开发规范文档 | 技术负责人 | M1 W2 | ⬜ |
| 部署手册 | DevOps | M2 W6 | ⬜ |
| 监控告警手册 | DevOps | M4 W12 | ⬜ |
| 安全规范文档 | 安全负责人 | M3 W9 | ⬜ |

### 6.2 代码产出

| 模块 | 功能点 | 负责人 | 截止时间 |
|------|--------|--------|---------|
| 用户系统 | 注册/登录/权限 | 后端A | M1 W2 |
| 知识管理 | 图谱/节点/关联CRUD | 后端A+前端A | M2 W4 |
| AI服务 | 提取/推荐/摘要 | AI工程师 | M2 W6 |
| 可视化 | 图谱渲染/交互 | 前端A | M2 W6 |
| 支付系统 | 订阅/订单/发票 | 后端B | M4 W11 |
| 协作功能 | 实时编辑/权限 | 前端B+后端B | M4 W8 |
| 移动端 | 响应式/PWA | 前端A | M4 W10 |

---

## 七、关键检查点

### 7.1 技术里程碑检查

| 检查点 | 时间 | 检查项 | 通过标准 |
|--------|------|--------|---------|
| **T1** | M1 W2 | 基础架构 | 开发环境可一键启动 |
| **T2** | M2 W6 | MVP功能 | 核心功能可用，100内测用户 |
| **T3** | M4 W12 | 产品化 | 付费系统上线，100+付费用户 |
| **T4** | M6 W12 | 商业化 | 月收入>¥10万 |
| **T5** | M9 W12 | 规模化 | 支持1万用户，99.9%可用性 |
| **T6** | M12 W12 | 平台化 | 支持10万用户，API开放 |

### 7.2 每周检查清单

```bash
# 每周五下午检查
□ 本周任务完成率
□ 代码提交和审查情况
□ Bug修复情况
□ 性能指标监控
□ 下周计划调整
```

---

## 八、资源与工具

### 8.1 开发工具

| 类别 | 工具 | 用途 |
|------|------|------|
| IDE | VS Code + Cursor | 代码开发 |
| API测试 | Postman/Insomnia | API调试 |
| 数据库 | TablePlus/DBeaver | 数据库管理 |
| 设计 | Figma | UI设计协作 |
| 文档 | Notion/Feishu | 技术文档 |
| 沟通 | 飞书/钉钉 | 团队沟通 |

### 8.2 云服务资源

| 服务 | 提供商 | 预估月费用 |
|------|--------|-----------|
| 云服务器 | 阿里云ECS | ¥800 |
| 数据库 | RDS PostgreSQL | ¥600 |
| 图数据库 | Neo4j Aura | ¥500 |
| 缓存 | Redis | ¥200 |
| 对象存储 | OSS | ¥100 |
| CDN | 阿里云CDN | ¥200 |
| AI API | OpenAI | ¥2000 |
| 监控 | 云监控+Sentry | ¥200 |
| **总计** | | **¥4600/月** |

---

**文档版本**: v1.0  
**制定日期**: 2026-03-27  
**下次评审**: 每周五  
**负责人**: [待指定技术负责人]

---

*本文档为动态文档，将根据实际开发进度每周更新*
