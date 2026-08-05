/* eslint-disable max-params */
import { buildApiError, normalizeHttpErrorBody } from '../normalizeError.js';
import type { ApiErrorInit } from '../ApiError.js';
import type { TransportEndpoint, TransportSuccess } from './types.js';

type JsonObject = Record<string, unknown>;
type JsonBody = JsonObject | unknown[];

type ReadBodyResult =
  | { kind: 'empty'; body: JsonObject }
  | { kind: 'json'; body: JsonBody; contentType: string }
  | { kind: 'invalid'; body: JsonObject; contentType: string; raw: string }
  | { kind: 'unsupported'; body: JsonObject; contentType: string; raw: string };

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toJsonBody = (value: unknown): JsonBody => {
  if (Array.isArray(value)) return value;
  if (isJsonObject(value)) return value;
  return { value };
};

const tryParseJson = (text: string, contentType: string): ReadBodyResult => {
  try {
    return { kind: 'json', body: toJsonBody(JSON.parse(text)), contentType };
  } catch {
    return { kind: 'invalid', body: {}, contentType, raw: text };
  }
};

const readResponseText = (text: string, contentType: string, status: number): ReadBodyResult => {
  if (!text.trim()) return { kind: 'empty', body: {} };
  if (contentType.includes('json')) return tryParseJson(text, contentType);
  if (status >= 400) {
    const parsed = tryParseJson(text, contentType);
    if (parsed.kind === 'json') return parsed;
  }
  return { kind: 'unsupported', body: {}, contentType, raw: text };
};

const readFetchBody = async (response: Response): Promise<ReadBodyResult> => {
  if (response.status === 204 || response.status === 205) return { kind: 'empty', body: {} };
  const contentType = response.headers.get('Content-Type') ?? '';
  return readResponseText(await response.text(), contentType, response.status);
};

const readHeadBody = (): ReadBodyResult => ({ kind: 'empty', body: {} });

const getStatusMessage = (statusText: string, bodyResult: ReadBodyResult): string => {
  if (
    bodyResult.kind === 'json' &&
    isJsonObject(bodyResult.body) &&
    typeof bodyResult.body.message === 'string'
  ) {
    return bodyResult.body.message;
  }
  return statusText;
};

const toTransportError = (
  status: number,
  statusText: string,
  headers: Headers,
  bodyResult: ReadBodyResult,
  endpoint: TransportEndpoint,
  setCookie?: string
) => {
  const parseError = bodyResult.kind === 'invalid';
  const body = bodyResult.kind === 'json' ? bodyResult.body : {};
  const contentType =
    bodyResult.kind === 'json' || bodyResult.kind === 'invalid'
      ? bodyResult.contentType
      : headers.get('Content-Type');

  const init = normalizeHttpErrorBody({
    body,
    status,
    statusText: getStatusMessage(statusText, bodyResult),
    contentType,
    headers,
    parseError,
  });

  return buildApiError(init, endpoint, headers, setCookie);
};

const toUnsupportedContentTypeError = (
  status: number,
  statusText: string,
  headers: Headers,
  endpoint: TransportEndpoint,
  setCookie?: string
) => {
  const init: ApiErrorInit = {
    kind: 'parse',
    status,
    code: 'unsupported_content_type',
    title: statusText,
    detail: 'Response body content type is not supported',
    retryable: false,
  };
  return buildApiError(init, endpoint, headers, setCookie);
};

const assertTransportSuccess = (
  status: number,
  statusText: string,
  headers: Headers,
  bodyResult: ReadBodyResult,
  endpoint: TransportEndpoint,
  setCookie?: string
): TransportSuccess => {
  if (status < 200 || status >= 300) {
    throw toTransportError(status, statusText, headers, bodyResult, endpoint, setCookie);
  }
  if (bodyResult.kind === 'invalid') {
    throw toTransportError(status, statusText, headers, bodyResult, endpoint, setCookie);
  }
  if (bodyResult.kind === 'unsupported') {
    throw toUnsupportedContentTypeError(status, statusText, headers, endpoint, setCookie);
  }
  return { body: bodyResult.body, status, headers, setCookie, endpoint };
};

export { assertTransportSuccess, readFetchBody, readHeadBody, readResponseText };
