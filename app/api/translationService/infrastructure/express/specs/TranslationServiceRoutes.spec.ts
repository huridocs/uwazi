import type { Request, Response } from 'express';
import { UserRole } from '#shared/types/userSchema.js';
import { TranslationServiceModuleFactory } from '../../TranslationServiceModuleFactory.js';
import { RequestTranslationController } from '../RequestTranslationController.js';
import { translationServiceRoutes } from '../TranslationServiceRoutes.js';

const adminUser = {
  _id: 'admin-user-id',
  username: 'Admin',
  role: UserRole.ADMIN,
  email: 'admin@test.com',
};

const createMockResponse = () => {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return response;
};

describe('RequestTranslationController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 200 with translated_text', async () => {
    const execute = jest.fn().mockResolvedValue({ translated_text: 'hola' });
    jest
      .spyOn(TranslationServiceModuleFactory, 'createRequestTranslation')
      .mockReturnValue({ execute } as any);

    const request = {
      body: {
        text: 'hello',
        language_from: 'en',
        language_to: 'es',
      },
      user: adminUser,
    } as unknown as Request;
    const response = createMockResponse();

    await RequestTranslationController.createHandler()(request, response as unknown as Response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ translated_text: 'hola' });
    expect(execute).toHaveBeenCalledWith({
      text: 'hello',
      language_from: 'en',
      language_to: 'es',
    });
  });

  it('should reject empty text', async () => {
    const request = {
      body: {
        text: '',
        language_from: 'en',
        language_to: 'es',
      },
      user: adminUser,
    } as unknown as Request;
    const response = createMockResponse();

    await expect(
      RequestTranslationController.createHandler()(request, response as unknown as Response)
    ).rejects.toThrow();
  });
});

describe('translationServiceRoutes', () => {
  it('should register POST /api/translationService with three middlewares/handler', () => {
    const post = jest.fn();

    translationServiceRoutes({ post } as any);

    expect(post).toHaveBeenCalledWith(
      '/api/translationService',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    );
  });
});
