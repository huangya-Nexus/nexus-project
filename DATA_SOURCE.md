# Nexus 搜索功能 - 数据来源说明

## 用户输入关键词后的数据流向

```
用户输入关键词
    ↓
前端调用 API: GET /api/search/enhanced?q=关键词
    ↓
后端查询数据库
    ↓
返回结果给前端展示
```

## 数据来源详解

### 1. 知识点数据 (KnowledgeNode)
**存储位置**: SQLite 数据库 (`backend/prisma/prod.db`)

**包含字段**:
- id: 唯一标识
- title: 知识点标题
- content: 知识点内容
- keywords: 关键词 (JSON格式)
- graphId: 所属图谱ID
- createdAt/updatedAt: 时间

**数据来源**:
- 用户手动创建
- AI 自动提取 (从上传的文档)
- 从分享链接复制

### 2. 知识关联数据 (KnowledgeEdge)
**存储位置**: SQLite 数据库

**包含字段**:
- id: 唯一标识
- sourceId: 源知识点ID
- targetId: 目标知识点ID
- type: 关联类型 (如"相关"、"包含"、"前置")
- label: 关联标签
- graphId: 所属图谱ID

**数据来源**:
- 用户手动创建关联
- AI 智能推荐关联

### 3. 知识链/图谱数据 (KnowledgeGraph)
**存储位置**: SQLite 数据库

**包含字段**:
- id: 唯一标识
- title: 图谱标题
- description: 描述
- userId: 创建者ID
- isPublic: 是否公开
- nodeCount: 知识点数量

**数据来源**:
- 用户创建
- 使用模板创建
- 从分享链接复制

### 4. 用户数据 (User)
**存储位置**: SQLite 数据库

**包含字段**:
- id: 唯一标识
- email: 邮箱
- name: 用户名
- aiQuotaMonthly: AI调用配额
- aiQuotaUsed: 已使用配额

## 当前数据库中的数据

根据之前的查询结果:
- 测试账号: test@example.com
- 2 个知识图谱
- 15 个知识点
- 3 条关联

这些数据是之前测试时创建的，包括:
- 英语语法图谱
- 雅思学习图谱
- 各种知识点 (时态、词汇、语法等)

## 搜索时的数据查询流程

1. **搜索知识点**:
   ```sql
   SELECT * FROM KnowledgeNode 
   WHERE title LIKE '%关键词%' 
      OR content LIKE '%关键词%'
   ```

2. **获取关联知识点**:
   ```sql
   SELECT * FROM KnowledgeEdge 
   WHERE sourceId = '节点ID' OR targetId = '节点ID'
   ```

3. **搜索知识链**:
   ```sql
   SELECT * FROM KnowledgeGraph 
   WHERE title LIKE '%关键词%' 
      OR description LIKE '%关键词%'
   ```

## 数据持久化

- 数据库文件: `backend/prisma/prod.db`
- 备份: 可通过 API 导出/导入
- 部署到服务器后，数据会存储在服务器上

## 如何添加更多数据？

1. **手动创建**: 登录后创建图谱和知识点
2. **AI导入**: 上传文档，自动提取知识点
3. **分享复制**: 复制别人分享的图谱
4. **模板创建**: 使用预设模板快速创建
