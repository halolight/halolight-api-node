import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

const ACCESS_EXPIRES = '7d';
const REFRESH_EXPIRES = '30d';

export type AuthTokens = { accessToken: string; refreshToken: string };

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  username?: string;
  phone?: string;
};

export type LoginResult = AuthTokens | null;

const accessSecret = process.env.JWT_SECRET!;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET || accessSecret;

export const authService = {
  async register(input: RegisterInput): Promise<AuthTokens> {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username ?? input.email,
        phone: input.phone,
        password: passwordHash,
        name: input.name || 'User',
      },
    });
    return this.issueTokens(user.id, null, null);
  },

  async login(
    email: string,
    password: string,
    ip?: string | null,
    userAgent?: string | null
  ): Promise<LoginResult> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    if (user.status !== 'ACTIVE') return null;
    await this.updateLastLogin(user.id);
    return this.issueTokens(user.id, ip ?? null, userAgent ?? null);
  },

  async refresh(
    refreshToken: string,
    ip?: string | null,
    userAgent?: string | null
  ): Promise<AuthTokens | null> {
    const record = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) return null;
    try {
      const payload = jwt.verify(refreshToken, refreshSecret) as { sub: string; type: string };
      if (payload.type !== 'refresh') return null;
      // rotate: revoke old token, issue new
      return this.issueTokens(payload.sub, ip ?? null, userAgent ?? null, refreshToken);
    } catch {
      return null;
    }
  },

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return true;
  },

  async me(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        department: true,
        position: true,
        bio: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return true; // Don't reveal if email exists
    // issue short-lived reset token; actual email sending is out of scope
    const resetToken = jwt.sign({ sub: user.id, type: 'reset' }, accessSecret, { expiresIn: '1h' });
    // TODO: send resetToken via email service
    void resetToken;
    return true;
  },

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = jwt.verify(token, accessSecret) as { sub: string; type: string };
      if (payload.type !== 'reset') return false;
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: payload.sub }, data: { password: passwordHash } });
      // Revoke all refresh tokens
      await prisma.refreshToken.updateMany({
        where: { userId: payload.sub },
        data: { revokedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  },

  async updateLastLogin(userId: string) {
    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  },

  async issueTokens(
    userId: string,
    ip: string | null,
    userAgent: string | null,
    oldRefreshToken?: string
  ): Promise<AuthTokens> {
    const accessToken = jwt.sign({ sub: userId, type: 'access' }, accessSecret, {
      expiresIn: ACCESS_EXPIRES,
    });
    const refreshToken = jwt.sign({ sub: userId, type: 'refresh' }, refreshSecret, {
      expiresIn: REFRESH_EXPIRES,
    });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.$transaction([
      oldRefreshToken
        ? prisma.refreshToken.updateMany({
            where: { userId, token: oldRefreshToken, revokedAt: null },
            data: { revokedAt: new Date() },
          })
        : prisma.refreshToken.deleteMany({
            where: { userId, revokedAt: null, expiresAt: { lt: new Date() } },
          }),
      prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId,
          ip: ip ?? undefined,
          userAgent: userAgent ?? undefined,
          expiresAt,
        },
      }),
    ]);

    return { accessToken, refreshToken };
  },
};
