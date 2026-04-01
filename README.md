# 知链 Nexus

AI 驱动的知识图谱学习工具

## 功能特性

- 🤖 AI 智能导入：自动从文本提取知识点
- 🔍 智能搜索：支持标题、内容、关键词搜索
- 📊 可视化：力导向图谱展示
- 🔗 知识关联：手动创建 + AI 推荐
- 📥 导出功能：支持 Markdown 导出
- 🎨 模板系统：快速创建学习图谱

## 快速开始

### 本地开发

```bash
# 启动后端
cd backend
npm install
npm run dev

# 启动前端
cd frontend
npm install
npm run dev
```

### 生产部署

```bash
# 使用部署脚本
./deploy-local.sh

# 或使用 Docker
docker-compose up -d
```

## 访问地址

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001

## 测试账号

- 邮箱: test@example.com
- 密码: 123456

## 项目文档

- [部署指南](DEPLOY.md)

## 技术栈

- 后端: Node.js + Express + TypeScript + Prisma + SQLite
- 前端: React + TypeScript + Vite
- AI: OpenAI API
