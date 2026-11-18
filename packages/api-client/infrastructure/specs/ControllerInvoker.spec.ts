import { ValidationError as AJVValidationError } from 'ajv';
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
  { query, params }: { query?: Record<string, unknown>; params?: Record<string, string> } = {},
  request: Request = pageRequest({ user: admin as Request['user'] })
) => new ControllerInvoker(request).invoke<T>(controller, query, params);

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

  it('should hand the controller the query, params and the page identity', async () => {
    const body = await run(async () =>
      invoke(EchoController, { query: { a: '1' }, params: { id: 'x' } })
    );

    expect(body).toEqual({
      query: { a: '1' },
      params: { id: 'x' },
      language: 'en',
      user: 'admin',
      header: 'from the page',
    });
  });

  it('should default query and params to empty objects', async () => {
    const body = await run(async () => invoke<{ query: unknown; params: unknown }>(EchoController));

    expect(body.query).toEqual({});
    expect(body.params).toEqual({});
  });

  it('should not alter the page request', async () => {
    const request = pageRequest({ user: admin as Request['user'] });

    await run(async () =>
      invoke(EchoController, { query: { a: '1' }, params: { id: 'x' } }, request)
    );

    expect(request.query).toEqual({ page: 'query' });
    expect(request.params).toEqual({});
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

  it('should let a failed request validation propagate as the controller threw it', async () => {
    const error = await rejectionOf(
      run(async () => invoke(ValidatedController, { query: { unknown: 'x' } }))
    );

    expect(error).not.toBeInstanceOf(ServerApiError);
    expect(error).toMatchObject({ code: 400 });
  });

  it('should let a thrown domain validation error propagate as the controller threw it', async () => {
    const error = await rejectionOf(run(async () => invoke(DomainValidationController)));

    expect(error).toBeInstanceOf(AJVValidationError);
  });

  it('should let an unknown error propagate as the controller threw it', async () => {
    const error = await rejectionOf(run(async () => invoke(CrashingController)));

    expect(error).not.toBeInstanceOf(ServerApiError);
    expect(error.message).toBe('secret internals');
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

  it('should run each call in its own context sharing the page correlation id', async () => {
    const pageContext = await testingEnvironment.runWithContext(
      async () => {
        await Promise.all([invoke(ContextRecordingController), invoke(ContextRecordingController)]);
        return {
          transactionManager: ExecutionContext.transactionManager,
          correlationId: ExecutionContext.correlationId,
        };
      },
      { correlationId: 'page-correlation-id' }
    );

    expect(transactionManagers).toHaveLength(2);
    expect(transactionManagers[0]).not.toBe(transactionManagers[1]);
    expect(transactionManagers).not.toContain(pageContext.transactionManager);
    expect(pageContext.correlationId).toBeDefined();
    expect(correlationIds).toEqual([pageContext.correlationId, pageContext.correlationId]);
  });

  it('should build its own dependencies instead of the page ones', async () => {
    const pageIdGenerator = { generate: () => 'from the page' };
    let seen: unknown;

    class DependencyReadingController extends AbstractController {
      protected async handle() {
        seen = ExecutionContext.idGenerator;
        this.ok();
      }
    }

    await testingEnvironment.runWithContext(async () => invoke(DependencyReadingController), {
      factories: { idGenerator: () => pageIdGenerator },
    });

    expect(seen).toBeDefined();
    expect(seen).not.toBe(pageIdGenerator);
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

  it('should require a page execution context', async () => {
    await expect(invoke(EchoController)).rejects.toThrow(
      'ControllerInvoker requires an active ExecutionContext'
    );
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
