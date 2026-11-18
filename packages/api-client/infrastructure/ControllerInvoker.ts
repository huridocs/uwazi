import type { Request, Response } from 'express';

import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ExecutionContextFactory } from '#api/core/infrastructure/factories/ExecutionContextFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

import { ServerApiError } from '../application/ServerApiError.js';
import { CapturingResponse } from './CapturingResponse.js';
import { type Params, type Query, SyntheticRequest } from './SyntheticRequest.js';

type ControllerClass = {
  createHandler(): (request: Request, response: Response) => Promise<void>;
};

const messageOf = (status: number, body: unknown) => {
  if (body && typeof body === 'object') {
    const { error, message } = body as { error?: unknown; message?: unknown };
    if (typeof error === 'string') return error;
    if (typeof message === 'string') return message;
  }
  return `Request failed with status ${status}`;
};

/**
 * Calls an AbstractController in-process on behalf of a server-rendered page, as if the page had
 * made the HTTP request itself, and returns the JSON body it would have sent.
 *
 * An error status the controller answers with becomes a ServerApiError. Anything the controller
 * throws propagates untouched, for the server side render error handling to deal with.
 */
class ControllerInvoker {
  constructor(private readonly pageRequest: Request) {}

  async invoke<T>(controller: ControllerClass, query?: Query, params?: Params): Promise<T> {
    const pageContext = ExecutionContext.getStore();
    if (!pageContext) {
      throw new Error(
        'ControllerInvoker requires an active ExecutionContext (the server side render page request)'
      );
    }

    const collector = ExecutionContext.telemetryCollector;

    return ExecutionContextFactory.run(
      {
        tenant: pageContext.tenant,
        actor: pageContext.actor,
        sessionId: pageContext.sessionId,
        correlationId: pageContext.correlationId,
        telemetry: { kind: 'http_request' },
        overrides: { telemetryCollector: () => collector },
      },
      async () => this.call<T>(controller, query, params)
    );
  }

  private async call<T>(controller: ControllerClass, query?: Query, params?: Params): Promise<T> {
    await this.ensureInstanceAccess();

    const request = SyntheticRequest.from(this.pageRequest, query, params);
    const response = new CapturingResponse();

    await controller.createHandler()(request, response.asExpressResponse());

    if (response.statusCode >= 400) {
      throw new ServerApiError(
        response.statusCode,
        messageOf(response.statusCode, response.body),
        response.body
      );
    }

    return (
      response.body === undefined ? undefined : JSON.parse(JSON.stringify(response.body))
    ) as T;
  }

  /** Mirrors PrivateInstanceMiddleware for `/api/*`. */
  private async ensureInstanceAccess() {
    if (this.pageRequest.user) return;

    const settings = await SettingsDataSourceFactory.cached().get();
    if (settings.isPrivate) {
      throw new ServerApiError(401, 'Unauthorized', { error: 'Unauthorized' });
    }
  }
}

export { ControllerInvoker };
export type { ControllerClass };
