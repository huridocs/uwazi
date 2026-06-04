import type { FetchResponseError } from '#shared/JSONRequest.js';
import type { Entity } from '#V2/api/entities/types.js';

type LoaderResponse =
  | {
      entity?: Entity;
      error?: FetchResponseError;
    }
  | undefined;

export type { LoaderResponse };
