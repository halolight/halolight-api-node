# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## 项目概述

HaloLight Node.js 后端 API 服务，基于 Express 5 + TypeScript + Prisma 构建。

## 技术栈

- **框架**: Express 5 + TypeScript
- **ORM**: Prisma 6
- **数据库**: PostgreSQL
- **认证**: JWT (jsonwebtoken)
- **验证**: Zod
- **运行时**: Node.js 20+

## 常用命令

```bash
pnpm dev          # 开发模式 (tsx watch)
pnpm build        # TypeScript 编译
pnpm start        # 生产模式
pnpm db:generate  # 生成 Prisma Client
pnpm db:push      # 推送数据库变更
pnpm db:migrate   # 数据库迁移
pnpm db:studio    # Prisma Studio
```

## 项目结构

```
src/
├── index.ts          # 入口
├── routes/           # 路由
├── middleware/       # 中间件
├── services/         # 业务逻辑
├── utils/            # 工具函数
└── types/            # 类型定义
```

## 路由定义

```typescript
// src/routes/users.ts
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { auth } from '../middleware/auth';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

router.post('/', auth, validate(createUserSchema), async (req, res) => {
  // 创建用户逻辑
});

export default router;
```

## 中间件

### 认证中间件

```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 验证中间件

```typescript
// src/middleware/validate.ts
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  req.body = result.data;
  next();
};
```

## Prisma 使用

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 查询用户
const users = await prisma.user.findMany({
  where: { role: 'ADMIN' },
  select: { id: true, email: true, name: true },
});

// 创建用户
const user = await prisma.user.create({
  data: { email, name, password: hashedPassword },
});
```

## 环境变量

```bash
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/halolight"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"
```
