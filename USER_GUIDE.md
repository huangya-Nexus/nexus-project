# 知链 Nexus - 使用文档

## 📖 快速开始

### 1. 环境要求
- Node.js 18+
- npm 或 yarn

### 2. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 3. 配置环境变量

创建 `backend/.env` 文件：

```env
# 数据库
DATABASE_URL="file:./prod.db"

# JWT密钥
JWT_SECRET="your-secret-key"

# Kimi API（可选）
OPENAI_API_KEY=your-kimi-api-key
OPENAI_BASE_URL=https://api.moonshot.cn/v1
OPENAI_MODEL=moonshot-v1-8k
```

### 4. 初始化数据库

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 5. 启动服务

```bash
# 启动后端
cd backend
npm start

# 启动前端（新终端）
cd frontend
npm run dev
```

### 6. 访问应用

- 前端: http://localhost:5173
- 后端: http://localhost:3001

---

## 🎯 核心功能使用指南

### 1. 注册/登录

1. 打开首页 http://localhost:5173
2. 点击"注册账号"创建新账户
3. 或使用测试账号: test@example.com / 123456

### 2. 创建知识图谱

1. 登录后进入 Dashboard
2. 点击"➕ 新建图谱"
3. 输入标题和描述
4. 选择模板（可选）
5. 点击"创建"

### 3. 添加知识点

1. 打开一个知识图谱
2. 点击"➕ 添加知识点"
3. 输入标题和内容
4. 点击"保存"
5. AI会自动生成摘要

### 4. 建立知识关联

1. 在图谱视图中，点击"关联"按钮
2. 选择两个知识点
3. 选择关联类型
4. 点击"创建关联"

### 5. 使用AI导入

1. 进入"🤖 AI 导入"标签
2. 选择目标图谱
3. 粘贴文本或上传文件（PDF/Word/TXT）
4. 点击"AI 提取知识点"
5. 查看并确认提取结果

### 6. 全网搜索

1. 在首页选择"🌐 全网搜索"模式
2. 输入关键词
3. 点击搜索
4. 查看来自维基百科、arXiv等的结果

### 7. 知识图谱可视化

1. 在首页选择"🕸️ 知识图谱"模式
2. 输入关键词
3. 点击"生成知识图谱"
4. 查看动态关联网络

### 8. 分享图谱

1. 打开一个知识图谱
2. 点击"🔗 分享"按钮
3. 设置权限（仅查看/可复制）
4. 设置有效期
5. 复制分享链接

### 9. 复习功能

1. 点击顶部"🎯 复习"按钮
2. 查看今日复习任务
3. 点击"显示答案"
4. 根据记忆情况选择评分（1-4）
5. 完成所有卡片

### 10. 查看统计

1. 点击顶部"📊 统计"按钮
2. 查看学习数据
3. 查看活动趋势
4. 查看热门关键词

---

## 🔍 搜索功能详解

### 首页三种搜索模式

| 模式 | 用途 | 数据源 |
|------|------|--------|
| 📚 本地搜索 | 搜索自己的知识图谱 | 本地数据库 |
| 🌐 全网搜索 | 搜索互联网资源 | 维基百科、arXiv、GitHub等12个平台 |
| 🕸️ 知识图谱 | 可视化关联网络 | 多源聚合 |

### 快捷键

- `⌘K` / `Ctrl+K` - 打开搜索
- `↑↓` - 选择搜索结果
- `Enter` - 确认
- `ESC` - 关闭

---

## 📁 数据管理

### 备份数据

```bash
# 备份数据库
cp backend/prisma/prod.db backup/nexus-db-$(date +%Y%m%d).db

# 导出图谱为Markdown
在图谱详情页点击"📥 导出"按钮
```

### 恢复数据

```bash
# 恢复数据库
cp backup/nexus-db-YYYYMMDD.db backend/prisma/prod.db
```

---

## 🔧 故障排除

### 问题1: 前端无法连接后端

**解决**: 检查后端是否运行在 http://localhost:3001

```bash
cd backend
npm start
```

### 问题2: 数据库错误

**解决**: 重新生成Prisma客户端

```bash
cd backend
npx prisma generate
```

### 问题3: AI功能不工作

**解决**: 检查Kimi API Key是否配置正确

### 问题4: 外部搜索超时

**解决**: 正常现象，系统会自动使用模拟数据

---

## 📊 系统架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端      │────▶│   后端API   │────▶│   SQLite    │
│  React      │     │  Express    │     │  数据库     │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │  Kimi API   │
                    │  外部数据源 │
                    └─────────────┘
```

---

## 📝 API文档

### 主要API端点

- `POST /api/users/register` - 注册
- `POST /api/users/login` - 登录
- `GET /api/graphs` - 获取图谱列表
- `POST /api/graphs` - 创建图谱
- `GET /api/graphs/:id` - 获取图谱详情
- `POST /api/graphs/:id/nodes` - 添加知识点
- `POST /api/ai/extract` - AI提取知识点
- `GET /api/search/public` - 公开搜索
- `GET /api/external/multi` - 多源搜索

完整API文档: http://localhost:3001/api/docs

---

## 🤝 支持

如有问题，请查看:
1. `DEVELOPMENT_LOG.md` - 开发日志
2. `PROJECT_COMPLETE_RECORD.md` - 项目记录
3. 浏览器开发者工具 (F12)

---

**版本**: 1.0.0  
**更新日期**: 2026-03-31  
**作者**: Dot
