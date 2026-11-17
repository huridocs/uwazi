import type { Application, NextFunction, Request, Response } from 'express';
import qs from 'qs';
import request from 'supertest';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { User } from '#api/users.v2/model/User.js';
import { UserRole } from '#shared/types/userSchema.js';

import { ServerApiError } from '../../../application/ServerApiError.js';
import type { ServerApiClient } from '../../../application/ServerApiClient.js';
import { createServerApiClient } from '../../createServerApiClient.js';

type Caller = Request['user'] | undefined;

/**
 * How the route expects its query string: plain `qs` (Express's own parser), or one JSON value per
 * key for routes behind `parseQuery`, which is how the front end sends them.
 */
type Encoding = 'qs' | 'json';

type Outcome = { status: number; body: unknown };

const encode = (query: object, encoding: Encoding) =>
  qs.stringify(
    encoding === 'qs'
      ? query
      : Object.fromEntries(
          Object.entries(query).map(([key, value]) => [
            key,
            typeof value === 'string' ? value : JSON.stringify(value),
          ])
        )
  );

/** The HTTP call and the SSR call belong to different requests, so only their correlation ids may differ. */
const withoutRequestId = (body: unknown) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const { requestId, ...rest } = body as Record<string, unknown>;
  return rest;
};

const callers = {
  admin: {
    _id: '64b000000000000000000001',
    username: 'admin',
    role: UserRole.ADMIN,
    email: 'admin@uwazi.io',
  },
  editor: {
    _id: '64b000000000000000000002',
    username: 'editor',
    role: UserRole.EDITOR,
    email: 'editor@uwazi.io',
  },
  anonymous: undefined,
} satisfies Record<string, Caller>;

/**
 * Calls the same endpoint over HTTP (supertest against the real routes) and through the server
 * client, as the same caller, so specs can assert the two answer identically.
 */
class ParityHarness {
  private caller: Caller;

  private language = 'en';

  private readonly app: Application;

  constructor(routes: (app: Application) => void) {
    this.app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      if (this.caller) {
        req.user = this.caller;
      }
      next();
    });
  }

  as(caller: Caller) {
    this.caller = caller;
    return this;
  }

  /** The page language: sent as `content-language` over HTTP, set on the page request otherwise. */
  in(language: string) {
    this.language = language;
    return this;
  }

  async http(path: string, query: object = {}, encoding: Encoding = 'qs') {
    return request(this.app)
      .get(path)
      .set('content-language', this.language)
      .query(encode(query, encoding));
  }

  /** Both sides' status and body, so success and failure can be compared alike. */
  async outcomes(
    path: string,
    call: (client: ServerApiClient) => Promise<unknown>,
    { query = {}, encoding = 'qs' }: { query?: object; encoding?: Encoding } = {}
  ): Promise<{ http: Outcome; client: Outcome }> {
    const response = await this.http(path, query, encoding);
    const client = await this.client(call).then(
      (body): Outcome => ({ status: 200, body }),
      (error: unknown): Outcome => {
        if (!(error instanceof ServerApiError)) throw error;
        return { status: error.status, body: withoutRequestId(error.body) };
      }
    );

    return { http: { status: response.status, body: withoutRequestId(response.body) }, client };
  }

  async client<T>(call: (client: ServerApiClient) => Promise<T>): Promise<T> {
    const { caller, language } = this;
    const pageRequest = {
      user: caller,
      headers: {},
      language,
      query: {},
      params: {},
      get: () => undefined,
    } as unknown as Request;

    return testingEnvironment.runWithContext(async () => call(createServerApiClient(pageRequest)), {
      actor: User.createFrom(caller ?? null),
    });
  }
}

export { ParityHarness, callers };
