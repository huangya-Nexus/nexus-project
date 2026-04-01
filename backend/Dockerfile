# 后端 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制 package.json
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci --only=production

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY . .

# 编译 TypeScript
RUN npm run build

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "dist/index.js"]
