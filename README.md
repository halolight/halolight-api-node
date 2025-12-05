# HaloLight API Node

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-%23339933.svg?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-%233178C6.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-%23000000.svg?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-%232D3748.svg?logo=prisma)](https://www.prisma.io/)

HaloLight 后台管理系统的 **Node.js 后端 API 服务**，基于 Express 5 + TypeScript + Prisma 构建，提供完整的 RESTful API。

- API 地址：<https://api-node.halolight.h7ml.cn>
- GitHub：<https://github.com/halolight/halolight-api-node>

## 功能亮点

- **Express 5**：最新版 Express 框架
- **TypeScript**：完整类型支持
- **Prisma ORM**：类型安全的数据库访问
- **JWT 认证**：安全的身份验证
- **Zod 验证**：请求数据验证
- **Swagger**：自动 API 文档

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/halolight/halolight-api-node.git
cd halolight-api-node

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 初始化数据库
pnpm db:push

# 启动开发服务器
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
│   ├── routes/               # 路由定义
│   │   ├── auth.ts           # 认证路由
│   │   ├── users.ts          # 用户路由
│   │   └── index.ts          # 路由聚合
│   ├── middleware/           # 中间件
│   │   ├── auth.ts           # JWT 认证
│   │   ├── validate.ts       # 请求验证
│   │   └── error.ts          # 错误处理
│   ├── services/             # 业务逻辑
│   ├── utils/                # 工具函数
│   └── types/                # 类型定义
├── prisma/
│   └── schema.prisma         # 数据库模型
├── tsconfig.json
└── package.json
```

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
| `DATABASE_URL` | 数据库连接字符串 | - |
| `JWT_SECRET` | JWT 密钥 | - |
| `JWT_EXPIRES_IN` | Token 过期时间 | `7d` |

## 部署

### Docker

```bash
docker build -t halolight-api-node .
docker run -d -p 3001:3001 --env-file .env halolight-api-node
```

### PM2

```bash
pnpm build
pm2 start dist/index.js --name halolight-api
```

## 相关链接

- [HaloLight 文档](https://halolight.docs.h7ml.cn)
- [Express 文档](https://expressjs.com/)
- [Prisma 文档](https://www.prisma.io/docs)

## 许可证

[MIT](LICENSE)
