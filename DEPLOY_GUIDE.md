# 知链 Nexus - 部署文档

## 🚀 部署方式选择

### 方式1: 本地部署（开发环境）
已完成，当前运行中。

### 方式2: 云服务器部署（推荐）

#### 推荐平台
- 阿里云 ECS
- 腾讯云 CVM
- AWS EC2
- 华为云 ECS

#### 服务器配置建议
- **CPU**: 2核+
- **内存**: 4GB+
- **带宽**: 5Mbps+
- **系统**: Ubuntu 20.04/22.04 LTS

---

## 📋 部署步骤

### 1. 准备服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 安装Nginx
sudo apt install nginx -y
```

### 2. 上传代码

```bash
# 在本地打包代码
cd /path/to/nexus
tar -czf nexus-deploy.tar.gz backend/ frontend/ --exclude='node_modules'

# 上传到服务器
scp nexus-deploy.tar.gz root@your-server-ip:/opt/

# 在服务器解压
ssh root@your-server-ip
cd /opt
mkdir -p nexus
tar -xzf nexus-deploy.tar.gz -C nexus/
```

### 3. 安装依赖

```bash
cd /opt/nexus/backend
npm install
npm run build

cd /opt/nexus/frontend
npm install
npm run build
```

### 4. 配置环境变量

```bash
cd /opt/nexus/backend
cp .env.example .env

# 编辑 .env 文件
nano .env
```

```env
# 生产环境配置
NODE_ENV=production
PORT=3001
DATABASE_URL="file:./prod.db"
JWT_SECRET="your-strong-secret-key-here"
FRONTEND_URL="https://your-domain.com"

# Kimi API（可选）
OPENAI_API_KEY=your-kimi-api-key
OPENAI_BASE_URL=https://api.moonshot.cn/v1
OPENAI_MODEL=moonshot-v1-8k
```

### 5. 初始化数据库

```bash
cd /opt/nexus/backend
npx prisma migrate deploy
npx prisma generate
```

### 6. 使用PM2启动后端

```bash
cd /opt/nexus/backend

# 创建PM2配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nexus-backend',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
EOF

# 创建日志目录
mkdir -p logs

# 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. 配置Nginx

```bash
sudo nano /etc/nginx/sites-available/nexus
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /opt/nexus/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. 配置HTTPS（推荐）

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 🐳 Docker部署（可选）

### Dockerfile

```dockerfile
# 后端
FROM node:18-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
RUN npm run build

# 前端
FROM node:18-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 生产镜像
FROM node:18-alpine
WORKDIR /app

# 复制后端
COPY --from=backend /app/backend/dist ./backend/dist
COPY --from=backend /app/backend/node_modules ./backend/node_modules
COPY --from=backend /app/backend/prisma ./backend/prisma
COPY --from=backend /app/backend/package.json ./backend/

# 复制前端
COPY --from=frontend /app/frontend/dist ./frontend/dist

# 安装Nginx
RUN apk add --no-cache nginx

# 配置
COPY nginx.conf /etc/nginx/nginx.conf
COPY startup.sh ./
RUN chmod +x startup.sh

EXPOSE 80

CMD ["./startup.sh"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  nexus:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./data:/app/backend/prisma
    restart: always
```

### 启动

```bash
docker-compose up -d
```

---

## 🔧 维护命令

### 查看日志

```bash
# 后端日志
pm2 logs nexus-backend

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 重启服务

```bash
# 重启后端
pm2 restart nexus-backend

# 重启Nginx
sudo systemctl restart nginx
```

### 备份数据

```bash
# 自动备份脚本
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /opt/nexus/backend/prisma/prod.db /opt/backups/nexus-$DATE.db
find /opt/backups -name "nexus-*.db" -mtime +7 -delete
EOF

chmod +x /opt/backup.sh

# 添加到定时任务
crontab -e
# 添加: 0 2 * * * /opt/backup.sh
```

### 更新部署

```bash
# 1. 备份数据
cp /opt/nexus/backend/prisma/prod.db /opt/backups/nexus-before-update.db

# 2. 拉取新代码
cd /opt/nexus
git pull

# 3. 更新依赖
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build

# 4. 重启服务
pm2 restart nexus-backend
sudo systemctl restart nginx
```

---

## 📊 监控

### 使用PM2监控

```bash
pm2 monit
```

### 使用Nginx状态

```bash
sudo nginx -V
```

---

## 🆘 故障排除

### 问题1: 502 Bad Gateway

**原因**: 后端服务未启动

**解决**:
```bash
pm2 start nexus-backend
```

### 问题2: 前端白屏

**原因**: 构建失败或路径错误

**解决**:
```bash
cd /opt/nexus/frontend
npm run build
# 检查dist目录是否存在
```

### 问题3: 数据库权限错误

**解决**:
```bash
chmod 755 /opt/nexus/backend/prisma
chmod 644 /opt/nexus/backend/prisma/prod.db
```

---

## 📞 联系方式

如有部署问题，请查看:
- `USER_GUIDE.md` - 使用文档
- `DEVELOPMENT_LOG.md` - 开发日志

---

**版本**: 1.0.0  
**更新日期**: 2026-03-31
