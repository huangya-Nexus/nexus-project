# Nexus 生产部署指南

## 服务器要求

- Ubuntu 20.04+ / CentOS 8+
- 2GB+ RAM
- 20GB+ 磁盘空间
- 域名（可选，用于HTTPS）

## 快速部署

### 1. 安装 Docker

```bash
# Ubuntu
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 克隆项目

```bash
git clone <your-repo-url> /opt/nexus
cd /opt/nexus
```

### 3. 配置环境变量

```bash
# 后端环境
cp backend/.env.production backend/.env

# 编辑配置
nano backend/.env
```

关键配置项：
```
JWT_SECRET=your-super-secret-key-here
DATABASE_URL=file:./data/prod.db
NODE_ENV=production
```

### 4. 使用 Docker Compose 部署

```bash
# 创建数据目录
mkdir -p data

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 5. 配置 Nginx（可选，用于HTTPS）

```bash
sudo apt install nginx certbot python3-certbot-nginx

# 创建配置文件
sudo tee /etc/nginx/sites-available/nexus <<'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 配置 HTTPS
sudo certbot --nginx -d your-domain.com
```

### 6. 配置防火墙

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 手动部署（无Docker）

### 安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 部署后端

```bash
cd /opt/nexus/backend
npm install --production
npm run build
cp .env.production .env

# 使用 PM2 启动
sudo npm install -g pm2
pm2 start dist/index.js --name nexus-backend
pm2 save
pm2 startup
```

### 部署前端

```bash
cd /opt/nexus/frontend
npm install
npm run build

# 安装 serve
sudo npm install -g serve
pm2 start serve --name nexus-frontend -- -s dist -p 3000
pm2 save
```

## 维护命令

```bash
# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 重启服务
docker-compose restart

# 更新部署
git pull
docker-compose down
docker-compose up -d --build

# 备份数据
cp backend/data/prod.db backup/prod-$(date +%Y%m%d).db
```

## 监控

```bash
# 安装监控工具
sudo apt install htop

# Docker 监控
docker stats

# 查看服务状态
pm2 status
pm2 monit
```

## 故障排查

1. **端口被占用**
   ```bash
   sudo lsof -i :3000
   sudo lsof -i :3001
   ```

2. **权限问题**
   ```bash
   sudo chown -R $USER:$USER /opt/nexus
   ```

3. **数据库问题**
   ```bash
   # 重置数据库
   rm backend/data/prod.db
   cd backend && npx prisma migrate deploy
   ```

## 安全建议

1. 使用强密码的 JWT_SECRET
2. 配置防火墙，只开放必要端口
3. 启用 HTTPS
4. 定期备份数据
5. 及时更新依赖包
