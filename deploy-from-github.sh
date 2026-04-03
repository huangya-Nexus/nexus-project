#!/bin/bash

echo "=========================================="
echo "Nexus 项目 - 服务器部署脚本"
echo "=========================================="
echo ""

echo "部署流程:"
echo "1. 从 GitHub 拉取最新代码"
echo "2. 安装依赖"
echo "3. 构建项目"
echo "4. 重启服务"
echo ""

# 配置
PROJECT_DIR="/opt/nexus"
GITHUB_REPO="https://github.com/huangya-Nexus/nexus-project.git"

echo "=========================================="
echo "步骤 1: 进入项目目录"
echo "=========================================="
cd $PROJECT_DIR || {
    echo "目录不存在，克隆仓库..."
    git clone $GITHUB_REPO $PROJECT_DIR
    cd $PROJECT_DIR
}

echo ""
echo "=========================================="
echo "步骤 2: 拉取最新代码"
echo "=========================================="
git pull origin main

echo ""
echo "=========================================="
echo "步骤 3: 安装后端依赖"
echo "=========================================="
cd backend
npm install

echo ""
echo "=========================================="
echo "步骤 4: 构建后端"
echo "=========================================="
npm run build

echo ""
echo "=========================================="
echo "步骤 5: 安装前端依赖"
echo "=========================================="
cd ../frontend
npm install

echo ""
echo "=========================================="
echo "步骤 6: 构建前端"
echo "=========================================="
npm run build

echo ""
echo "=========================================="
echo "步骤 7: 重启后端服务"
echo "=========================================="
cd ../backend
# 如果使用 PM2
if command -v pm2 &> /dev/null; then
    pm2 restart nexus-backend || pm2 start dist/index.js --name nexus-backend
else
    # 直接启动
    pkill -f "node dist/index.js" 2>/dev/null
    nohup node dist/index.js > app.log 2>&1 &
fi

echo ""
echo "=========================================="
echo "步骤 8: 检查服务状态"
echo "=========================================="
sleep 3
curl -s http://localhost:3001/api/health

echo ""
echo "=========================================="
echo "部署完成!"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  前端: http://$(curl -s ifconfig.me)"
echo "  后端: http://$(curl -s ifconfig.me):3001"
echo ""
