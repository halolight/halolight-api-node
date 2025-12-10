import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { errorResponse } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        name: string;
        status: string;
        roles: Array<{
          role: {
            id: string;
            name: string;
            label: string;
            permissions: Array<{
              permission: {
                id: string;
                action: string;
                resource: string;
              };
            }>;
          };
        }>;
        permissions: Set<string>;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and loads user with roles and permissions
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(errorResponse('Unauthorized', 'No token provided'));
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    // Load user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
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

    if (!user) {
      res.status(401).json(errorResponse('Unauthorized', 'User not found'));
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(401).json(errorResponse('Unauthorized', 'Account is not active'));
      return;
    }

    // Collect all permissions from roles
    const permissions = new Set<string>();
    user.roles.forEach((userRole) => {
      userRole.role.permissions.forEach((rolePermission) => {
        permissions.add(rolePermission.permission.action);
      });
    });

    req.user = {
      ...user,
      permissions,
    };

    next();
  } catch (_error) {
    res.status(401).json(errorResponse('Unauthorized', 'Invalid or expired token'));
  }
}

/**
 * Permission check middleware factory
 * Requires user to have specific permissions
 */
export function requirePermissions(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(errorResponse('Unauthorized', 'Authentication required'));
      return;
    }

    // Check if user has all required permissions
    // Support wildcard matching: "users:*", "*"
    const hasAllPermissions = requiredPermissions.every((requiredPerm) => {
      // Check for exact match
      if (req.user!.permissions.has(requiredPerm)) {
        return true;
      }

      // Check for wildcard match
      if (req.user!.permissions.has('*')) {
        return true;
      }

      // Check for resource wildcard (e.g., "users:*")
      const [resource] = requiredPerm.split(':');
      if (req.user!.permissions.has(`${resource}:*`)) {
        return true;
      }

      return false;
    });

    if (!hasAllPermissions) {
      res.status(403).json(errorResponse('Forbidden', 'Insufficient permissions'));
      return;
    }

    next();
  };
}

/**
 * Role check middleware factory
 * Requires user to have specific roles
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(errorResponse('Unauthorized', 'Authentication required'));
      return;
    }

    const userRoles = req.user.roles.map((r) => r.role.name);
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json(errorResponse('Forbidden', 'Insufficient role'));
      return;
    }

    next();
  };
}
