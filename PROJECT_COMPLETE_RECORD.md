# 知链 Nexus - 项目完整记录

**项目名称**: 知链 Nexus  
**项目类型**: AI驱动的知识图谱学习工具  
**开发日期**: 2026-03-31  
**开发时长**: 约7小时 (09:15 - 16:00)  

---

## 📊 项目统计

| 指标 | 数据 |
|------|------|
| 前端文件 | 约30个组件 |
| 后端API | 15+个路由 |
| 数据库表 | 12个表 |
| 功能数量 | 20+项核心功能 |
| 代码行数 | 约5000+行 |
| 项目大小 | 390MB |

---

## ✅ 已完成功能清单 (20项)

### 核心功能
1. ✅ 用户认证系统（注册/登录/权限管理）
2. ✅ 知识图谱CRUD（创建/读取/更新/删除）
3. ✅ 知识点管理（含AI自动摘要）
4. ✅ 知识关联（含AI智能推荐）
5. ✅ AI智能导入（Kimi API集成）

### 搜索功能
6. ✅ 本地搜索（搜索用户自己的知识图谱）
7. ✅ 全网搜索（12个外部数据源）
8. ✅ 知识图谱可视化搜索（动态关联网络）
9. ✅ 搜索历史记录
10. ✅ 搜索结果筛选和排序

### 数据导入/导出
11. ✅ 文件上传（PDF/Word/Markdown/TXT）
12. ✅ Markdown导出
13. ✅ 数据备份/恢复
14. ✅ 批量导入功能

### 学习功能
15. ✅ 记忆曲线复习系统（SM-2算法）
16. ✅ 学习统计面板
17. ✅ 连续学习天数追踪

### 协作与分享
18. ✅ 分享功能（链接分享/权限控制）
19. ✅ 12个预设模板
20. ✅ 性能优化（懒加载/缓存/动画）

---

## 🔧 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI**: 纯CSS（无UI框架）
- **可视化**: Canvas API

### 后端
- **框架**: Express + TypeScript
- **数据库**: SQLite + Prisma ORM
- **AI服务**: Kimi (Moonshot) API
- **缓存**: node-cache

### 外部数据源 (12个)
- 维基百科（中文百科）
- arXiv（学术论文）
- GitHub（代码/文档）
- PubMed（医学文献）
- CrossRef（学术文献）
- Semantic Scholar（AI学术搜索）
- 知乎（问答社区）
- Bilibili（视频教程）
- 百度学术（需API Key）
- Google Scholar（需API Key）
- 中国知网（需机构权限）
- 万方数据库（需机构权限）

---

## 📁 项目结构

```
/Users/huangya/.openclaw/workspace/projects/nexus/
├── backend/                    # 后端代码
│   ├── src/
│   │   ├── routes/            # API路由
│   │   │   ├── users.ts       # 用户认证
│   │   │   ├── graphs.ts      # 知识图谱
│   │   │   ├── nodes.ts       # 知识点
│   │   │   ├── edges.ts       # 知识关联
│   │   │   ├── ai.ts          # AI功能
│   │   │   ├── search.ts      # 搜索功能
│   │   │   ├── share.ts       # 分享功能
│   │   │   ├── review.ts      # 复习系统
│   │   │   ├── upload.ts      # 文件上传
│   │   │   ├── backup.ts      # 备份恢复
│   │   │   ├── import.ts      # 数据导入
│   │   │   └── externalSearch.ts  # 外部搜索
│   │   ├── services/          # 服务层
│   │   │   ├── ai.ts          # AI服务
│   │   │   ├── externalSearch.ts  # 外部搜索服务
│   │   │   └── advancedSearch.ts  # 高级搜索服务
│   │   ├── middleware/        # 中间件
│   │   ├── lib/               # 工具库
│   │   └── index.ts           # 入口文件
│   ├── prisma/
│   │   └── schema.prisma      # 数据库模型
│   └── package.json
│
├── frontend/                   # 前端代码
│   ├── src/
│   │   ├── components/        # 组件
│   │   │   ├── SimpleGraph.tsx
│   │   │   ├── NodeDetail.tsx
│   │   │   ├── SearchPanel.tsx
│   │   │   ├── SharePanel.tsx
│   │   │   ├── StatsPanel.tsx
│   │   │   ├── ReviewPanel.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── ExternalSearch.tsx
│   │   │   ├── SimpleSearch.tsx
│   │   │   ├── SimpleGraphSearch.tsx
│   │   │   └── ...
│   │   ├── App.tsx            # 主应用
│   │   ├── Dashboard.tsx      # 控制台
│   │   ├── Login.tsx          # 登录页
│   │   ├── Register.tsx       # 注册页
│   │   └── main.tsx           # 入口
│   └── package.json
│
└── DEVELOPMENT_LOG.md         # 开发日志
```

---

## 🚀 部署信息

### 本地开发环境
- **前端地址**: http://localhost:5173 (或5174)
- **后端地址**: http://localhost:3001
- **测试账号**: test@example.com / 123456

### 部署命令
```bash
# 启动后端
cd backend && npm start

# 启动前端
cd frontend && npm run dev

# 构建生产版本
cd frontend && npm run build
```

---

## 📝 开发时间线

| 时间 | 内容 |
|------|------|
| 09:15-09:25 | 分享功能 |
| 09:25-09:30 | 搜索功能增强 |
| 09:30-09:42 | 学习统计面板 |
| 09:42-10:00 | 数据库问题解决 |
| 10:00-10:20 | Kimi API配置 |
| 10:20-10:42 | 文件上传功能 |
| 10:42-11:00 | 记忆曲线复习系统 |
| 11:00-11:30 | 公开搜索功能 |
| 11:30-12:44 | 多源分层搜索架构 |
| 13:45-14:00 | 首页搜索修复 |
| 14:00-14:30 | 知识图谱可视化 |
| 14:30-15:00 | 知识图谱强化 |
| 15:00-15:40 | 性能优化 |

---

## 🎯 项目亮点

1. **多源搜索**: 集成12个外部数据源
2. **AI驱动**: 使用Kimi API进行智能分析
3. **可视化**: Canvas绘制的动态知识图谱
4. **学习系统**: 基于SM-2算法的记忆曲线复习
5. **全栈开发**: 完整的前后端分离架构

---

## 📌 待办事项

- [ ] 部署到云服务器
- [ ] 配置域名和HTTPS
- [ ] 添加更多数据源（需API Key）
- [ ] 移动端适配优化
- [ ] 协作功能（多人编辑）
- [ ] 知识图谱导出为图片/PDF

---

**保存时间**: 2026-03-31 16:00  
**保存人**: Dot  
**状态**: 开发完成，待部署
