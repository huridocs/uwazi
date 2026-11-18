import type { Response } from 'express';

import { UnsupportedInSsrClientError } from './UnsupportedInSsrClientError.js';

/**
 * Stands in for the Express response of a controller called in-process. It records the status and
 * body and implements only what read controllers use; touching any other member throws, so a
 * controller that streams, redirects or sets cookies fails loudly instead of answering wrongly.
 */
class CapturingResponse {
  private capturedStatus = 200;

  private capturedBody: unknown;

  private readonly capturedHeaders: Record<string, unknown> = {};

  get statusCode() {
    return this.capturedStatus;
  }

  get body() {
    return this.capturedBody;
  }

  status(code: number) {
    this.capturedStatus = code;
    return this;
  }

  json(body: unknown) {
    this.capturedBody = body;
    return this;
  }

  send(body?: unknown) {
    this.capturedBody = body;
    return this;
  }

  set(name: string, value: unknown) {
    this.capturedHeaders[name.toLowerCase()] = value;
    return this;
  }

  header(name: string, value: unknown) {
    return this.set(name, value);
  }

  end() {
    return this;
  }

  asExpressResponse(): Response {
    return new Proxy(this, {
      get(target, member, receiver) {
        if (typeof member === 'symbol' || member in target) {
          return Reflect.get(target, member, receiver);
        }
        throw new UnsupportedInSsrClientError(member);
      },
    }) as unknown as Response;
  }
}

export { CapturingResponse };
