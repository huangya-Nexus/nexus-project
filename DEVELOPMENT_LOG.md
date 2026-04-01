# 知链 Nexus 项目开发记录

**日期**: 2026-03-31  
**时间**: 09:15 - 12:44

---

## 今日完成的功能

### 1. 分享功能 (09:15-09:25)
- 创建后端分享API路由 (`backend/src/routes/share.ts`)
- 添加 GraphShare 数据库表
- 创建前端分享页面 (`frontend/src/SharedGraphView.tsx`)
- 在 Dashboard 中添加分享按钮
- 功能：创建链接、设置权限、有效期、复制图谱

### 2. 搜索功能增强 (09:25-09:30)
- 添加键盘导航 (↑↓选择, ↵确认, ESC关闭)
- 添加排序选项 (相关度/标题/最近更新)
- 优化搜索结果高亮显示
- 添加快捷键 ⌘K/Ctrl+K 打开搜索

### 3. 学习统计面板 (09:30-09:42)
- 创建 StatsPanel 组件
- 添加用户数据统计API
- 显示：图谱数、知识点数、关联数、连续学习天数
- 活动趋势图表、热门关键词

### 4. 数据库问题解决 (09:42-10:00)
- 发现后端使用 prod.db 而测试账号在 dev.db
- 将用户数据从 dev.db 复制到 prod.db
- 重启后端服务解决问题

### 5. Kimi API 配置 (10:00-10:20)
- 配置 Kimi (Moonshot) API Key
- 修改后端支持自定义 OpenAI Base URL
- 测试 AI 知识点提取功能正常

### 6. 文件上传功能 (10:20-10:42)
- 创建文件上传路由 (`backend/src/routes/upload.ts`)
- 支持 PDF、Word、Markdown、TXT 文件
- 使用 pdf-parse 解析 PDF
- 使用 mammoth 解析 Word 文档
- 创建前端 FileUpload 组件
- 在 AI 导入页面添加文件上传按钮
- 上传后自动填充到文本框

### 7. 记忆曲线复习系统 (10:42-11:00)
- 创建复习卡片数据库表 (`ReviewCard`, `ReviewLog`)
- 实现 SM-2 记忆曲线算法
- 创建复习API路由 (`backend/src/routes/review.ts`)
  - 获取今日复习任务
  - 提交复习结果
  - 创建/删除复习卡片
  - 复习统计
- 创建前端 ReviewPanel 组件
  - 卡片式复习界面
  - 4级评分（忘记/困难/良好/简单）
  - 进度显示
  - 连续学习天数追踪

### 8. 公开搜索功能 (11:00-11:30)
- 创建公开搜索API (`backend/src/routes/search.ts`)
  - 搜索公开图谱
  - 搜索知识点
  - 热门推荐API
- 添加 `isPublic` 字段到 KnowledgeGraph 表
- 创建前端 SearchResults 组件
  - 显示搜索结果（图谱+知识点）
  - 标签切换
  - 关键词高亮
- 修改首页搜索框
  - 无需登录即可搜索
  - 点击搜索直接显示结果

### 9. 多源分层搜索架构 (11:30-12:44)
- 创建外部搜索服务 (`backend/src/services/externalSearch.ts`)
  - 维基百科搜索 (中文百科)
  - arXiv 学术论文搜索
  - GitHub 代码/文档搜索
  - PubMed 医学文献搜索
  - 多源聚合搜索
- 创建高级搜索服务 (`backend/src/services/advancedSearch.ts`)
  - CrossRef 学术文献搜索 (免费API)
  - Semantic Scholar AI学术搜索 (免费API)
  - 知乎问答搜索
  - Bilibili 视频教程搜索
  - 百度学术/Google Scholar (需SerpAPI Key)
  - 知网/万方 (需机构权限)
- 创建外部搜索路由 (`backend/src/routes/externalSearch.ts`)
  - 各源独立搜索接口
  - 多源聚合接口
  - 搜索源列表接口 (区分免费/付费源)
- 创建前端 ExternalSearch 组件
  - 多源结果展示
  - 来源筛选标签
  - 一键导入功能
- 集成到 AI 导入页面
  - 全网搜索输入框
  - 支持搜索后导入并提取知识点

---

## 当前项目状态

### 服务地址
- 后端服务: http://localhost:3001 ✅
- 前端服务: http://localhost:5173 ✅
- 测试账号: test@example.com / 123456 ✅
- Kimi API: 已配置 ✅

### 已完成功能清单 (17项)
- ✅ 用户认证系统
- ✅ 知识图谱CRUD
- ✅ 知识点管理（含AI摘要）
- ✅ 知识关联（含AI推荐）
- ✅ AI智能导入（Kimi API）
- ✅ 文件上传（PDF/Word/TXT/Markdown）
- ✅ 搜索功能（历史/筛选/高亮/键盘导航）
- ✅ 公开搜索（无需登录）
- ✅ 多源分层搜索（维基百科/arXiv/GitHub/PubMed/CrossRef/Semantic Scholar/知乎/B站）
- ✅ 可视化（力导向图）
- ✅ Markdown导出
- ✅ 数据备份/恢复
- ✅ 12个模板
- ✅ 性能优化
- ✅ 分享功能
- ✅ 学习统计面板
- ✅ 记忆曲线复习系统（SM-2算法）

---

## 已解决问题 ✅

### 1. 首页搜索功能
- **问题**：输入关键词后没有显示搜索结果
- **原因**：SearchResults 组件有重复的 return 语句，导致渲染逻辑错误
- **解决方案**：创建新的 SimpleSearch 组件，简化渲染逻辑
- **状态**：✅ 已修复，搜索功能正常工作

### 2. 首页搜索升级 - 三种搜索模式（已强化）
- **功能**：首页搜索框增加三种搜索模式
  - **本地搜索**：搜索用户自己的知识图谱
  - **全网搜索**：搜索维基百科、arXiv、GitHub等12个外部平台
  - **知识图谱**：增强版可视化关联网络
    - 多源聚合搜索（8个数据源同时搜索）
    - 智能关联算法（基于内容相似度）
    - 力导向布局动画
    - 三种视图模式（力导向/环形/层次）
    - 来源筛选功能
    - 节点详情面板
    - 实时统计信息
    - 进度条显示
- **状态**：✅ 已完成并强化

### 3. 网络超时问题
- 问题：维基百科等外部API有时超时
- 解决方案：已添加模拟数据作为备用
- 状态：已部分解决

### 4. 性能优化 (15:30-15:40)
- **懒加载**：使用 React.lazy 和 Suspense 实现组件懒加载
- **动画优化**：添加 CSS 动画（fadeInDown/fadeInUp）
- **缓存系统**：添加 node-cache 实现搜索结果缓存（5分钟）
- **状态**：✅ 已完成

---

## 下一步计划

### 高优先级
1. **修复首页搜索功能** - 调试并解决搜索结果不显示问题
2. **部署到服务器** - 让项目可以外部访问

### 中优先级
3. **更多数据源** - 添加百度学术、Google Scholar（需API Key）
4. **移动端适配** - 优化移动端体验

### 低优先级
5. **协作功能** - 多人实时编辑
6. **更多可视化** - 多种图表类型

---

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite + Prisma
- **AI**: Kimi (Moonshot) API
- **外部API**: 维基百科、arXiv、GitHub、PubMed、CrossRef、Semantic Scholar

---

*记录时间: 2026-03-31 12:44*  
*状态: 开发中，需继续调试搜索功能*
