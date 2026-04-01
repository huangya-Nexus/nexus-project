#!/bin/bash

# Nexus 本地生产环境部署脚本

echo "🚀 Nexus 本地部署"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo "请先安装 Node.js 20+: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

echo "✅ PM2 已安装"

# 部署后端
echo ""
echo "🔧 部署后端..."
cd backend

# 安装依赖
echo "  → 安装依赖..."
npm install > /dev/null 2>&1

# 编译
echo "  → 编译 TypeScript..."
npm run build > /dev/null 2>&1

# 复制生产环境配置
cp .env.production .env

# 使用 PM2 启动
echo "  → 启动服务..."
pm2 delete nexus-backend 2>/dev/null || true
pm2 start dist/index.js --name nexus-backend --env production > /dev/null 2>&1

cd ..

# 部署前端
echo ""
echo "🎨 部署前端..."
cd frontend

# 安装依赖
echo "  → 安装依赖..."
npm install > /dev/null 2>&1

# 构建
echo "  → 构建生产版本..."
npm run build > /dev/null 2>&1

# 使用 serve 提供静态文件
if ! command -v serve &> /dev/null; then
    npm install -g serve
fi

pm2 delete nexus-frontend 2>/dev/null || true
pm2 start serve --name nexus-frontend -- -s dist -l 3000 > /dev/null 2>&1

cd ..

# 保存 PM2 配置
echo ""
echo "💾 保存配置..."
pm2 save > /dev/null 2>&1

echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "📊 服务状态:"
pm2 status

echo ""
echo "🌐 访问地址:"
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:3001"
echo "  API:  http://localhost:3001/api"
echo ""
echo "📋 常用命令:"
echo "  pm2 status       - 查看服务状态"
echo "  pm2 logs         - 查看日志"
echo "  pm2 stop all     - 停止所有服务"
echo "  pm2 restart all  - 重启所有服务"
