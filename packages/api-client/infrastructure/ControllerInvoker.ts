import type { Request, Response } from 'express';

import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { handleError } from '#api/utils/handleError.js';

import { ServerApiError } from '../application/ServerApiError.js';
import { CapturingResponse } from './CapturingResponse.js';
import { UnsupportedInSsrClientError } from './UnsupportedInSsrClientError.js';
import { type Invocation, SyntheticRequest } from './SyntheticRequest.js';

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
 */
class ControllerInvoker {
  constructor(private readonly pageRequest: Request) {}

  async invoke<T>(controller: ControllerClass, invocation: Invocation): Promise<T> {
    const pageContext = ExecutionContext.getStore();
    if (!pageContext) {
      throw new Error(
        'ControllerInvoker requires an active ExecutionContext (the server side render page request)'
      );
    }

    const collector = ExecutionContext.telemetryCollector;

    return ExecutionContext.run(
      {
        factories: { ...pageContext.factories, telemetryCollector: () => collector },
        tenant: pageContext.tenant,
        actor: pageContext.actor,
        sessionId: pageContext.sessionId,
        correlationId: pageContext.correlationId,
      },
      async () =>
        collector.runSpan(`ssr_client ${invocation.method} ${invocation.path}`, async () =>
          this.call<T>(controller, invocation)
        )
    );
  }

  private async call<T>(controller: ControllerClass, invocation: Invocation): Promise<T> {
    await this.ensureInstanceAccess();

    const request = SyntheticRequest.from(this.pageRequest, invocation);
    const response = new CapturingResponse();

    try {
      await controller.createHandler()(request, response.asExpressResponse());
    } catch (error) {
      throw ControllerInvoker.toServerApiError(error, request);
    }

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

  /** Maps a thrown error the way errorHandlingMiddleware would, logging included. */
  private static toServerApiError(error: unknown, request: Request) {
    if (error instanceof UnsupportedInSsrClientError) return error;

    const { message, code, ...rest } = handleError(error, { req: request });
    const body = { error: message, ...rest };
    return new ServerApiError(code, messageOf(code, body), body);
  }
}

export { ControllerInvoker };
export type { ControllerClass, Invocation };
