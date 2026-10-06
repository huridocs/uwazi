import type { IncomingHttpHeaders } from 'http';
import { apiClient } from '../client.js';
import { requestHeaders } from '../requestHeaders.js';

type MultipleUpdateRequest = {
  ids: string[];
  values: {
    metadata?: Record<string, unknown[]>;
    translations?: Record<string, Record<string, unknown[]>>;
    template?: string;
  };
};

const withLanguage = (language: string, headers?: IncomingHttpHeaders) => ({
  ...requestHeaders(headers),
  'Content-Language': language,
});

const multipleUpdate = async (
  request: MultipleUpdateRequest,
  language: string,
  headers?: IncomingHttpHeaders
) =>
  apiClient.postJson('entities/multipleupdate', request, {
    headers: withLanguage(language, headers),
    language,
  });

export type { MultipleUpdateRequest };
export { multipleUpdate };
