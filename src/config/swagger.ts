import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'HaloLight API',
    version: '1.0.0',
    description: 'HaloLight Admin System Backend API - Node.js/Express implementation',
    contact: {
      name: 'HaloLight Team',
      email: 'h7ml@qq.com',
    },
    license: {
      name: 'MIT License',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local Development Server',
    },
    {
      url: 'https://halolight-api-node.h7ml.cn',
      description: 'Production Server (Primary)',
    },
    {
      url: 'https://api-node.halolight.h7ml.cn',
      description: 'Production Server (Alternative)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@halolight.h7ml.cn' },
          password: { type: 'string', minLength: 6, example: 'password123' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string', minLength: 2 },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          avatar: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User management' },
    { name: 'Roles', description: 'Role management' },
    { name: 'Permissions', description: 'Permission management' },
    { name: 'Teams', description: 'Team management' },
    { name: 'Documents', description: 'Document management' },
    { name: 'Files', description: 'File management' },
    { name: 'Folders', description: 'Folder management' },
    { name: 'Calendar', description: 'Calendar events' },
    { name: 'Notifications', description: 'Notification management' },
    { name: 'Messages', description: 'Message management' },
    { name: 'Dashboard', description: 'Dashboard statistics' },
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'User login',
        description: 'Authenticate user and return JWT tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'User registration',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Token refreshed' },
          401: { description: 'Invalid refresh token' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user info' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'User logout',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Logout successful' },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'User list with pagination' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: { description: 'User created' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'User details' },
          404: { description: 'User not found' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'User updated' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'User deleted' },
        },
      },
    },
    '/api/roles': {
      get: {
        tags: ['Roles'],
        summary: 'List roles',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Role list' } },
      },
      post: {
        tags: ['Roles'],
        summary: 'Create role',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Role created' } },
      },
    },
    '/api/permissions': {
      get: {
        tags: ['Permissions'],
        summary: 'List permissions',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Permission list' } },
      },
    },
    '/api/teams': {
      get: {
        tags: ['Teams'],
        summary: 'List teams',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Team list' } },
      },
    },
    '/api/documents': {
      get: {
        tags: ['Documents'],
        summary: 'List documents',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Document list' } },
      },
    },
    '/api/files': {
      get: {
        tags: ['Files'],
        summary: 'List files',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'File list' } },
      },
    },
    '/api/folders': {
      get: {
        tags: ['Folders'],
        summary: 'List folders',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Folder list' } },
      },
    },
    '/api/calendar/events': {
      get: {
        tags: ['Calendar'],
        summary: 'List calendar events',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Event list' } },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Notification list' } },
      },
    },
    '/api/messages/conversations': {
      get: {
        tags: ['Messages'],
        summary: 'List conversations',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Conversation list' } },
      },
    },
    '/api/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard statistics',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Dashboard stats' } },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'HaloLight API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    })
  );
};
