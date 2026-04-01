#!/bin/bash

# Nexus 部署脚本

echo "🚀 开始部署 Nexus 知识图谱系统..."

# 1. 检查环境
echo "📋 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

# 2. 部署后端
echo "🔧 部署后端..."
cd /opt/nexus/backend || exit 1

# 安装依赖
npm install --production

# 复制生产环境配置
cp .env.production .env

# 运行数据库迁移
npx prisma migrate deploy

# 使用 PM2 启动
pm2 delete nexus-backend 2>/dev/null || true
pm2 start dist/index.js --name nexus-backend --env production

# 3. 部署前端
echo "🎨 部署前端..."
cd /opt/nexus/frontend || exit 1

# 安装依赖
npm install

# 构建生产版本
npm run build

# 4. 配置 Nginx
echo "🌐 配置 Nginx..."
sudo tee /etc/nginx/sites-available/nexus > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /opt/nexus/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. 保存 PM2 配置
echo "💾 保存 PM2 配置..."
pm2 save
pm2 startup

echo "✅ 部署完成！"
echo ""
echo "📊 服务状态:"
pm2 status
