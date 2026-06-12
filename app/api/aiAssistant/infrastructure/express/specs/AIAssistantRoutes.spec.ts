import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { tenants } from '#api/tenants/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { UserRole } from '#shared/types/userSchema.js';
import { AIAssistantFactory } from '../../AIAssistantFactory.js';
import { aiAssistantRoutes } from '../AIAssistantRoutes.js';

jest.mock('#api/auth/index.js', () => ({
  needsAuthorization: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const adminUser = {
  _id: 'admin-user-id',
  username: 'Admin',
  role: UserRole.ADMIN,
  email: 'admin@test.com',
};

const app: Application = setUpApp(
  aiAssistantRoutes,
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = adminUser;
    next();
  }
);

describe('AIAssistantRoutes', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [
        { languages: [{ key: 'en' as LanguageISO6391, label: 'English', default: true }] },
      ],
    });
    tenants.current().featureFlags!.aiAssistant = true;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(() => {
    tenants.current().domain = '127.0.0.1';
    jest.spyOn(AIAssistantFactory, 'createSendMessage').mockReturnValue({
      execute: jest.fn().mockResolvedValue({ jobId: 'job-123' }),
    } as any);
    jest.spyOn(AIAssistantFactory, 'createCancelConversation').mockReturnValue({
      execute: jest.fn().mockResolvedValue(undefined),
    } as any);
    tenants.current().featureFlags!.aiAssistant = true;
  });

  it('should return 403 when aiAssistant feature flag is disabled', async () => {
    tenants.current().featureFlags!.aiAssistant = false;

    const response = await request(app)
      .post('/api/aiAssistant/messages')
      .set('Cookie', 'connect.sid=test-session')
      .send({
        message: 'Hello Bert',
        password: 'secret',
        context: { mode: 'auto', chips: [] },
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Feature not available' });
  });

  it('should reject invalid payloads without password', async () => {
    const response = await request(app)
      .post('/api/aiAssistant/messages')
      .set('Cookie', 'connect.sid=test-session')
      .send({
        message: 'Hello Bert',
        context: { mode: 'auto', chips: [] },
      });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it('should reject empty messages', async () => {
    const response = await request(app)
      .post('/api/aiAssistant/messages')
      .set('Cookie', 'connect.sid=test-session')
      .send({
        message: '',
        password: 'secret',
        context: { mode: 'auto', chips: [] },
      });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it('should return 202 with jobId when flag is enabled', async () => {
    const execute = jest.fn().mockResolvedValue({ jobId: 'job-123' });
    jest.spyOn(AIAssistantFactory, 'createSendMessage').mockReturnValue({ execute } as any);

    const response = await request(app)
      .post('/api/aiAssistant/messages')
      .set('Cookie', 'connect.sid=test-session')
      .send({
        message: 'Summarise this case',
        password: 'secret',
        context: {
          mode: 'auto',
          chips: [{ id: 'chip-1', label: 'Velásquez judgment', kind: 'document' }],
        },
      });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ jobId: 'job-123' });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantName: expect.any(String),
        userId: adminUser._id,
        sessionId: 'test-session',
        message: 'Summarise this case',
        credentials: expect.objectContaining({
          username: adminUser.username,
          password: 'secret',
          url: 'http://127.0.0.1',
        }),
      })
    );
  });

  it('should return 204 when cancelling a conversation', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(AIAssistantFactory, 'createCancelConversation').mockReturnValue({
      execute,
    } as any);

    const response = await request(app)
      .post('/api/aiAssistant/conversation/cancel')
      .set('Cookie', 'connect.sid=test-session')
      .send({
        jobId: 'job-123',
        password: 'secret',
      });

    expect(response.status).toBe(204);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantName: expect.any(String),
        jobId: 'job-123',
        credentials: expect.objectContaining({
          username: adminUser.username,
          password: 'secret',
          url: 'http://127.0.0.1',
        }),
      })
    );
  });
});
