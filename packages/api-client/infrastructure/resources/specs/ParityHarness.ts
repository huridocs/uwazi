import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { User } from '#api/users.v2/model/User.js';
import { UserRole } from '#shared/types/userSchema.js';

import type { ServerApiClient } from '../../../application/ServerApiClient.js';
import { createServerApiClient } from '../../createServerApiClient.js';

type Caller = Request['user'] | undefined;

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

  async http(path: string, query: Record<string, string> = {}) {
    return request(this.app).get(path).query(query);
  }

  async client<T>(call: (client: ServerApiClient) => Promise<T>): Promise<T> {
    const { caller } = this;
    const pageRequest = {
      user: caller,
      headers: {},
      language: 'en',
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
