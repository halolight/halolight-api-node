# HaloLight API Node

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-%23339933.svg?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-%233178C6.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-%23000000.svg?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-%232D3748.svg?logo=prisma)](https://www.prisma.io/)

HaloLight 后台管理系统的 **Node.js 后端 API 服务**，基于 Express 5 + TypeScript + Prisma 构建，提供完整的 RESTful API。

- 🌐 API 地址：<https://halolight-api-node.h7ml.cn>
- 📚 API 文档：<https://halolight-api-node.h7ml.cn/docs>
- 🐙 GitHub：<https://github.com/halolight/halolight-api-node>

## 功能亮点

- **Express 5**：最新版 Express 框架
- **TypeScript 5**：完整类型支持
- **Prisma 6 ORM**：类型安全的数据库访问
- **JWT 双令牌认证**：Access Token + Refresh Token
- **RBAC 权限系统**：基于角色的访问控制
- **Zod 验证**：请求数据验证
- **Swagger 文档**：完整的 API 文档
- **Docker 支持**：一键部署
- **12 个业务模块**：完整的后台管理 API
- **90+ RESTful 端点**：覆盖常见业务场景

## 快速开始

### Docker 部署（推荐）

```bash
# 1. 配置环境
cp .env.docker .env
nano .env  # 修改 JWT_SECRET 和 POSTGRES_PASSWORD

# 2. 启动服务
docker compose up -d

# 3. 访问
# API: http://localhost:3001
# Swagger: http://localhost:3001/docs
```

### 本地开发

```bash
pnpm install
cp .env.example .env
pnpm db:push
pnpm dev
```

## 常用脚本

```bash
pnpm dev          # 启动开发服务器 (watch 模式)
pnpm build        # TypeScript 编译
pnpm start        # 启动生产服务器
pnpm lint         # ESLint 检查
pnpm db:generate  # 生成 Prisma Client
pnpm db:push      # 推送数据库变更
pnpm db:migrate   # 运行数据库迁移
pnpm db:studio    # 打开 Prisma Studio
```

## 项目结构

```
halolight-api-node/
├── src/
│   ├── index.ts              # 入口文件
│   ├── config/
│   │   └── env.ts            # 环境变量配置
│   ├── routes/               # 路由定义 (12 个模块)
│   │   ├── index.ts          # 路由聚合
│   │   ├── auth.ts           # 认证路由
│   │   ├── users.ts          # 用户管理
│   │   ├── roles.ts          # 角色管理
│   │   ├── permissions.ts    # 权限管理
│   │   ├── teams.ts          # 团队管理
│   │   ├── documents.ts      # 文档管理
│   │   ├── files.ts          # 文件管理
│   │   ├── folders.ts        # 文件夹管理
│   │   ├── calendar.ts       # 日历事件
│   │   ├── notifications.ts  # 通知管理
│   │   ├── messages.ts       # 消息管理
│   │   └── dashboard.ts      # 仪表盘统计
│   ├── services/             # 业务逻辑层
│   ├── middleware/           # 中间件
│   │   ├── auth.ts           # JWT 认证 + RBAC
│   │   ├── validate.ts       # Zod 请求验证
│   │   └── error.ts          # 全局错误处理
│   ├── utils/                # 工具函数
│   └── types/                # 类型定义
├── prisma/
│   └── schema.prisma         # 数据库模型 (17+ 模型)
├── .github/
│   └── workflows/ci.yml      # GitHub Actions CI
├── tsconfig.json
└── package.json
```

## API 端点

### 认证 (Public)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| POST | `/api/auth/forgot-password` | 忘记密码 |
| POST | `/api/auth/reset-password` | 重置密码 |

### 认证 (Protected)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/auth/me` | 获取当前用户 |
| POST | `/api/auth/logout` | 登出 |

### 用户管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/users` | 用户列表（分页） |
| GET | `/api/users/:id` | 用户详情 |
| POST | `/api/users` | 创建用户 |
| PATCH | `/api/users/:id` | 更新用户 |
| PATCH | `/api/users/:id/status` | 更新状态 |
| POST | `/api/users/batch-delete` | 批量删除 |
| DELETE | `/api/users/:id` | 删除用户 |

### 其他模块

- **Roles** (`/api/roles`) - 角色 CRUD + 权限分配
- **Permissions** (`/api/permissions`) - 权限 CRUD
- **Teams** (`/api/teams`) - 团队 CRUD + 成员管理
- **Documents** (`/api/documents`) - 文档 CRUD + 分享/标签
- **Files** (`/api/files`) - 文件上传/下载/管理
- **Folders** (`/api/folders`) - 文件夹树形结构
- **Calendar** (`/api/calendar/events`) - 日历事件管理
- **Notifications** (`/api/notifications`) - 通知管理
- **Messages** (`/api/messages`) - 消息会话
- **Dashboard** (`/api/dashboard`) - 统计数据

## API 示例

### 认证

```typescript
// POST /api/auth/login
{
  "email": "admin@halolight.h7ml.cn",
  "password": "password123"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "email": "admin@halolight.h7ml.cn",
    "name": "Admin"
  }
}
```

### 用户管理

```typescript
// GET /api/users
// Headers: Authorization: Bearer <token>

// Response
{
  "data": [
    { "id": "1", "email": "admin@halolight.h7ml.cn", "name": "Admin" }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

## 数据库配置

### Prisma Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | `3001` |
| `NODE_ENV` | 运行环境 | `development` |
| `DATABASE_URL` | 数据库连接字符串 | - |
| `JWT_SECRET` | JWT 密钥 (≥32字符) | - |
| `JWT_EXPIRES_IN` | Access Token 过期时间 | `7d` |
| `REFRESH_TOKEN_SECRET` | Refresh Token 密钥 | - |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh Token 过期时间 | `30d` |
| `CORS_ORIGIN` | 允许的跨域来源 | `http://localhost:3000` |

## 部署

### Docker 部署

```bash
# 生产部署
docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 共享数据库部署（多个 API 服务）

如需 Node.js、NestJS、Java API 共享同一数据库：

```bash
# 1. 修改 .env 中的 DATABASE_URL 指向共享数据库
DATABASE_URL=postgresql://user:pass@shared-db:5432/halolight

# 2. 在 docker-compose.yml 中注释掉 postgres 服务

# 3. 确保所有服务使用相同的 JWT_SECRET
```

### 生产域名

- 主域名：https://halolight-api-node.h7ml.cn
- 备用域名：https://api-node.halolight.h7ml.cn
- Swagger：https://halolight-api-node.h7ml.cn/docs

## 相关链接

- [HaloLight 文档](https://halolight.docs.h7ml.cn)
- [Express 文档](https://expressjs.com/)
- [Prisma 文档](https://www.prisma.io/docs)

## 许可证

[MIT](LICENSE)
