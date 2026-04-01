# 知链 Nexus - 备份清单

**备份日期**: 2026-03-31 16:08  
**备份位置**: `/Users/huangya/.openclaw/workspace/projects/nexus/backup/20260331/`

---

## 📦 备份内容

### 1. 数据库备份

| 文件 | 大小 | 说明 |
|------|------|------|
| `nexus-database-1608.db` | 208KB | 生产数据库（prod.db） |
| `nexus-database-dev-1608.db` | 68KB | 开发数据库（dev.db） |

**包含数据**:
- 用户信息
- 知识图谱
- 知识点
- 知识关联
- 分享记录
- 复习卡片
- 搜索历史

### 2. 源代码备份

| 文件 | 大小 | 说明 |
|------|------|------|
| `nexus-source-code.tar.gz` | 271KB | 完整源代码（排除node_modules） |

**包含内容**:
- backend/ - 后端代码
- frontend/ - 前端代码
- *.md - 文档文件

### 3. 文档文件

| 文件 | 说明 |
|------|------|
| `README.md` | 项目简介 |
| `USER_GUIDE.md` | 使用文档 |
| `DEPLOY_GUIDE.md` | 部署文档 |
| `DEVELOPMENT_LOG.md` | 开发日志 |
| `PROJECT_COMPLETE_RECORD.md` | 项目完整记录 |

---

## 🔧 恢复方法

### 恢复数据库

```bash
# 停止服务
pm2 stop nexus-backend

# 恢复数据库
cp backup/20260331/nexus-database-1608.db backend/prisma/prod.db

# 重启服务
pm2 start nexus-backend
```

### 恢复源代码

```bash
# 解压源代码
tar -xzf backup/20260331/nexus-source-code.tar.gz

# 安装依赖
cd backend && npm install
cd frontend && npm install

# 构建
cd backend && npm run build
cd frontend && npm run build

# 启动
cd backend && npm start
cd frontend && npm run dev
```

---

## 📝 备份记录

| 时间 | 类型 | 文件 | 大小 |
|------|------|------|------|
| 2026-03-31 16:08 | 数据库 | nexus-database-1608.db | 208KB |
| 2026-03-31 16:08 | 数据库 | nexus-database-dev-1608.db | 68KB |
| 2026-03-31 16:09 | 源代码 | nexus-source-code.tar.gz | 271KB |

**总大小**: 547KB

---

## ✅ 验证备份

```bash
# 检查数据库完整性
cd backup/20260331
sqlite3 nexus-database-1608.db ".tables"

# 检查压缩包
tar -tzf nexus-source-code.tar.gz | head -20
```

---

**备份人**: Dot  
**备份状态**: ✅ 完成
