import type { Request, Response } from 'express';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { dependenciesContextMiddleware } from '../DependenciesMiddleware.js';

const buildRequest = (headers: Record<string, string>) =>
  ({
    get: (name: string) => headers[name.toLowerCase()],
  }) as unknown as Request;

const response = { on: jest.fn() } as unknown as Response;

const sessionIdSeenBy = (request: Request) => {
  let seen: string | undefined = 'not called';
  dependenciesContextMiddleware(request, response, () => {
    seen = ExecutionContext.sessionId;
  });
  return seen;
};

describe('dependenciesContextMiddleware', () => {
  beforeAll(() => {
    testingTenants.mockCurrentTenant({ name: 'default' });
  });

  afterAll(() => {
    testingTenants.restoreCurrentFn();
  });

  it('should expose the connect.sid cookie as the context sessionId', () => {
    const request = buildRequest({ cookie: 'locale=en; connect.sid=s%3Aabc.signature' });

    expect(sessionIdSeenBy(request)).toBe('s:abc.signature');
  });

  it('should leave sessionId undefined when the request has no session cookie', () => {
    expect(sessionIdSeenBy(buildRequest({ cookie: 'locale=en' }))).toBeUndefined();
    expect(sessionIdSeenBy(buildRequest({}))).toBeUndefined();
  });
});
