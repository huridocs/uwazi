import type { Request } from 'express';

type Query = Record<string, unknown>;
type Params = Record<string, string>;

/**
 * The request a controller sees when called in-process: the page request's identity (user,
 * headers, cookies, session, language) with the call's own query and params.
 * The page request itself is never modified.
 */
class SyntheticRequest {
  static from(page: Request, query: Query = {}, params: Params = {}): Request {
    const own = (value: unknown): PropertyDescriptor => ({
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    return Object.create(page, {
      query: own(query),
      params: own(params),
      body: own({}),
    }) as Request;
  }
}

export { SyntheticRequest };
export type { Query, Params };
