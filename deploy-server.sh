#!/bin/bash

# Nexus 服务器部署脚本

set -e

echo "🚀 开始部署 Nexus 到服务器..."

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 sudo 运行"
    exit 1
fi

# 安装 Docker
echo "📦 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# 安装 Docker Compose
echo "📦 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 创建应用目录
echo "📁 创建应用目录..."
mkdir -p /opt/nexus
cd /opt/nexus

# 复制项目文件（假设已在本地准备好）
echo "📂 部署项目文件..."
# 这里可以通过 git clone 或 scp 复制文件

# 设置权限
echo "🔐 设置权限..."
mkdir -p data
chmod 755 data

# 生成随机 JWT 密钥
if [ ! -f .env ]; then
    echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
    echo "✅ 已生成 JWT 密钥"
fi

# 构建并启动
echo "🏗️ 构建并启动服务..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查健康状态
echo "🏥 检查服务健康状态..."
if curl -s http://localhost:3001/api/health | grep -q "ok"; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务异常"
    exit 1
fi

if curl -s http://localhost:3000 | grep -q "html"; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常"
    exit 1
fi

# 配置防火墙
echo "🛡️ 配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 服务状态:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "🌐 访问地址:"
echo "  - 前端: http://$(curl -s ifconfig.me):3000"
echo "  - 后端: http://$(curl -s ifconfig.me):3001"
echo ""
echo "📋 常用命令:"
echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f"
echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
echo "  停止服务: docker-compose -f docker-compose.prod.yml down"
