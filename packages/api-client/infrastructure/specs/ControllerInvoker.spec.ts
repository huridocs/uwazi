import type { Request } from 'express';
import { ObjectId } from 'mongodb';

import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { Authorize } from '#api/core/infrastructure/express/decorators/Authorize.js';
import { ValidateRequest } from '#api/core/infrastructure/express/decorators/ValidateRequest.js';
import { ValidationError } from '#api/core/domain/error/ValidationError.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserRole } from '#shared/types/userSchema.js';

import { ServerApiError } from '../../application/ServerApiError.js';
import { ControllerInvoker } from '../ControllerInvoker.js';
import { UnsupportedInSsrClientError } from '../UnsupportedInSsrClientError.js';

const fixedDate = new Date('2026-01-02T03:04:05.000Z');
const fixedId = new ObjectId();

class EchoController extends AbstractController {
  protected async handle() {
    this.jsonResponse({
      query: this.request.query,
      params: this.request.params,
      language: this.language,
      method: this.request.method,
      path: this.request.path,
      user: this.request.user?.username,
      header: this.request.get('x-page-header'),
    });
  }
}

class RichBodyController extends AbstractController {
  protected async handle() {
    this.jsonResponse({ _id: fixedId, createdAt: fixedDate, missing: undefined });
  }
}

class ClientErrorController extends AbstractController {
  protected async handle() {
    this.clientError('bad input');
  }
}

class InvalidDomainInput extends ValidationError {
  constructor() {
    super('invalid domain input', 'invalid_domain_input');
  }

  // eslint-disable-next-line class-methods-use-this
  asAJV() {
    return { keyword: 'invalid', instancePath: '/field', message: 'invalid domain input' };
  }
}

class DomainValidationController extends AbstractController {
  // eslint-disable-next-line class-methods-use-this
  protected async handle() {
    throw new InvalidDomainInput();
  }
}

class CrashingController extends AbstractController {
  // eslint-disable-next-line class-methods-use-this
  protected async handle() {
    throw new Error('secret internals');
  }
}

class RedirectingController extends AbstractController {
  protected async handle() {
    this.response.redirect('/login');
  }
}

class AdminController extends AbstractController {
  @Authorize(['admin'])
  protected async handle() {
    this.jsonResponse({ ok: true });
  }
}

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

class ValidatedController extends AbstractController {
  @ValidateRequest(querySchema)
  protected async handle() {
    this.jsonResponse({ ok: true });
  }
}

const transactionManagers: unknown[] = [];
const correlationIds: (string | undefined)[] = [];

class ContextRecordingController extends AbstractController {
  protected async handle() {
    transactionManagers.push(ExecutionContext.transactionManager);
    correlationIds.push(ExecutionContext.correlationId);
    await new Promise(resolve => {
      setTimeout(resolve, 5);
    });
    this.jsonResponse({ ok: true });
  }
}

const admin = { _id: 'admin_id', username: 'admin', role: UserRole.ADMIN };

const pageRequest = (overrides: Partial<Request> = {}) =>
  ({
    method: 'GET',
    url: '/en/library',
    path: '/en/library',
    query: { page: 'query' },
    params: {},
    headers: { 'x-page-header': 'from the page' },
    language: 'en',
    get(this: Request, name: string) {
      return this.headers[name.toLowerCase()];
    },
    ...overrides,
  }) as unknown as Request;

const invoke = async <T = unknown>(
  controller: typeof AbstractController,
  invocation: Partial<Parameters<ControllerInvoker['invoke']>[1]> = {},
  request: Request = pageRequest({ user: admin as Request['user'] })
) =>
  new ControllerInvoker(request).invoke<T>(controller, {
    method: 'GET',
    path: '/api/test',
    ...invocation,
  });

const rejectionOf = async (promise: Promise<unknown>): Promise<ServerApiError> =>
  promise.then(
    () => {
      throw new Error('expected the call to fail');
    },
    (error: unknown) => error as ServerApiError
  );

const setPrivate = async (isPrivate: boolean) =>
  testingEnvironment.setFixtures({
    settings: [{ languages: [{ key: 'en', label: 'English', default: true }], private: isPrivate }],
  });

describe('ControllerInvoker', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => {
    await setPrivate(false);
    transactionManagers.length = 0;
    correlationIds.length = 0;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const run = async <T>(fn: () => Promise<T>) => testingEnvironment.runWithContext(fn);

  it('should hand the controller a GET request with the invocation and the page identity', async () => {
    const body = await run(async () =>
      invoke(EchoController, { path: '/api/echo', query: { a: '1' }, params: { id: 'x' } })
    );

    expect(body).toEqual({
      query: { a: '1' },
      params: { id: 'x' },
      language: 'en',
      method: 'GET',
      path: '/api/echo',
      user: 'admin',
      header: 'from the page',
    });
  });

  it('should default query and params to empty objects', async () => {
    const body = await run(async () => invoke<{ query: unknown; params: unknown }>(EchoController));

    expect(body.query).toEqual({});
    expect(body.params).toEqual({});
  });

  it('should let the invocation override the language', async () => {
    const body = await run(async () =>
      invoke<{ language: string }>(EchoController, { language: 'es' })
    );

    expect(body.language).toBe('es');
  });

  it('should not alter the page request', async () => {
    const request = pageRequest({ user: admin as Request['user'] });

    await run(async () =>
      invoke(EchoController, { path: '/api/echo', query: { a: '1' }, language: 'es' }, request)
    );

    expect(request.query).toEqual({ page: 'query' });
    expect(request.path).toBe('/en/library');
    expect(request.language).toBe('en');
  });

  it('should return the body as it would travel over HTTP', async () => {
    const body = await run(async () => invoke(RichBodyController));

    expect(body).toEqual({ _id: fixedId.toString(), createdAt: fixedDate.toISOString() });
  });

  it('should throw a ServerApiError for a captured client error', async () => {
    const error = await rejectionOf(run(async () => invoke(ClientErrorController)));

    expect(error).toBeInstanceOf(ServerApiError);
    expect(error).toMatchObject({
      status: 400,
      message: 'bad input',
      body: { message: 'bad input' },
    });
  });

  it('should map a failed request validation to 400', async () => {
    const error = await rejectionOf(
      run(async () => invoke(ValidatedController, { query: { unknown: 'x' } }))
    );

    expect(error).toBeInstanceOf(ServerApiError);
    expect(error.status).toBe(400);
  });

  it('should map a thrown domain validation error the way the error middleware does', async () => {
    const error = await rejectionOf(run(async () => invoke(DomainValidationController)));

    expect(error).toBeInstanceOf(ServerApiError);
    expect(error.status).toBe(422);
  });

  it('should map an unknown error to a 500 without leaking its message', async () => {
    const error = await rejectionOf(run(async () => invoke(CrashingController)));

    expect(error).toBeInstanceOf(ServerApiError);
    expect(error.status).toBe(500);
    expect(error.message).toBe('A server side error has occurred');
  });

  it('should refuse response methods it cannot capture', async () => {
    const error = await rejectionOf(run(async () => invoke(RedirectingController)));

    expect(error).toBeInstanceOf(UnsupportedInSsrClientError);
    expect(error.message).toContain('res.redirect');
  });

  it('should enforce controller authorization', async () => {
    const error = await rejectionOf(run(async () => invoke(AdminController, {}, pageRequest())));

    expect(error).toBeInstanceOf(ServerApiError);
    expect(error).toMatchObject({ status: 401, message: 'Unauthorized' });
  });

  it('should run each call in its own context with a fresh correlation id', async () => {
    const pageContext = await run(async () => {
      await Promise.all([invoke(ContextRecordingController), invoke(ContextRecordingController)]);
      return {
        transactionManager: ExecutionContext.transactionManager,
        correlationId: ExecutionContext.correlationId,
      };
    });

    expect(transactionManagers).toHaveLength(2);
    expect(transactionManagers[0]).not.toBe(transactionManagers[1]);
    expect(transactionManagers).not.toContain(pageContext.transactionManager);
    expect(correlationIds[0]).toBeDefined();
    expect(correlationIds[0]).not.toBe(correlationIds[1]);
    expect(correlationIds).not.toContain(pageContext.correlationId);
  });

  it('should keep the page tenant, actor and session', async () => {
    let seen: { tenant?: string; actor?: unknown; sessionId?: string } = {};

    class ContextReadingController extends AbstractController {
      protected async handle() {
        seen = {
          tenant: ExecutionContext.tenant.name,
          actor: ExecutionContext.actor,
          sessionId: ExecutionContext.sessionId,
        };
        this.ok();
      }
    }

    const expected = await testingEnvironment.runWithContext(
      async () => {
        await invoke(ContextReadingController);
        return { tenant: ExecutionContext.tenant.name, actor: ExecutionContext.actor };
      },
      { sessionId: 'page-session' }
    );

    expect(expected.actor).toBeDefined();
    expect(seen).toEqual({ ...expected, sessionId: 'page-session' });
  });

  it('should record a span on the page telemetry', async () => {
    const telemetry = await run(async () => {
      await invoke(EchoController, { path: '/api/echo' });
      return ExecutionContext.telemetryCollector.build();
    });

    expect(telemetry.timings).toEqual([
      expect.objectContaining({ operation: 'ssr_client GET /api/echo' }),
    ]);
  });

  it('should require a page execution context', async () => {
    await expect(invoke(EchoController)).rejects.toThrow('ExecutionContext');
  });

  describe('on a private instance', () => {
    beforeEach(async () => {
      await setPrivate(true);
    });

    it('should reject anonymous callers with 401', async () => {
      const error = await rejectionOf(run(async () => invoke(EchoController, {}, pageRequest())));

      expect(error).toBeInstanceOf(ServerApiError);
      expect(error.status).toBe(401);
    });

    it('should serve logged-in callers', async () => {
      const body = await run(async () => invoke<{ user: string }>(EchoController));

      expect(body.user).toBe('admin');
    });
  });
});
