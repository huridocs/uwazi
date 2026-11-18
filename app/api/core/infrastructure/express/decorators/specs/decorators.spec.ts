import request from 'supertest';
import type { Application, NextFunction, Request, Response } from 'express';

import needsAuthorization from '#api/auth/authMiddleware.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { tenants } from '#api/tenants/index.js';
import { featureFlagEnabled } from '#api/utils/featureFlagEnabledMiddleware.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { validation } from '#api/utils/index.js';
import { UserRole } from '#shared/types/userSchema.js';

import { Authorize } from '../Authorize.js';
import { RequireFeatureFlag } from '../RequireFeatureFlag.js';
import { ValidateRequest } from '../ValidateRequest.js';

const querySchema = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      additionalProperties: false,
      properties: { name: { type: 'string' } },
    },
  },
};

const coercedQuerySchema = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      additionalProperties: false,
      properties: { page: { type: 'number' } },
    },
  },
};

class AdminOnlyController extends AbstractController {
  @Authorize()
  protected async handle() {
    this.jsonResponse({ ok: true });
  }
}

class EditorController extends AbstractController {
  @Authorize(['admin', 'editor'])
  protected async handle() {
    this.jsonResponse({ ok: true });
  }
}

class ValidatedController extends AbstractController {
  @ValidateRequest(querySchema)
  protected async handle() {
    this.jsonResponse({ query: this.request.query });
  }
}

class CoercedController extends AbstractController {
  @ValidateRequest(coercedQuerySchema, { coerce: true })
  protected async handle() {
    this.jsonResponse({ query: this.request.query });
  }
}

class FlaggedController extends AbstractController {
  @RequireFeatureFlag('paragraphExtraction')
  protected async handle() {
    this.jsonResponse({ ok: true });
  }
}

class StackedController extends AbstractController {
  @RequireFeatureFlag('paragraphExtraction')
  @Authorize(['admin'])
  @ValidateRequest(querySchema)
  protected async handle() {
    this.jsonResponse({ ok: true });
  }
}

const ok = (_req: Request, res: Response) => res.json({ ok: true });
const echoQuery = (req: Request, res: Response) => res.json({ query: req.query });

const routes = (app: Application) => {
  app.get('/decorated/admin', AdminOnlyController.createHandler());
  app.get('/middleware/admin', needsAuthorization(), ok);

  app.get('/decorated/editor', EditorController.createHandler());
  app.get('/middleware/editor', needsAuthorization(['admin', 'editor']), ok);

  app.get('/decorated/validated', ValidatedController.createHandler());
  app.get('/middleware/validated', validation.validateRequest(querySchema), echoQuery);

  app.get('/decorated/coerced', CoercedController.createHandler());

  app.get('/decorated/flagged', FlaggedController.createHandler());
  app.get('/middleware/flagged', featureFlagEnabled('paragraphExtraction'), ok);

  app.get('/decorated/stacked', StackedController.createHandler());
};

let currentRole: UserRole | undefined;

const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
  if (currentRole) {
    req.user = { _id: 'user_id', username: 'user', role: currentRole };
  }
  next();
});

const getBoth = async (route: string) => {
  const decorated = await request(app).get(`/decorated/${route}`);
  const middleware = await request(app).get(`/middleware/${route}`);
  return { decorated, middleware };
};

const withoutRequestId = (body: Record<string, unknown>) => {
  const { requestId, ...rest } = body;
  return rest;
};

describe('controller decorators', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
    });
  });

  beforeEach(() => {
    currentRole = undefined;
    tenants.current().featureFlags = { paragraphExtraction: true };
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Authorize', () => {
    it.each([
      { route: 'admin', role: UserRole.ADMIN },
      { route: 'editor', role: UserRole.ADMIN },
      { route: 'editor', role: UserRole.EDITOR },
    ])('should allow $role on $route', async ({ route, role }) => {
      currentRole = role;

      const response = await request(app).get(`/decorated/${route}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    it.each([
      { route: 'admin', role: undefined },
      { route: 'admin', role: UserRole.EDITOR },
      { route: 'admin', role: UserRole.COLLABORATOR },
      { route: 'editor', role: undefined },
      { route: 'editor', role: UserRole.COLLABORATOR },
    ])('should reject $role on $route exactly like the middleware', async ({ route, role }) => {
      currentRole = role;

      const { decorated, middleware } = await getBoth(route);

      expect(decorated.status).toBe(401);
      expect(decorated.body).toEqual({ error: 'Unauthorized', message: 'Unauthorized' });
      expect(decorated.status).toBe(middleware.status);
      expect(decorated.body).toEqual(middleware.body);
    });
  });

  describe('ValidateRequest', () => {
    it('should call the controller when the request is valid', async () => {
      const response = await request(app).get('/decorated/validated?name=value');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ query: { name: 'value' } });
    });

    it('should reject an invalid request exactly like the middleware', async () => {
      const decorated = await request(app).get('/decorated/validated?unknown=value');
      const middleware = await request(app).get('/middleware/validated?unknown=value');

      expect(decorated.status).toBe(400);
      expect(decorated.status).toBe(middleware.status);
      expect(withoutRequestId(decorated.body)).toEqual(withoutRequestId(middleware.body));
    });

    it('should coerce the request when asked to', async () => {
      const response = await request(app).get('/decorated/coerced?page=2');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ query: { page: 2 } });
    });
  });

  describe('RequireFeatureFlag', () => {
    it('should call the controller when the flag is enabled', async () => {
      const response = await request(app).get('/decorated/flagged');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    it('should reject when the flag is disabled exactly like the middleware', async () => {
      tenants.current().featureFlags = { paragraphExtraction: false };

      const { decorated, middleware } = await getBoth('flagged');

      expect(decorated.status).toBe(403);
      expect(decorated.body).toEqual({ error: 'Feature not available' });
      expect(decorated.status).toBe(middleware.status);
      expect(decorated.body).toEqual(middleware.body);
    });
  });

  describe('when stacked', () => {
    it('should check the feature flag before authorization', async () => {
      tenants.current().featureFlags = { paragraphExtraction: false };

      const response = await request(app).get('/decorated/stacked?unknown=value');

      expect(response.status).toBe(403);
    });

    it('should check authorization before validation', async () => {
      const response = await request(app).get('/decorated/stacked?unknown=value');

      expect(response.status).toBe(401);
    });

    it('should validate once authorized', async () => {
      currentRole = UserRole.ADMIN;

      const response = await request(app).get('/decorated/stacked?unknown=value');

      expect(response.status).toBe(400);
    });

    it('should call the controller when every check passes', async () => {
      currentRole = UserRole.ADMIN;

      const response = await request(app).get('/decorated/stacked?name=value');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });
  });
});
