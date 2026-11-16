import type { Request } from 'express';

import type { LanguageISO6391 } from '#shared/types/commonTypes.js';

type Invocation = {
  method: 'GET';
  path: string;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  language?: LanguageISO6391;
};

/**
 * The request a controller sees when called in-process: the page request's identity (user,
 * headers, cookies, session) with the invocation's method, path, query, params and language.
 * The page request itself is never modified.
 */
class SyntheticRequest {
  static from(page: Request, invocation: Invocation): Request {
    const own = (value: unknown): PropertyDescriptor => ({
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    return Object.create(page, {
      method: own(invocation.method),
      url: own(invocation.path),
      originalUrl: own(invocation.path),
      path: own(invocation.path),
      query: own(invocation.query ?? {}),
      params: own(invocation.params ?? {}),
      body: own({}),
      language: own(invocation.language ?? page.language),
    }) as Request;
  }
}

export { SyntheticRequest };
export type { Invocation };
