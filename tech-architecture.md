# 知链 Nexus - 技术架构与开发路径

## 一、系统架构总览

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              客户端层 (Client Layer)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Web App (React)        │  Mobile App (React Native)   │  Browser Extension │
│  ├─ 知识图谱可视化       │  ├─ 核心功能同步              │  ├─ 网页剪藏       │
│  ├─ 富文本编辑器         │  ├─ 离线支持                  │  └─ 快速添加       │
│  └─ 实时协作             │  └─ 推送通知                  │                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API网关层 (API Gateway)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   路由      │  │   认证      │  │   限流      │  │   日志      │        │
│  │  (Nginx)    │  │  (JWT)      │  │ (Redis)     │  │(CloudWatch) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            应用服务层 (Application Layer)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   用户服务       │  │   知识服务       │  │   图谱服务       │             │
│  │  (User Service) │  │(Knowledge Svc)  │  │  (Graph Service)│             │
│  │                 │  │                 │  │                 │             │
│  │  ├─ 注册/登录    │  │  ├─ 知识点CRUD   │  │  ├─ 图谱生成     │             │
│  │  ├─ 权限管理     │  │  ├─ 内容解析     │  │  ├─ 关联计算     │             │
│  │  └─ 用户配置     │  │  └─ 搜索/推荐    │  │  └─ 可视化数据   │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   AI服务         │  │   协作服务       │  │   通知服务       │             │
│  │   (AI Service)  │  │(Collaboration)  │  │ (Notification)  │             │
│  │                 │  │                 │  │                 │             │
│  │  ├─ 知识提取     │  │  ├─ 实时协作     │  │  ├─ 邮件推送     │             │
│  │  ├─ 关联推荐     │  │  ├─ 评论/讨论    │  │  ├─ 站内消息     │             │
│  │  └─ 内容生成     │  │  └─ 版本历史     │  │  └─ 微信模板     │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            数据层 (Data Layer)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   关系数据库     │  │   图数据库       │  │   缓存/队列      │             │
│  │  (PostgreSQL)   │  │   (Neo4j)       │  │   (Redis)       │             │
│  │                 │  │                 │  │                 │             │
│  │  ├─ 用户数据     │  │  ├─ 知识节点     │  │  ├─ 会话缓存     │             │
│  │  ├─ 知识内容     │  │  ├─ 关联关系     │  │  ├─ 热点数据     │             │
│  │  └─ 元数据       │  │  └─ 图谱索引     │  │  └─ 任务队列     │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                                   │
│  │   对象存储       │  │   搜索引擎       │                                   │
│  │   (S3/MinIO)    │  │ (Elasticsearch) │                                   │
│  │                 │  │                 │                                   │
│  │  ├─ 用户头像     │  │  ├─ 全文搜索     │                                   │
│  │  ├─ 附件文件     │  │  └─ 智能推荐     │                                   │
│  │  └─ 导出备份     │  │                 │                                   │
│  └─────────────────┘  └─────────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          外部服务层 (External Services)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  OpenAI     │  │   Claude    │  │   阿里云    │  │   腾讯云    │        │
│  │   API       │  │    API      │  │    OSS      │  │   短信服务   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

#### 前端技术栈
| 层级 | 技术 | 选型理由 |
|------|------|---------|
| **框架** | React 18 + TypeScript | 生态成熟，类型安全 |
| **状态管理** | Zustand | 轻量，无样板代码 |
| **UI组件** | Chakra UI / Ant Design | 快速开发，可定制 |
| **图谱可视化** | D3.js + React-Force-Graph | 灵活，性能优秀 |
| **编辑器** | Slate.js / Tiptap | 可扩展的富文本编辑 |
| **构建工具** | Vite | 快速热更新，优化构建 |
| **测试** | Vitest + React Testing Library | 现代测试方案 |

#### 后端技术栈
| 层级 | 技术 | 选型理由 |
|------|------|---------|
| **运行时** | Node.js 20 + Express | 全栈JavaScript，开发效率高 |
| **语言** | TypeScript | 类型安全，可维护性强 |
| **数据库ORM** | Prisma | 类型安全，迁移方便 |
| **验证** | Zod | 运行时类型验证 |
| **认证** | JWT + Passport.js | 成熟方案，生态丰富 |
| **文档** | Swagger/OpenAPI | 自动生成API文档 |
| **测试** | Jest + Supertest | 单元测试+集成测试 |

#### 数据存储
| 类型 | 技术 | 用途 |
|------|------|------|
| **关系数据库** | PostgreSQL 15 | 用户、知识内容、元数据 |
| **图数据库** | Neo4j Community | 知识关联、图谱查询 |
| **缓存** | Redis 7 | 会话、热点数据、队列 |
| **搜索** | Elasticsearch 8 | 全文搜索、智能推荐 |
| **对象存储** | MinIO / 阿里云OSS | 文件、图片、备份 |

#### AI/ML
| 服务 | 用途 | 成本估算 |
|------|------|---------|
| **OpenAI GPT-4** | 知识提取、关联推荐 | ¥0.03-0.06/千token |
| **OpenAI Embedding** | 语义搜索、相似度 | ¥0.001/千token |
| **Claude 3** | 长文本处理、内容生成 | 备选方案 |
| **自研模型** | 后期替代，降低成本 | 长期规划 |

#### 基础设施
| 类别 | 方案 | 成本估算 |
|------|------|---------|
| **容器化** | Docker + Docker Compose | 开发/测试 |
| **编排** | Kubernetes (后期) | 生产环境 |
| **CI/CD** | GitHub Actions | 免费额度 |
| **监控** | Prometheus + Grafana | 开源方案 |
| **日志** | ELK Stack / Loki | 开源方案 |

---

## 二、数据库设计

### 2.1 PostgreSQL 关系模型

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url VARCHAR(500),
    subscription_tier VARCHAR(20) DEFAULT 'free', -- free, personal, pro, enterprise
    subscription_expires_at TIMESTAMP,
    daily_ai_quota INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 知识图谱表
CREATE TABLE knowledge_graphs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 考研、考证、工作等
    is_public BOOLEAN DEFAULT false,
    node_count INTEGER DEFAULT 0,
    edge_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 知识点表
CREATE TABLE knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graph_id UUID REFERENCES knowledge_graphs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    content_type VARCHAR(20) DEFAULT 'markdown', -- markdown, text, html
    ai_summary TEXT,
    ai_keywords TEXT[],
    position_x FLOAT,
    position_y FLOAT,
    color VARCHAR(7) DEFAULT '#3182CE',
    icon VARCHAR(50),
    importance INTEGER DEFAULT 1, -- 1-5
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 知识关联表 (同时存在于PostgreSQL和Neo4j)
CREATE TABLE knowledge_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graph_id UUID REFERENCES knowledge_graphs(id) ON DELETE CASCADE,
    source_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    target_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL, -- related, prerequisite, similar, etc.
    relation_label VARCHAR(100),
    strength FLOAT DEFAULT 1.0, -- 关联强度 0-1
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_node_id, target_node_id, relation_type)
);

-- 导入任务表
CREATE TABLE import_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    graph_id UUID REFERENCES knowledge_graphs(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    file_url VARCHAR(500),
    file_type VARCHAR(50), -- markdown, pdf, word, txt
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 用户活动日志
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- create_node, create_edge, view_graph, etc.
    entity_type VARCHAR(50), -- node, edge, graph
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX idx_nodes_graph_id ON knowledge_nodes(graph_id);
CREATE INDEX idx_nodes_user_id ON knowledge_nodes(user_id);
CREATE INDEX idx_edges_graph_id ON knowledge_edges(graph_id);
CREATE INDEX idx_edges_source ON knowledge_edges(source_node_id);
CREATE INDEX idx_edges_target ON knowledge_edges(target_node_id);
CREATE INDEX idx_activities_user ON user_activities(user_id, created_at);
```

### 2.2 Neo4j 图模型

```cypher
// 节点标签
(:User {id, email, username})
(:KnowledgeGraph {id, title, category, userId})
(:KnowledgeNode {id, title, content, graphId, userId, embedding})

// 关系类型
(:User)-[:OWNS]->(:KnowledgeGraph)
(:KnowledgeGraph)-[:CONTAINS]->(:KnowledgeNode)
(:KnowledgeNode)-[:RELATED {type, strength, isAiGenerated}]->(:KnowledgeNode)
(:KnowledgeNode)-[:PREREQUISITE]->(:KnowledgeNode)
(:KnowledgeNode)-[:SIMILAR {similarityScore}]->(:KnowledgeNode)
(:KnowledgeNode)-[:PART_OF]->(:KnowledgeNode)

// 创建约束
CREATE CONSTRAINT user_id ON (u:User) ASSERT u.id IS UNIQUE;
CREATE CONSTRAINT graph_id ON (g:KnowledgeGraph) ASSERT g.id IS UNIQUE;
CREATE CONSTRAINT node_id ON (n:KnowledgeNode) ASSERT n.id IS UNIQUE;

// 创建索引
CREATE INDEX node_graph_id FOR (n:KnowledgeNode) ON (n.graphId);
CREATE INDEX node_embedding FOR (n:KnowledgeNode) ON (n.embedding);
```

### 2.3 Redis 缓存策略

```
Key Pattern                          TTL        Description
─────────────────────────────────────────────────────────────────
session:{token}                      7d         用户会话
user:{id}:profile                    1h         用户资料缓存
user:{id}:quota                      1m         AI配额实时值
graph:{id}:metadata                  10m        图谱元数据
graph:{id}:nodes:count               5m         节点数量统计
graph:{id}:edges:count               5m         关联数量统计
search:trending                      30m        热门搜索
rate_limit:{ip}                      1h         限流计数
queue:ai_processing                  -          AI任务队列
lock:import:{user_id}                10m        导入任务锁
```

---

## 三、API 设计

### 3.1 RESTful API 规范

#### 认证相关
```
POST   /api/v1/auth/register          # 注册
POST   /api/v1/auth/login             # 登录
POST   /api/v1/auth/logout            # 登出
POST   /api/v1/auth/refresh           # 刷新Token
POST   /api/v1/auth/forgot-password   # 忘记密码
POST   /api/v1/auth/reset-password    # 重置密码
GET    /api/v1/auth/me                # 获取当前用户
```

#### 知识图谱
```
GET    /api/v1/graphs                 # 获取图谱列表
POST   /api/v1/graphs                 # 创建图谱
GET    /api/v1/graphs/:id             # 获取图谱详情
PUT    /api/v1/graphs/:id             # 更新图谱
DELETE /api/v1/graphs/:id             # 删除图谱
GET    /api/v1/graphs/:id/stats       # 获取图谱统计
POST   /api/v1/graphs/:id/clone       # 克隆图谱
```

#### 知识点
```
GET    /api/v1/graphs/:id/nodes       # 获取节点列表
POST   /api/v1/graphs/:id/nodes       # 创建节点
GET    /api/v1/nodes/:id              # 获取节点详情
PUT    /api/v1/nodes/:id              # 更新节点
DELETE /api/v1/nodes/:id              # 删除节点
POST   /api/v1/nodes/:id/ai-enhance  # AI增强节点
```

#### 知识关联
```
GET    /api/v1/graphs/:id/edges       # 获取关联列表
POST   /api/v1/edges                  # 创建关联
PUT    /api/v1/edges/:id              # 更新关联
DELETE /api/v1/edges/:id              # 删除关联
POST   /api/v1/edges/ai-suggest       # AI推荐关联
```

#### AI服务
```
POST   /api/v1/ai/extract             # 从文本提取知识点
POST   /api/v1/ai/summarize           # 生成内容摘要
POST   /api/v1/ai/related             # 推荐相关知识点
POST   /api/v1/ai/embedding           # 生成文本向量
GET    /api/v1/ai/quota               # 查询AI配额
```

#### 导入导出
```
POST   /api/v1/import                 # 创建导入任务
GET    /api/v1/import/:id/status      # 查询导入进度
POST   /api/v1/export/graph/:id       # 导出图谱
GET    /api/v1/export/:id/download    # 下载导出文件
```

### 3.2 WebSocket 实时通信

```javascript
// 连接地址
wss://api.nexus.com/ws

// 事件类型
{
  // 客户端 → 服务端
  "join_graph": { "graphId": "uuid" },
  "leave_graph": { "graphId": "uuid" },
  "cursor_move": { "x": 100, "y": 200 },
  "node_select": { "nodeId": "uuid" },
  "operation": { "type": "create_node", "data": {} },
  
  // 服务端 → 客户端
  "user_joined": { "userId": "uuid", "username": "xxx" },
  "user_left": { "userId": "uuid" },
  "cursor_update": { "userId": "uuid", "x": 100, "y": 200 },
  "node_updated": { "nodeId": "uuid", "data": {} },
  "operation_applied": { "operationId": "uuid", "status": "success" },
  "operation_error": { "operationId": "uuid", "error": "xxx" }
}
```

---

## 四、AI 服务架构

### 4.1 AI 处理流程

```
用户输入
    │
    ▼
┌─────────────────┐
│   预处理        │  ← 文本清洗、分块
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   AI提取        │  ← GPT-4提取知识点
│   (OpenAI API)  │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   后处理        │  ← 格式化、去重、校验
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   向量化        │  ← Embedding生成
│   (OpenAI)      │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   存储          │  ← PostgreSQL + Neo4j
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   关联计算      │  ← 相似度计算、推荐
└─────────────────┘
```

### 4.2 Prompt 工程

#### 知识点提取 Prompt
```
你是一个知识提取专家。请从以下文本中提取关键知识点，并以JSON格式返回。

要求：
1. 每个知识点应包含：标题、核心内容、关键词(3-5个)
2. 知识点应原子化，避免过大或过小
3. 保持原文的准确性和完整性
4. 如果文本包含多个主题，请分别提取

文本内容：
{{text}}

请返回以下格式的JSON数组：
[
  {
    "title": "知识点标题",
    "content": "详细内容",
    "keywords": ["关键词1", "关键词2", "关键词3"]
  }
]
```

#### 关联推荐 Prompt
```
请分析以下两个知识点之间的关联关系：

知识点A：
标题：{{nodeA.title}}
内容：{{nodeA.content}}

知识点B：
标题：{{nodeB.title}}
内容：{{nodeB.content}}

请判断：
1. 这两个知识点是否有关联？
2. 如果有，关联类型是什么？(相关、前置知识、相似、包含)
3. 关联强度如何？(1-10分)
4. 用一句话描述关联关系

以JSON格式返回：
{
  "isRelated": true/false,
  "relationType": "related/prerequisite/similar/part_of",
  "strength": 8,
  "description": "关联描述"
}
```

### 4.3 AI 成本优化策略

| 策略 | 实现方式 | 预期节省 |
|------|---------|---------|
| **缓存Embedding** | Redis缓存文本向量 | 60% |
| **批量处理** | 合并多个请求 | 30% |
| **模型降级** | 简单任务用GPT-3.5 | 80% |
| **本地缓存** | 相似文本直接复用 | 40% |
| **异步处理** | 非实时任务队列处理 | - |

---

## 五、开发路径规划

### 5.1 分阶段开发计划

#### Phase 1: MVP (Month 1-2)
**目标**: 验证核心需求，获取首批用户

```
Week 1-2: 基础架构
├── 项目脚手架搭建
├── 数据库设计实现
├── 用户认证系统
└── 基础API开发

Week 3-4: 核心功能
├── 知识导入 (Markdown)
├── AI知识点提取
├── 基础图谱展示
└── 手动关联功能

Week 5-6: 优化上线
├── 性能优化
├── Bug修复
├── 内测发布
└── 收集反馈
```

**技术债务控制**:
- 使用Serverless降低运维成本
- 优先使用托管服务
- 文档和测试覆盖率>60%

#### Phase 2: 产品化 (Month 3-4)
**目标**: 完善产品，提升用户体验

```
Month 3: 功能增强
├── AI关联推荐
├── 图谱可视化优化
├── 移动端适配
├── 导出功能
└── 模板系统

Month 4: 协作功能
├── 实时协作
├── 评论系统
├── 版本历史
├── 权限管理
└── 团队功能
```

#### Phase 3: 规模化 (Month 5-6)
**目标**: 支持大规模用户，商业化

```
Month 5: 性能优化
├── 数据库优化
├── 缓存策略
├── CDN部署
├── 监控告警
└── 自动化运维

Month 6: 商业化
├── 支付系统集成
├── 订阅管理
├── 企业功能
├── API开放平台
└── 数据分析
```

### 5.2 技术里程碑

| 里程碑 | 时间 | 验收标准 |
|--------|------|---------|
| **MVP上线** | M2 | 核心功能可用，100内测用户 |
| **产品化** | M4 | 功能完整，1000活跃用户 |
| **商业化** | M6 | 付费系统上线，首笔收入 |
| **规模化** | M12 | 10万用户，系统稳定 |

### 5.3 团队配置建议

#### 初期团队 (M1-M6): 3-4人
```
├── 全栈工程师 (1人)
│   ├── 前端开发
│   ├── 后端API
│   └── 数据库设计
│
├── AI/算法工程师 (1人)
│   ├── Prompt工程
│   ├── 知识图谱算法
│   └── 推荐系统
│
├── 产品经理 (1人)
│   ├── 产品设计
│   ├── 用户研究
│   └── 项目管理
│
└── 设计师 (0.5人，兼职)
    ├── UI设计
    └── 品牌设计
```

#### 成长期团队 (M6-M12): 6-8人
```
├── 前端团队 (2人)
├── 后端团队 (2人)
├── AI团队 (1人)
├── 产品 (1人)
├── 设计 (1人)
└── 运营 (1人)
```

---

## 六、部署与运维

### 6.1 部署架构

```
生产环境 (Production)
├── 负载均衡 (Nginx/ALB)
├── 应用服务器 (2+ instances)
│   ├── API Server × 2
│   └── WebSocket Server × 2
├── 数据库
│   ├── PostgreSQL (主从)
│   ├── Neo4j (集群)
│   └── Redis (集群)
└── 对象存储 (OSS/S3)

预发布环境 (Staging)
├── 单实例部署
├── 生产数据脱敏副本
└── 用于测试和演示

开发环境 (Development)
├── Docker Compose本地运行
├── 使用测试API密钥
└── 开发者本地调试
```

### 6.2 CI/CD 流程

```
代码提交
    │
    ▼
┌─────────────────┐
│   GitHub Actions │
│   - 代码检查     │
│   - 单元测试     │
│   - 构建镜像     │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   部署到Staging  │
│   - 自动化部署   │
│   - 集成测试     │
└─────────────────┘
    │
    ▼ (手动触发)
┌─────────────────┐
│   部署到Production│
│   - 蓝绿部署     │
│   - 健康检查     │
│   - 自动回滚     │
└─────────────────┘
```

### 6.3 监控告警

| 层级 | 工具 | 监控项 |
|------|------|--------|
| **基础设施** | Prometheus + Grafana | CPU、内存、磁盘、网络 |
| **应用性能** | APM (Sentry/New Relic) | 响应时间、错误率、吞吐量 |
| **业务指标** | 自建Dashboard | 用户数、活跃度、转化率 |
| **日志** | ELK/Loki | 错误日志、访问日志 |
| **告警** | PagerDuty/钉钉 | 多渠道告警通知 |

---

## 七、安全与合规

### 7.1 安全措施

```
认证授权
├── JWT Token + Refresh Token
├── OAuth2.0 (微信/QQ登录)
└── 多因素认证 (MFA)

数据安全
├── 传输加密 (HTTPS/TLS 1.3)
├── 存储加密 (AES-256)
├── 数据库访问控制
└── 定期备份 + 异地容灾

API安全
├── 请求签名验证
├── 频率限制 (Rate Limiting)
├── SQL注入防护
└── XSS/CSRF防护

审计日志
├── 操作日志记录
├── 敏感操作告警
└── 定期安全审计
```

### 7.2 合规要求

| 法规 | 要求 | 实现 |
|------|------|------|
| **网络安全法** | 数据本地化 | 国内云服务部署 |
| **个人信息保护法** | 用户同意、数据删除 | 隐私政策、账号注销 |
| **数据安全法** | 数据分类分级 | 敏感数据加密 |
| **等保2.0** | 安全等级保护 | 二级/三级认证 |

---

## 八、成本控制

### 8.1 月度成本估算 (1000活跃用户)

| 项目 | 服务 | 成本 |
|------|------|------|
| **云服务器** | 2核4G × 2 | ¥400 |
| **数据库** | RDS PostgreSQL | ¥600 |
| **图数据库** | Neo4j Cloud | ¥500 |
| **缓存** | Redis | ¥200 |
| **对象存储** | OSS | ¥100 |
| **CDN** | 阿里云CDN | ¥200 |
| **AI API** | OpenAI | ¥2000 |
| **域名/证书** | - | ¥100 |
| **监控/日志** | - | ¥200 |
| **总计** | | **¥4300/月** |

### 8.2 成本优化策略

```
短期 (0-6月)
├── 使用Serverless降低固定成本
├── 选择性价比高的云服务
└── 控制AI调用频率

中期 (6-12月)
├── 自建AI模型替代部分API调用
├── 优化数据库查询，降低资源消耗
└── CDN缓存策略优化

长期 (12月+)
├── 多云部署，议价降低成本
├── 容器化提高资源利用率
└── 用户规模效应摊薄成本
```

---

## 九、附录

### 附录A: 项目目录结构

```
nexus/
├── apps/
│   ├── web/                    # React前端
│   │   ├── src/
│   │   │   ├── components/     # 组件
│   │   │   ├── pages/          # 页面
│   │   │   ├── hooks/          # 自定义Hooks
│   │   │   ├── stores/         # 状态管理
│   │   │   └── utils/          # 工具函数
│   │   └── package.json
│   │
│   ├── mobile/                 # React Native移动端
│   │   └── ...
│   │
│   └── extension/              # 浏览器插件
│       └── ...
│
├── services/
│   ├── api/                    # Node.js后端API
│   │   ├── src/
│   │   │   ├── routes/         # 路由
│   │   │   ├── controllers/    # 控制器
│   │   │   ├── services/       # 业务逻辑
│   │   │   ├── models/         # 数据模型
│   │   │   ├── middlewares/    # 中间件
│   │   │   └── utils/          # 工具函数
│   │   └── package.json
│   │
│   └── ai-worker/              # AI处理队列
│       └── ...
│
├── packages/
│   ├── shared-types/           # 共享类型定义
│   ├── ui-components/          # 共享UI组件
│   └── utils/                  # 共享工具函数
│
├── infra/
│   ├── docker/                 # Docker配置
│   ├── k8s/                    # Kubernetes配置
│   └── terraform/              # 基础设施即代码
│
├── docs/                       # 文档
├── scripts/                    # 脚本工具
└── README.md
```

### 附录B: 开发环境搭建

```bash
# 1. 克隆仓库
git clone https://github.com/nexus-team/nexus.git
cd nexus

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 4. 启动数据库
docker-compose up -d postgres neo4j redis

# 5. 数据库迁移
cd services/api
npx prisma migrate dev

# 6. 启动开发服务器
pnpm dev
```

### 附录C: 性能基准

| 指标 | 目标值 | 测试方法 |
|------|--------|---------|
| API响应时间 | P99 < 200ms | k6/loadtest |
| 页面加载时间 | < 2s | Lighthouse |
| 图谱渲染 | 1000节点流畅 | 手动测试 |
| 并发用户 | 1000 QPS | 压测 |
| 系统可用性 | 99.9% | 监控统计 |

---

*文档版本: v1.0*  
*更新日期: 2026-03-27*
