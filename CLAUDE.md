# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## 项目概述

HaloLight Node.js 后端 API 服务，基于 Express 5 + TypeScript + Prisma 构建，提供完整的 RESTful API，包含 12 个业务模块。

## 技术栈

- **框架**: Express 5 + TypeScript 5
- **ORM**: Prisma 6
- **数据库**: PostgreSQL 16
- **认证**: JWT 双令牌 (Access Token + Refresh Token)
- **验证**: Zod
- **日志**: Pino
- **运行时**: Node.js 20+

## 常用命令

```bash
pnpm dev          # 开发模式 (tsx watch)
pnpm build        # TypeScript 编译
pnpm start        # 生产模式
pnpm lint         # ESLint 检查
pnpm lint:fix     # ESLint 自动修复
pnpm db:generate  # 生成 Prisma Client
pnpm db:push      # 推送数据库变更
pnpm db:migrate   # 数据库迁移
pnpm db:studio    # Prisma Studio
pnpm db:seed      # 填充种子数据
```

## 项目结构

```
src/
├── index.ts              # 入口文件
├── config/
│   └── env.ts            # 环境变量配置
├── routes/               # 路由定义 (12 个模块)
│   ├── index.ts          # 路由聚合
│   ├── auth.ts           # 认证路由
│   ├── users.ts          # 用户管理
│   ├── roles.ts          # 角色管理
│   ├── permissions.ts    # 权限管理
│   ├── teams.ts          # 团队管理
│   ├── documents.ts      # 文档管理
│   ├── files.ts          # 文件管理
│   ├── folders.ts        # 文件夹管理
│   ├── calendar.ts       # 日历事件
│   ├── notifications.ts  # 通知管理
│   ├── messages.ts       # 消息管理
│   └── dashboard.ts      # 仪表盘统计
├── services/             # 业务逻辑层
├── middleware/           # 中间件
│   ├── auth.ts           # JWT 认证 + RBAC 权限
│   ├── validate.ts       # Zod 请求验证
│   └── error.ts          # 全局错误处理
├── utils/                # 工具函数
│   ├── jwt.ts            # JWT 双令牌工具
│   ├── hash.ts           # 密码哈希
│   ├── prisma.ts         # Prisma 客户端
│   └── response.ts       # 统一响应格式
└── types/                # 类型定义
prisma/
└── schema.prisma         # 数据库模型 (17+ 模型)
```

## API 模块

| 模块 | 路由前缀 | 端点数 | 说明 |
|------|----------|--------|------|
| Auth | `/api/auth` | 7 | 登录、注册、刷新令牌、登出、获取当前用户、忘记/重置密码 |
| Users | `/api/users` | 7 | CRUD、分页搜索、状态更新、批量删除 |
| Roles | `/api/roles` | 6 | CRUD、权限分配 |
| Permissions | `/api/permissions` | 4 | CRUD |
| Teams | `/api/teams` | 7 | CRUD、成员管理 |
| Documents | `/api/documents` | 11 | CRUD、分享、标签、移动 |
| Files | `/api/files` | 14 | 上传、下载、存储信息、移动、复制、收藏 |
| Folders | `/api/folders` | 5 | 树形结构管理 |
| Calendar | `/api/calendar/events` | 9 | 事件、参会人管理 |
| Notifications | `/api/notifications` | 5 | 通知管理 |
| Messages | `/api/messages` | 5 | 会话、消息 |
| Dashboard | `/api/dashboard` | 9 | 统计数据 |

## 认证机制

### 双令牌认证

```typescript
// 登录返回
{
  "accessToken": "eyJ...",   // 7天有效
  "refreshToken": "eyJ...",  // 30天有效
  "user": { ... }
}

// 刷新令牌
POST /api/auth/refresh
{ "refreshToken": "eyJ..." }
```

### 权限检查

```typescript
// 使用 requirePermissions 中间件
router.get('/', requirePermissions('users:view'), handler);

// 支持通配符
requirePermissions('documents:*')  // 文档所有权限
requirePermissions('*')            // 超级管理员
```

## 统一响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "meta": { "total": 100, "page": 1, "limit": 10 }
}

// 错误响应
{
  "success": false,
  "message": "错误信息",
  "error": "ERROR_CODE"
}
```

## 环境变量

```bash
# 应用配置
PORT=3001
NODE_ENV=development

# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/halolight"

# JWT 配置
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-secret-key-min-32-chars"
REFRESH_TOKEN_EXPIRES_IN="30d"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

## 数据库模型

主要模型包括：
- **User** - 用户（含角色、权限关联）
- **Role/Permission** - RBAC 权限系统
- **RefreshToken** - 刷新令牌存储
- **Team/TeamMember** - 团队管理
- **Document/DocumentShare/Tag** - 文档系统
- **File/Folder** - 文件系统
- **CalendarEvent/EventAttendee** - 日历系统
- **Conversation/Message** - 消息系统
- **Notification** - 通知系统
- **ActivityLog** - 活动日志

## 开发规范

1. **路由**: 使用 Express Router，按模块拆分
2. **验证**: 使用 Zod schema 验证请求
3. **错误处理**: 抛出带 statusCode 的 Error，由全局中间件处理
4. **响应格式**: 使用 `successResponse` / `errorResponse` 工具函数
5. **权限**: 使用 `authenticate` + `requirePermissions` 中间件
