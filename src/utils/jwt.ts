import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
  email: string;
  type?: 'access' | 'refresh';
}

export function signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  const secret = env.REFRESH_TOKEN_SECRET || env.JWT_SECRET;
  return jwt.sign({ ...payload, type: 'refresh' }, secret, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const secret = env.REFRESH_TOKEN_SECRET || env.JWT_SECRET;
  return jwt.verify(token, secret) as JwtPayload;
}

export function generateTokenPair(payload: Omit<JwtPayload, 'type'>) {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export function parseTokenExpiry(expiresIn: string): Date {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days
  }
  const [, value, unit] = match;
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + parseInt(value) * multipliers[unit]);
}

export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
